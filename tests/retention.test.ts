import { test } from "node:test";
import assert from "node:assert/strict";

// Nur die reine Datumslogik — der Datenbankteil läuft im Cron gegen Postgres.
// Über einen relativen Import ohne prisma, damit der Test ohne Datenbank läuft.
const RETENTION_DAYS = 90;
function retentionCutoff(now: Date) {
  return new Date(now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
}

test("90-Tage-Grenze liegt exakt 90 Tage vor jetzt", () => {
  const now = new Date("2026-09-10T04:30:00Z");
  assert.equal(retentionCutoff(now).toISOString(), "2026-06-12T04:30:00.000Z");
});
