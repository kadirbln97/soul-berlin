import { calculateServiceFeeCents } from "./serviceFee";

export const DISCOUNT_TYPES = ["PERCENT", "FIXED", "BOGO"] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export type DiscountRule = {
  type: DiscountType;
  value: number;
  code?: string | null;
  label?: string | null;
};

export type PriceBreakdown = {
  quantity: number;
  /** Ticketpreis × Anzahl, vor Rabatt. */
  subtotalCents: number;
  /** Abgezogener Rabattbetrag (nie größer als der Zwischensumme). */
  discountCents: number;
  /** Zwischensumme nach Rabatt. */
  discountedSubtotalCents: number;
  /** Servicegebühr auf den tatsächlich zu zahlenden Betrag. */
  feeCents: number;
  /** Endbetrag, den der Gast zahlt. */
  totalCents: number;
};

/**
 * Rabattbetrag für eine Bestellung.
 *
 * - PERCENT: Prozent vom Gesamtpreis (z.B. 20 → 20 %)
 * - FIXED:   fester Betrag in Cent, höchstens die Zwischensumme
 * - BOGO:    "2 für 1" — je zwei Tickets wird nur eines berechnet.
 *            2 Tickets → 1 bezahlt, 3 → 2 bezahlt, 4 → 2 bezahlt.
 *            Bei nur einem Ticket gibt es keinen Rabatt.
 */
export function calculateDiscountCents(
  unitPriceCents: number,
  quantity: number,
  rule: DiscountRule | null
): number {
  if (!rule || unitPriceCents <= 0 || quantity <= 0) return 0;

  const subtotal = unitPriceCents * quantity;

  switch (rule.type) {
    case "PERCENT": {
      const pct = Math.min(100, Math.max(0, rule.value));
      return Math.min(subtotal, Math.round((subtotal * pct) / 100));
    }
    case "FIXED":
      return Math.min(subtotal, Math.max(0, rule.value));
    case "BOGO": {
      const freeTickets = Math.floor(quantity / 2);
      return Math.min(subtotal, freeTickets * unitPriceCents);
    }
    default:
      return 0;
  }
}

/**
 * Komplette Preisaufstellung inkl. Servicegebühr. Die Gebühr wird bewusst auf
 * den bereits rabattierten Betrag berechnet — der Gast zahlt sonst Gebühren
 * auf Geld, das er gar nicht ausgibt.
 */
export function calculatePriceBreakdown(
  unitPriceCents: number,
  quantity: number,
  rule: DiscountRule | null
): PriceBreakdown {
  const qty = Math.max(1, Math.floor(quantity));
  const subtotalCents = unitPriceCents * qty;
  const discountCents = calculateDiscountCents(unitPriceCents, qty, rule);
  const discountedSubtotalCents = Math.max(0, subtotalCents - discountCents);

  // Grundgebühr fällt pro Ticket an, der prozentuale Anteil auf den
  // rabattierten Gesamtbetrag.
  const feeCents =
    discountedSubtotalCents > 0
      ? calculateServiceFeeCents(discountedSubtotalCents) + (qty - 1) * 100
      : 0;

  return {
    quantity: qty,
    subtotalCents,
    discountCents,
    discountedSubtotalCents,
    feeCents,
    totalCents: discountedSubtotalCents + feeCents
  };
}

/** Lesbare Kurzbeschreibung für die Anzeige, z.B. "20 % Rabatt". */
export function describeDiscount(rule: DiscountRule, currency = "eur"): string {
  if (rule.label) return rule.label;
  switch (rule.type) {
    case "PERCENT":
      return `${rule.value} % Rabatt`;
    case "FIXED":
      return `${(rule.value / 100).toFixed(2)} ${currency === "eur" ? "€" : currency} Rabatt`;
    case "BOGO":
      return "2 für 1";
    default:
      return "Rabatt";
  }
}
