import { test } from "node:test";
import assert from "node:assert/strict";
import { getCurrentGuestlistPrice, getCurrentGuestlistTier } from "../src/lib/guestlistTiers";

const tiers = [
  { untilTime: "2026-09-11T17:00:00Z", priceCents: 1000, label: "10€ bis 19 Uhr" },
  { untilTime: "2026-09-11T18:00:00Z", priceCents: 1500, label: null }
];

test("Staffelpreis: erste Staffel, deren Ende noch nicht erreicht ist", () => {
  assert.equal(getCurrentGuestlistPrice(tiers, new Date("2026-09-11T16:59:00Z")), 1000);
  assert.equal(getCurrentGuestlistPrice(tiers, new Date("2026-09-11T17:00:00Z")), 1500);
});

test("Nach der letzten Staffel bleibt deren Preis als Abendkassenpreis", () => {
  assert.equal(getCurrentGuestlistPrice(tiers, new Date("2026-09-12T03:00:00Z")), 1500);
});

test("Ohne Staffeln bleibt es kostenlos (null)", () => {
  assert.equal(getCurrentGuestlistPrice([], new Date()), null);
});

test("Staffel ohne Namen bekommt einen generischen Namen mit Positionsnummer", () => {
  const tier = getCurrentGuestlistTier(tiers, new Date("2026-09-11T17:30:00Z"));
  assert.equal(tier?.resolvedLabel, "Staffel 2");
  const first = getCurrentGuestlistTier(tiers, new Date("2026-09-11T10:00:00Z"));
  assert.equal(first?.resolvedLabel, "10€ bis 19 Uhr");
});
