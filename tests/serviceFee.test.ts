import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateServiceFeeCents, calculateTotalWithFeeCents } from "../src/lib/serviceFee";

test("Servicegebühr: 1 € + 8 %, kaufmännisch gerundet", () => {
  assert.equal(calculateServiceFeeCents(2000), 260); // AGB-Beispiel: 20 € → 2,60 €
  assert.equal(calculateServiceFeeCents(1000), 180);
  assert.equal(calculateServiceFeeCents(1250), 200); // 100 Cent → Rundung
  assert.equal(calculateTotalWithFeeCents(2000), 2260);
});

test("Servicegebühr: keine Gebühr auf 0 oder Unsinn", () => {
  assert.equal(calculateServiceFeeCents(0), 0);
  assert.equal(calculateServiceFeeCents(-500), 0);
  assert.equal(calculateServiceFeeCents(Number.NaN), 0);
});
