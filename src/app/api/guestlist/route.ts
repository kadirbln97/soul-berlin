import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validation";
import {
  countActiveTickets,
  countGuestlistPeople,
  createTicketRecord,
  sendTicketEmailWithRetry,
  withEventLock
} from "@/lib/createTicket";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { getCurrentGuestlistTier } from "@/lib/guestlistTiers";
import { einwilligungErfassen } from "@/lib/newsletter";
import { sendNewsletterConfirmEmail } from "@/lib/email";
import { getLocale } from "@/lib/serverLocale";

export async function POST(req: Request) {
  // Schutz vor Spam-Anmeldungen / E-Mail-Flut: max. 5 Anmeldungen pro 10 Minuten pro IP.
  const ip = getClientIp(req);
  const rl = await checkRateLimit(`guestlist:${ip}`, 5, 10 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Zu viele Anmeldungen. Bitte in ein paar Minuten erneut versuchen." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);

  // Honeypot (siehe SignupForm.tsx): ausgefüllt heißt Bot. Bewusst ein
  // "ok" zurückgeben statt eines Fehlers, damit der Bot nichts lernt.
  if (typeof body?.website === "string" && body.website.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const parsed = signupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" },
      { status: 400 }
    );
  }

  const { eventId, name, email, phone } = parsed.data;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { guestlistTiers: { orderBy: { untilTime: "asc" } } }
  });

  if (!event || event.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Event nicht gefunden" }, { status: 404 });
  }

  if (event.ticketMode !== "GUESTLIST" && event.ticketMode !== "BOTH") {
    return NextResponse.json(
      { error: "Dieses Event läuft über kostenpflichtige Tickets, nicht über die Gästeliste." },
      { status: 400 }
    );
  }

  if (event.ticketSalesEndAt && new Date() > event.ticketSalesEndAt) {
    return NextResponse.json(
      { error: "Die Anmeldung zur Gästeliste ist für dieses Event bereits geschlossen." },
      { status: 400 }
    );
  }

  // Preis + Kategorie (Staffel) werden zum Zeitpunkt der Anmeldung festgestellt
  // und als Snapshot im Ticket gespeichert (informativ — Zahlung erfolgt an
  // der Abendkasse, keine Online-Zahlung). Der Staffel-Name wandert mit auf
  // das Ticket, damit der Scanner später Check-ins pro Kategorie auswerten kann.
  const currentTier = getCurrentGuestlistTier(event.guestlistTiers);
  const locale = await getLocale();

  // Kapazität, Kontingent, Doppelanmeldung und Anlage in EINER Transaktion mit
  // gesperrter Event-Zeile: Gleichzeitige Anmeldungen werden nacheinander
  // abgearbeitet, die Liste kann nicht mehr überlaufen (OWASP: Business Logic).
  const outcome = await withEventLock(event.id, async (tx) => {
    if (event.capacity) {
      const active = await countActiveTickets(event.id, tx);
      if (active >= event.capacity) {
        return { error: "Dieses Event ist leider ausverkauft.", status: 409 } as const;
      }
    }

    // Eigenes Gästelisten-Kontingent. Bewusst eine getrennte Meldung: Bei einem
    // Event mit beiden Wegen ist die Gästeliste dann zu, Tickets gibt es aber
    // weiterhin — "ausverkauft" wäre hier schlicht falsch.
    if (event.guestlistCapacity) {
      const aufDerListe = await countGuestlistPeople(event.id, tx);
      if (aufDerListe >= event.guestlistCapacity) {
        return { error: "Die Gästeliste für dieses Event ist voll.", status: 409 } as const;
      }
    }

    const existing = await tx.ticket.findFirst({
      where: {
        eventId: event.id,
        email: email.toLowerCase(),
        status: { in: ["VALID", "CHECKED_IN"] }
      }
    });
    if (existing) {
      return {
        error: "Diese E-Mail-Adresse steht für dieses Event bereits auf der Gästeliste.",
        status: 409
      } as const;
    }

    const ticket = await createTicketRecord(
      {
        event,
        name,
        email: email.toLowerCase(),
        phone,
        amountCents: currentTier ? currentTier.priceCents : null,
        tierLabel: currentTier ? currentTier.resolvedLabel : null,
        locale
      },
      tx
    );
    return { ticket } as const;
  });

  if ("error" in outcome) {
    return NextResponse.json({ error: outcome.error }, { status: outcome.status });
  }
  const ticket = outcome.ticket;

  // E-Mail bewusst außerhalb der Transaktion — sonst hält der SMTP-Versand
  // die Sperre für alle anderen Anmeldungen.
  await sendTicketEmailWithRetry(ticket, event);

  // Einwilligung in Event-Ankündigungen — nur wenn der Haken gesetzt wurde.
  // Bewusst nach der Anmeldung und in einem eigenen try/catch: ob die
  // Bestätigungsmail rausgeht, darf die Gästelisten-Anmeldung nie gefährden.
  if (parsed.data.newsletter === true) {
    try {
      const confirmToken = await einwilligungErfassen({
        email: email.toLowerCase(),
        name,
        ip
      });
      if (confirmToken) {
        await sendNewsletterConfirmEmail({
          to: email.toLowerCase(),
          name,
          confirmToken
        });
      }
    } catch (err) {
      console.error("[guestlist] Newsletter-Bestätigung fehlgeschlagen:", err);
    }
  }

  return NextResponse.json({ ok: true, ticketId: ticket.id });
}
