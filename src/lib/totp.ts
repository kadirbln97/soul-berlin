import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Einmalcodes nach RFC 6238 (TOTP) — das Verfahren hinter Google
 * Authenticator, Apple Passwörter, Authy usw. Bewusst ohne Fremdpaket: der
 * Algorithmus ist HMAC-SHA1 über einen 30-Sekunden-Zähler, etwa 40 Zeilen.
 *
 * Nur für den Node-Runtime (Login-Route), nicht für die Edge-Middleware.
 */

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export const TOTP_STEP_SECONDS = 30;
export const TOTP_DIGITS = 6;

/** Base32 (RFC 4648) ohne Padding — das Format, das Authenticator-Apps lesen. */
export function base32Encode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(input: string): Uint8Array {
  const clean = input.toUpperCase().replace(/[\s=-]/g, "");
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;
  for (const ch of clean) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx === -1) throw new Error(`Ungültiges Base32-Zeichen: ${ch}`);
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Uint8Array.from(bytes);
}

/** Neues Geheimnis: 20 Zufallsbytes (160 Bit, wie RFC 4226 empfiehlt). */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

/** Code für einen bestimmten Zählerstand (Zeit / 30 s). */
export function totpAtCounter(secretBase32: string, counter: number): string {
  const key = Buffer.from(base32Decode(secretBase32));
  const msg = Buffer.alloc(8);
  // 64-Bit-Zähler big-endian; für realistische Zeiten reichen 32 Bit unten.
  msg.writeUInt32BE(Math.floor(counter / 2 ** 32), 0);
  msg.writeUInt32BE(counter >>> 0, 4);
  const hmac = createHmac("sha1", key).update(msg).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(binary % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, "0");
}

export function totpNow(secretBase32: string, now = Date.now()): string {
  return totpAtCounter(secretBase32, Math.floor(now / 1000 / TOTP_STEP_SECONDS));
}

/**
 * Prüft einen eingegebenen Code. Akzeptiert je einen Schritt vor und zurück
 * (Uhrenabweichung Handy/Server, Tippzeit). Vergleich in konstanter Zeit.
 */
export function verifyTotp(
  secretBase32: string,
  code: string,
  now = Date.now(),
  window = 1
): boolean {
  const entered = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(entered)) return false;
  const counter = Math.floor(now / 1000 / TOTP_STEP_SECONDS);
  let ok = false;
  for (let i = -window; i <= window; i++) {
    const expected = totpAtCounter(secretBase32, counter + i);
    // Kein früher Abbruch: alle Fenster prüfen, damit die Laufzeit nicht
    // verrät, welches Fenster getroffen wurde.
    if (timingSafeEqual(Buffer.from(expected), Buffer.from(entered))) ok = true;
  }
  return ok;
}

/** otpauth-URL, die Authenticator-Apps als QR-Code einlesen. */
export function buildOtpauthUrl(issuer: string, account: string, secretBase32: string): string {
  const label = encodeURIComponent(`${issuer}:${account}`);
  const params = new URLSearchParams({
    secret: secretBase32,
    issuer,
    algorithm: "SHA1",
    digits: String(TOTP_DIGITS),
    period: String(TOTP_STEP_SECONDS)
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}
