import { test } from "node:test";
import assert from "node:assert/strict";
import {
  base32Decode,
  base32Encode,
  buildOtpauthUrl,
  generateTotpSecret,
  totpNow,
  verifyTotp
} from "../src/lib/totp";

// Testvektoren aus RFC 6238, Anhang B (SHA1). Der dortige Schlüssel ist der
// ASCII-Text "12345678901234567890"; die RFC-Codes sind 8-stellig, unsere
// 6-stelligen sind deren letzte sechs Ziffern.
const RFC_SECRET = base32Encode(Buffer.from("12345678901234567890", "ascii"));
const VECTORS: Array<[number, string]> = [
  [59, "287082"],
  [1111111109, "081804"],
  [1111111111, "050471"],
  [1234567890, "005924"],
  [2000000000, "279037"],
  [20000000000, "353130"]
];

test("Base32 hin und zurück", () => {
  assert.equal(RFC_SECRET, "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
  assert.deepEqual(Buffer.from(base32Decode(RFC_SECRET)).toString("ascii"), "12345678901234567890");
  // Kleinbuchstaben, Leerzeichen und Bindestriche (wie Apps sie anzeigen) sind egal.
  assert.deepEqual(base32Decode("gezd gnbv-GY3T"), base32Decode("GEZDGNBVGY3T"));
});

for (const [seconds, code] of VECTORS) {
  test(`RFC-6238-Vektor bei T=${seconds}`, () => {
    assert.equal(totpNow(RFC_SECRET, seconds * 1000), code);
  });
}

test("verifyTotp akzeptiert Nachbarfenster, aber nicht weiter weg", () => {
  const now = 1111111111 * 1000;
  assert.equal(verifyTotp(RFC_SECRET, "050471", now), true); // aktuelles Fenster
  assert.equal(verifyTotp(RFC_SECRET, "081804", now), true); // eins davor (T=1111111109)
  assert.equal(verifyTotp(RFC_SECRET, "050 471", now), true); // Leerzeichen erlaubt
  assert.equal(verifyTotp(RFC_SECRET, "287082", now), false); // T=59, weit weg
  assert.equal(verifyTotp(RFC_SECRET, "00000", now), false); // zu kurz
  assert.equal(verifyTotp(RFC_SECRET, "abcdef", now), false);
});

test("Neues Geheimnis ist 32 Zeichen Base32 (160 Bit)", () => {
  const s = generateTotpSecret();
  assert.match(s, /^[A-Z2-7]{32}$/);
  assert.notEqual(s, generateTotpSecret());
});

test("otpauth-URL enthält Issuer, Konto und Geheimnis", () => {
  const url = buildOtpauthUrl("SØUL Berlin", "kadir@example.com", RFC_SECRET);
  assert.ok(url.startsWith("otpauth://totp/S%C3%98UL%20Berlin%3Akadir%40example.com?"));
  assert.ok(url.includes(`secret=${RFC_SECRET}`));
  assert.ok(url.includes("digits=6"));
  assert.ok(url.includes("period=30"));
});
