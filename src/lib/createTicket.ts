import { prisma } from "./prisma";
import { sendTicketEmail } from "./email";
import type { Event, Ticket } from "@prisma/client";

/**
 * Zentrale Stelle, an der ein Ticket entsteht — egal ob über die kostenlose
 * Gästeliste oder nach erfolgreicher Stripe-Zahlung. Erzeugt den DB-Eintrag
 * und verschickt danach die Ticket-E-Mail mit QR-Code (Fehler beim Mailversand
 * lassen das Ticket trotzdem gültig bleiben — wird nur geloggt).
 */
export async function createTicketAndSendEmail(params: {
  event: Event;
  name: string;
  email: string;
  phone?: string | null;
  amountCents?: number | null;
  /** Servicegebühr beim Online-Kauf (siehe lib/serviceFee.ts). */
  feeCents?: number | null;
  /** Gewährter Rabatt für dieses Ticket. */
  discountCents?: number | null;
  discountCode?: string | null;
  tierLabel?: string | null;
  /** Verkaufsphase, in der gekauft wurde — Grundlage für das Restkontingent. */
  phaseId?: string | null;
  /** Sprache des Gasts — bestimmt die Sprache der Ticket-E-Mail. */
  locale?: string | null;
  stripeSessionId?: string | null;
  stripePaymentIntentId?: string | null;
}) {
  const ticket = await prisma.ticket.create({
    data: {
      eventId: params.event.id,
      name: params.name,
      email: params.email,
      phone: params.phone || null,
      amountCents: params.amountCents ?? null,
      feeCents: params.feeCents ?? null,
      discountCents: params.discountCents ?? null,
      discountCode: params.discountCode ?? null,
      tierLabel: params.tierLabel ?? null,
      phaseId: params.phaseId ?? null,
      locale: params.locale ?? undefined,
      currency: params.event.currency,
      status: "VALID",
      stripeSessionId: params.stripeSessionId ?? null,
      stripePaymentIntentId: params.stripePaymentIntentId ?? null
    }
  });

  await sendTicketEmailWithRetry(ticket, params.event);

  return ticket;
}

/**
 * Verschickt die Ticket-E-Mail — mit einem zweiten Versuch nach kurzer Pause.
 * SMTP-Anbieter haben kurze Aussetzer (Verbindungsabbruch, Warteschlange
 * voll); ein zweiter Versuch reicht meistens. Bewusst nur zwei Versuche:
 * der Aufruf hängt an der Gästelisten-Anmeldung bzw. am Stripe-Webhook, und
 * Vercel bricht Funktionen nach zehn Sekunden ab — mehr Warten würde dem
 * Gast einen Fehler zeigen, obwohl sein Ticket längst existiert. Bleibt es
 * beim Fehler, bleibt das Ticket gültig und emailSentAt leer — in der
 * Gästetabelle erscheint dann "E-Mail erneut senden".
 *
 * Wird auch vom Admin-Knopf "erneut senden" benutzt.
 */
export async function sendTicketEmailWithRetry(
  ticket: Ticket,
  event: Pick<Event, "title" | "titleEn" | "dateStart" | "venue" | "address">,
  attempts = 2
): Promise<boolean> {
  // isPaid/isDoorPrice werden bewusst am tatsächlichen Kaufweg dieses konkreten
  // Tickets festgemacht (stripeSessionId gesetzt = online bezahlt) statt am
  // event.ticketMode — bei ticketMode "BOTH" sagt der Event-Modus allein nicht
  // mehr aus, ob dieses Ticket per Stripe-Kauf oder Gästeliste entstanden ist.
  const isPaid = Boolean(ticket.stripeSessionId);
  const isDoorPrice = !isPaid && Boolean(ticket.amountCents);

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await sendTicketEmail({
        to: ticket.email,
        name: ticket.name,
        ticketId: ticket.id,
        // Bei englischsprachigen Gästen den englischen Eventtitel verwenden,
        // sofern gepflegt — sonst bleibt es beim deutschen Original.
        eventTitle:
          ticket.locale === "en" && event.titleEn?.trim() ? event.titleEn : event.title,
        eventDateStart: event.dateStart,
        eventVenue: event.venue,
        eventAddress: event.address,
        isPaid,
        isDoorPrice,
        amountCents: ticket.amountCents,
        // Bei Online-Käufen zeigt die Mail den tatsächlich gezahlten Gesamtbetrag
        // inkl. Servicegebühr — sonst stünde dort weniger, als abgebucht wurde.
        feeCents: ticket.feeCents,
        locale: ticket.locale
      });
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { emailSentAt: new Date() }
      });
      return true;
    } catch (err) {
      console.error(
        `[createTicket] E-Mail-Versand für Ticket ${ticket.id} fehlgeschlagen (Versuch ${attempt}/${attempts}):`,
        err
      );
      if (attempt < attempts) {
        await new Promise((r) => setTimeout(r, 1500));
      }
    }
  }
  return false;
}

/**
 * Wie viele Personen ein Event schon auf der Liste hat (nicht stornierte/
 * erstattete Einträge). Bewusst die Summe der partySize statt der Zeilenzahl:
 * ein manueller Eintrag "Max Mustermann +2" belegt drei Plätze, nicht einen —
 * sonst wäre die Kapazitätsgrenze faktisch wirkungslos, sobald Promoter mit
 * Begleitungen arbeiten.
 */
export async function countActiveTickets(eventId: string) {
  const result = await prisma.ticket.aggregate({
    where: {
      eventId,
      status: { in: ["VALID", "CHECKED_IN"] }
    },
    _sum: { partySize: true }
  });

  return result._sum.partySize ?? 0;
}

/**
 * Wie viele Personen über die Gästeliste auf dem Event stehen — für das
 * eigene Gästelisten-Kontingent (Event.guestlistCapacity).
 *
 * Abgrenzung zum Ticketkauf über stripeSessionId: online bezahlte Tickets
 * haben eine Stripe-Session, Gästelisten-Einträge nicht. Manuell im Admin
 * eingetragene Promoter-Gäste zählen bewusst mit — sie stehen genauso auf
 * der Liste und nehmen an der Tür genauso Platz weg.
 */
export async function countGuestlistPeople(eventId: string) {
  const result = await prisma.ticket.aggregate({
    where: {
      eventId,
      status: { in: ["VALID", "CHECKED_IN"] },
      stripeSessionId: null
    },
    _sum: { partySize: true }
  });

  return result._sum.partySize ?? 0;
}
