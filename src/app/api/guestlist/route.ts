import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validation";
import { createTicketAndSendEmail, countActiveTickets } from "@/lib/createTicket";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { getCurrentGuestlistTier } from "@/lib/guestlistTiers";

export async function POST(req: Request) {
  // Schutz vor Spam-Anmeldungen / E-Mail-Flut: max. 5 Anmeldungen pro 10 Minuten pro IP.
  const ip = getClientIp(req);
  const rl = checkRateLimit(`guestlist:${ip}`, 5, 10 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Zu viele Anmeldungen. Bitte in ein paar Minuten erneut versuchen." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
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

  if (event.ticketMode !== "GUESTLIST") {
    return NextResponse.json(
      { error: "Dieses Event läuft über kostenpflichtige Tickets, nicht über die Gästeliste." },
      { status: 400 }
    );
  }

  if (event.capacity) {
    const active = await countActiveTickets(event.id);
    if (active >= event.capacity) {
      return NextResponse.json({ error: "Dieses Event ist leider ausverkauft." }, { status: 409 });
    }
  }

  const existing = await prisma.ticket.findFirst({
    where: {
      eventId: event.id,
      email: email.toLowerCase(),
      status: { in: ["VALID", "CHECKED_IN"] }
    }
  });

  if (existing) {
    return NextResponse.json(
      { error: "Diese E-Mail-Adresse steht für dieses Event bereits auf der Gästeliste." },
      { status: 409 }
    );
  }

  // Preis + Kategorie (Staffel) werden zum Zeitpunkt der Anmeldung festgestellt
  // und als Snapshot im Ticket gespeichert (informativ — Zahlung erfolgt an
  // der Abendkasse, keine Online-Zahlung). Der Staffel-Name wandert mit auf
  // das Ticket, damit der Scanner später Check-ins pro Kategorie auswerten kann.
  const currentTier = getCurrentGuestlistTier(event.guestlistTiers);

  const ticket = await createTicketAndSendEmail({
    event,
    name,
    email: email.toLowerCase(),
    phone,
    amountCents: currentTier ? currentTier.priceCents : null,
    tierLabel: currentTier ? currentTier.resolvedLabel : null
  });

  return NextResponse.json({ ok: true, ticketId: ticket.id });
}
