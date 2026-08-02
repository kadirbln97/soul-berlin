import { prisma } from "./prisma";

/**
 * Kennzahlen für den Admin-Bereich: Umsatz aus online bezahlten Tickets
 * (Stripe) plus die Anzahl der Anmeldungen insgesamt.
 *
 * Umsatz entsteht nur bei Ticketkäufen — bei der Gästeliste wird an der
 * Abendkasse kassiert, das läuft bewusst außerhalb des Systems. Die
 * Anmeldezahlen umfassen dagegen alle Gäste, egal auf welchem Weg sie
 * dazugekommen sind.
 *
 * Erstattete/stornierte Tickets werden separat ausgewiesen und nicht zum
 * Umsatz gezählt, damit die Zahl dem entspricht, was tatsächlich beim
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

  /** Alle gültigen Anmeldungen: Ticketkäufe + Gästeliste. */
  signupCount: number;
  /** Davon Gästeliste (nicht online bezahlt, Zahlung an der Abendkasse). */
  guestlistCount: number;
  /** Davon von Hand eingetragen (Promoter-Listen) — Teilmenge der Gästeliste. */
  manualCount: number;
};

const EMPTY: RevenueSummary = {
  paidCount: 0,
  ticketCents: 0,
  feeCents: 0,
  grossCents: 0,
  refundedCount: 0,
  refundedCents: 0,
  signupCount: 0,
  guestlistCount: 0,
  manualCount: 0
};

type TicketRow = {
  amountCents: number | null;
  feeCents: number | null;
  status: string;
  stripeSessionId: string | null;
  isManual: boolean;
};

const TICKET_FIELDS = {
  amountCents: true,
  feeCents: true,
  status: true,
  stripeSessionId: true,
  isManual: true
} as const;

function summarize(tickets: TicketRow[]): RevenueSummary {
  return tickets.reduce<RevenueSummary>((acc, t) => {
    const amount = t.amountCents ?? 0;
    const fee = t.feeCents ?? 0;
    // Online bezahlt ist genau das, was eine Stripe-Session hat.
    const isPaid = t.stripeSessionId !== null;
    const isCancelled = t.status === "REFUNDED" || t.status === "CANCELLED";

    if (isCancelled) {
      // Stornierte Gästeliste-Einträge zählen nirgends mit; nur bei bezahlten
      // Tickets ist tatsächlich Geld zurückgeflossen.
      return isPaid
        ? {
            ...acc,
            refundedCount: acc.refundedCount + 1,
            refundedCents: acc.refundedCents + amount + fee
          }
        : acc;
    }

    const withSignup = { ...acc, signupCount: acc.signupCount + 1 };

    if (isPaid) {
      return {
        ...withSignup,
        paidCount: withSignup.paidCount + 1,
        ticketCents: withSignup.ticketCents + amount,
        feeCents: withSignup.feeCents + fee,
        grossCents: withSignup.grossCents + amount + fee
      };
    }

    return {
      ...withSignup,
      guestlistCount: withSignup.guestlistCount + 1,
      manualCount: withSignup.manualCount + (t.isManual ? 1 : 0)
    };
  }, EMPTY);
}

/** Umsatz und Anmeldungen eines einzelnen Events. */
export async function getEventRevenue(eventId: string): Promise<RevenueSummary> {
  const tickets = await prisma.ticket.findMany({
    where: { eventId },
    select: TICKET_FIELDS
  });
  return summarize(tickets);
}

/** Umsatz und Anmeldungen über alle Events hinweg. */
export async function getTotalRevenue(): Promise<RevenueSummary> {
  const tickets = await prisma.ticket.findMany({ select: TICKET_FIELDS });
  return summarize(tickets);
}
