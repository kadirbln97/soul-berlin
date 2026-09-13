import { test } from "node:test";
import assert from "node:assert/strict";

process.env.APP_SECRET = "test-secret-mit-genug-laenge-0123456789";

const { buildUnsubscribeToken, hashToken, looksLikeTokenHash, parseUnsubscribeToken } =
  await import("../src/lib/newsletterTokens");

test("Bestätigungstoken wird als SHA-256 gespeichert", () => {
  const h = hashToken("abc");
  assert.equal(h.length, 64);
  assert.ok(looksLikeTokenHash(h));
  assert.ok(!looksLikeTokenHash("abc"));
  assert.equal(h, hashToken("abc"));
  assert.notEqual(h, hashToken("abd"));
});

test("Abmeldetoken lässt sich aus der ID bilden und prüfen", () => {
  const token = buildUnsubscribeToken("clx123abc");
  assert.ok(token.startsWith("clx123abc."));
  assert.equal(parseUnsubscribeToken(token), "clx123abc");
});

test("Manipulierte Abmeldetoken werden abgelehnt", () => {
  const token = buildUnsubscribeToken("clx123abc");
  const [id, sig] = token.split(".");
  assert.equal(parseUnsubscribeToken(`clx999.${sig}`), null); // andere ID
  assert.equal(parseUnsubscribeToken(`${id}.${sig.slice(0, -1)}x`), null); // Signatur verändert
  assert.equal(parseUnsubscribeToken(`${id}.`), null);
  assert.equal(parseUnsubscribeToken("altertoken-ohne-punkt"), null); // Legacy → Aufrufer
  assert.equal(parseUnsubscribeToken(".sig"), null);
});
