import { prisma } from "./prisma";

/**
 * Umsatzzahlen aus online bezahlten Tickets (Stripe). Gästeliste-Einträge
 * zählen nicht mit, da dort nichts online kassiert wird — die Abendkasse
 * läuft außerhalb des Systems.
 *
 * Erstattete/stornierte Tickets werden separat ausgewiesen und vom Netto
 * abgezogen, damit die Zahl dem entspricht, was tatsächlich beim
 * Zahlungsdienstleister hängen geblieben ist.
 */
export type RevenueSummary = {
  /** Anzahl bezahlter, gültiger Tickets. */
  paidCount: number;
  /** Summe der Ticketpreise ohne Servicegebühr (nur gültige Tickets). */
  ticketCents: number;
  /** Summe der Servicegebühren (nur gültige Tickets). */
  feeCents: number;
  /** Ticket + Gebühr, also was Gäste insgesamt gezahlt haben. */
  grossCents: number;
  /** Anzahl erstatteter/stornierter, ursprünglich bezahlter Tickets. */
  refundedCount: number;
  /** Summe der zurückerstatteten Beträge (Ticket + Gebühr). */
  refundedCents: number;
};

const EMPTY: RevenueSummary = {
  paidCount: 0,
  ticketCents: 0,
  feeCents: 0,
  grossCents: 0,
  refundedCount: 0,
  refundedCents: 0
};

type TicketRow = {
  amountCents: number | null;
  feeCents: number | null;
  status: string;
};

function summarize(tickets: TicketRow[]): RevenueSummary {
  return tickets.reduce<RevenueSummary>((acc, t) => {
    const amount = t.amountCents ?? 0;
    const fee = t.feeCents ?? 0;
    const isRefunded = t.status === "REFUNDED" || t.status === "CANCELLED";

    if (isRefunded) {
      return {
        ...acc,
        refundedCount: acc.refundedCount + 1,
        refundedCents: acc.refundedCents + amount + fee
      };
    }

    return {
      ...acc,
      paidCount: acc.paidCount + 1,
      ticketCents: acc.ticketCents + amount,
      feeCents: acc.feeCents + fee,
      grossCents: acc.grossCents + amount + fee
    };
  }, EMPTY);
}

/** Umsatz eines einzelnen Events. */
export async function getEventRevenue(eventId: string): Promise<RevenueSummary> {
  const tickets = await prisma.ticket.findMany({
    // Nur online bezahlte Tickets: erkennbar an der Stripe-Session.
    where: { eventId, stripeSessionId: { not: null } },
    select: { amountCents: true, feeCents: true, status: true }
  });
  return summarize(tickets);
}

/** Umsatz über alle Events hinweg. */
export async function getTotalRevenue(): Promise<RevenueSummary> {
  const tickets = await prisma.ticket.findMany({
    where: { stripeSessionId: { not: null } },
    select: { amountCents: true, feeCents: true, status: true }
  });
  return summarize(tickets);
}
