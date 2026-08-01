/**
 * Servicegebühr für online gekaufte Tickets.
 *
 * Formel: 1,00 € Grundgebühr pro Ticket + 8 % vom Ticketpreis, zusätzlich zum
 * Ticketpreis. Beispiel: 20,00 € Ticket → 1,00 € + 1,60 € = 2,60 € Gebühr,
 * der Gast zahlt insgesamt 22,60 €.
 *
 * Gilt ausschließlich beim Online-Ticketkauf. Gästelisten-Einträge (Zahlung an
 * der Abendkasse) bleiben ohne Gebühr.
 */
export const SERVICE_FEE_BASE_CENTS = 100;
export const SERVICE_FEE_PERCENT = 8;

/** Gebühr in Cent für einen Ticketpreis in Cent (kaufmännisch gerundet). */
export function calculateServiceFeeCents(ticketPriceCents: number): number {
  if (!Number.isFinite(ticketPriceCents) || ticketPriceCents <= 0) return 0;
  const percentPart = Math.round((ticketPriceCents * SERVICE_FEE_PERCENT) / 100);
  return SERVICE_FEE_BASE_CENTS + percentPart;
}

/** Gesamtbetrag (Ticket + Gebühr) in Cent. */
export function calculateTotalWithFeeCents(ticketPriceCents: number): number {
  return ticketPriceCents + calculateServiceFeeCents(ticketPriceCents);
}
