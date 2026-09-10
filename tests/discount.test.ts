import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateDiscountCents, calculatePriceBreakdown } from "../src/lib/discount";

test("Prozent-Rabatt wird auf die Zwischensumme gerechnet und gedeckelt", () => {
  assert.equal(calculateDiscountCents(2000, 2, { type: "PERCENT", value: 25 }), 1000);
  assert.equal(calculateDiscountCents(2000, 1, { type: "PERCENT", value: 150 }), 2000);
  assert.equal(calculateDiscountCents(2000, 1, { type: "PERCENT", value: -5 }), 0);
});

test("Fester Rabatt nie höher als die Zwischensumme", () => {
  assert.equal(calculateDiscountCents(1000, 1, { type: "FIXED", value: 300 }), 300);
  assert.equal(calculateDiscountCents(1000, 1, { type: "FIXED", value: 5000 }), 1000);
});

test("2-für-1: je zwei Tickets eines frei, bei einem Ticket nichts", () => {
  assert.equal(calculateDiscountCents(1500, 1, { type: "BOGO", value: 0 }), 0);
  assert.equal(calculateDiscountCents(1500, 2, { type: "BOGO", value: 0 }), 1500);
  assert.equal(calculateDiscountCents(1500, 3, { type: "BOGO", value: 0 }), 1500);
  assert.equal(calculateDiscountCents(1500, 4, { type: "BOGO", value: 0 }), 3000);
});

test("Preisaufstellung: Gebühr auf den rabattierten Betrag, Grundgebühr pro Ticket", () => {
  const b = calculatePriceBreakdown(2000, 2, { type: "PERCENT", value: 50 });
  assert.equal(b.subtotalCents, 4000);
  assert.equal(b.discountCents, 2000);
  assert.equal(b.discountedSubtotalCents, 2000);
  // 1 € + 8 % von 20 € = 2,60 €, plus 1 € Grundgebühr fürs zweite Ticket
  assert.equal(b.feeCents, 360);
  assert.equal(b.totalCents, 2360);
});

test("Preisaufstellung: komplett rabattiert → keine Gebühr, nichts zu zahlen", () => {
  const b = calculatePriceBreakdown(1000, 2, { type: "PERCENT", value: 100 });
  assert.equal(b.feeCents, 0);
  assert.equal(b.totalCents, 0);
});
