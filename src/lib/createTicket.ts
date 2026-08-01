import { prisma } from "./prisma";
import { sendTicketEmail } from "./email";
import type { Event } from "@prisma/client";

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
      currency: params.event.currency,
      status: "VALID",
      stripeSessionId: params.stripeSessionId ?? null,
      stripePaymentIntentId: params.stripePaymentIntentId ?? null
    }
  });

  // isPaid/isDoorPrice werden bewusst am tatsächlichen Kaufweg dieses konkreten
  // Tickets festgemacht (stripeSessionId gesetzt = online bezahlt) statt am
  // event.ticketMode — bei ticketMode "BOTH" sagt der Event-Modus allein nicht
  // mehr aus, ob dieses Ticket per Stripe-Kauf oder Gästeliste entstanden ist.
  const isPaid = Boolean(params.stripeSessionId);
  const isDoorPrice = !isPaid && Boolean(ticket.amountCents);

  try {
    await sendTicketEmail({
      to: ticket.email,
      name: ticket.name,
      ticketId: ticket.id,
      eventTitle: params.event.title,
      eventDateStart: params.event.dateStart,
      eventVenue: params.event.venue,
      eventAddress: params.event.address,
      isPaid,
      isDoorPrice,
      amountCents: ticket.amountCents,
      // Bei Online-Käufen zeigt die Mail den tatsächlich gezahlten Gesamtbetrag
      // inkl. Servicegebühr — sonst stünde dort weniger, als abgebucht wurde.
      feeCents: ticket.feeCents
    });
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { emailSentAt: new Date() }
    });
  } catch (err) {
    // Ticket bleibt gültig — E-Mail kann bei Bedarf im Admin-Bereich erneut ausgelöst werden.
    console.error(`[createTicket] E-Mail-Versand fehlgeschlagen für Ticket ${ticket.id}:`, err);
  }

  return ticket;
}

/** Wie viele gültige (nicht stornierte/erstattete) Tickets ein Event schon hat. */
export async function countActiveTickets(eventId: string) {
  return prisma.ticket.count({
    where: {
      eventId,
      status: { in: ["VALID", "CHECKED_IN"] }
    }
  });
}
