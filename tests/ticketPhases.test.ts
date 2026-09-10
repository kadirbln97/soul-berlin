import { test } from "node:test";
import assert from "node:assert/strict";
import {
  resolveTicketPhases,
  getActivePhase,
  allPhasesClosed,
  getEffectivePriceCents
} from "../src/lib/ticketPhases";

const now = new Date("2026-09-10T12:00:00Z");
const phases = [
  { id: "p1", label: "Early Bird", priceCents: 1000, quantity: 20, untilTime: null, isSoldOut: false, order: 0 },
  { id: "p2", label: "Regular", priceCents: 1300, quantity: null, untilTime: "2026-09-11T18:00:00Z", isSoldOut: false, order: 1 },
  { id: "p3", label: "Last Call", priceCents: 1700, quantity: 50, untilTime: null, isSoldOut: false, order: 2 }
];

test("Erste offene Phase ist aktiv, alle danach sind UPCOMING", () => {
  const r = resolveTicketPhases(phases, {}, now);
  assert.deepEqual(r.map((p) => p.status), ["ACTIVE", "UPCOMING", "UPCOMING"]);
  assert.equal(r[0].remaining, 20);
});

test("Aufgebrauchtes Kontingent schaltet auf die nächste Phase um", () => {
  const r = resolveTicketPhases(phases, { p1: 20 }, now);
  assert.deepEqual(r.map((p) => p.status), ["SOLD_OUT", "ACTIVE", "UPCOMING"]);
  assert.equal(getEffectivePriceCents(phases, 999, { p1: 20 }, now), 1300);
});

test("Manueller Schalter wirkt wie ausverkauft, Zeitablauf wie abgelaufen", () => {
  const manual = phases.map((p) => (p.id === "p1" ? { ...p, isSoldOut: true } : p));
  assert.equal(getActivePhase(manual, {}, now)?.id, "p2");

  const later = new Date("2026-09-11T19:00:00Z");
  const r = resolveTicketPhases(phases, { p1: 20 }, later);
  assert.deepEqual(r.map((p) => p.status), ["SOLD_OUT", "EXPIRED", "ACTIVE"]);
});

test("Alles zu → kein Preis, nicht der Event-Fallback", () => {
  const closed = phases.map((p) => ({ ...p, isSoldOut: true }));
  assert.equal(allPhasesClosed(closed, {}, now), true);
  assert.equal(getEffectivePriceCents(closed, 999, {}, now), null);
});

test("Ohne Phasen gilt der Event-Preis und es ist nie 'über Phasen ausverkauft'", () => {
  assert.equal(allPhasesClosed([], {}, now), false);
  assert.equal(getEffectivePriceCents([], 1500, {}, now), 1500);
});

test("Reihenfolge kommt aus 'order', nicht aus der Array-Position", () => {
  const shuffled = [phases[2], phases[0], phases[1]];
  assert.equal(getActivePhase(shuffled, {}, now)?.id, "p1");
});
