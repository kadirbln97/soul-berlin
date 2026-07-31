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
      tierLabel: params.tierLabel ?? null,
      currency: params.event.currency,
      status: "VALID",
      stripeSessionId: params.stripeSessionId ?? null,
      stripePaymentIntentId: params.stripePaymentIntentId ?? null
    }
  });

  try {
    await sendTicketEmail({
      to: ticket.email,
      name: ticket.name,
      ticketId: ticket.id,
      eventTitle: params.event.title,
      eventDateStart: params.event.dateStart,
      eventVenue: params.event.venue,
      eventAddress: params.event.address,
      isPaid: params.event.ticketMode === "PAID",
      isDoorPrice: params.event.ticketMode === "GUESTLIST",
      amountCents: ticket.amountCents
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
