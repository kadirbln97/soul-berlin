import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * Newsletter-Links ohne Klartext-Geheimnisse in der Datenbank.
 *
 * Bestätigungstoken (Double-Opt-in): wird einmal per Mail verschickt; in der
 * Datenbank liegt nur sein SHA-256-Hash. Wer die Datenbank liest, kann damit
 * keine fremde Adresse bestätigen.
 *
 * Abmeldetoken: wird gar nicht gespeichert, sondern aus der Datensatz-ID
 * abgeleitet — HMAC mit APP_SECRET. Der Export für das Mail-Tool kann den
 * Link jederzeit neu bilden, und ein Datenbank-Leck verrät keine Links.
 */

function getSecret() {
  const secret = process.env.APP_SECRET;
  if (!secret || secret === "change-me-to-a-long-random-string") {
    throw new Error("APP_SECRET fehlt oder ist noch der Platzhalter.");
  }
  return secret;
}

/** SHA-256 (hex) eines Tokens — so wird der Bestätigungstoken gespeichert. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Erkennt gespeicherte Hashes (64 Hex-Zeichen) im Gegensatz zu alten Klartext-Tokens. */
export function looksLikeTokenHash(value: string): boolean {
  return /^[0-9a-f]{64}$/.test(value);
}

function unsubscribeSignature(id: string): string {
  return createHmac("sha256", getSecret()).update(`newsletter-unsubscribe:${id}`).digest("base64url");
}

/** Abmeldetoken für einen Datensatz: "<id>.<signatur>". */
export function buildUnsubscribeToken(id: string): string {
  return `${id}.${unsubscribeSignature(id)}`;
}

/**
 * Prüft einen Abmeldetoken und gibt die Datensatz-ID zurück — oder null.
 * Tokens ohne Punkt sind alte Klartext-Tokens aus früheren Mails; die
 * behandelt der Aufrufer über den Legacy-Weg.
 */
export function parseUnsubscribeToken(token: string): string | null {
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const id = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  if (!/^[a-z0-9]+$/i.test(id) || !signature) return null;
  const expected = unsubscribeSignature(id);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return id;
}
