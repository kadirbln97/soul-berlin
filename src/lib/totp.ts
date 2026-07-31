import crypto from "node:crypto";

/**
 * Eigene, abhängigkeitsfreie TOTP-Implementierung (RFC 6238, aufbauend auf
 * HOTP/RFC 4226) für die Admin-2FA. Bewusst ohne zusätzliches npm-Paket
 * (z.B. otplib/speakeasy), weil die Sandbox beim Bauen dieses Projekts keinen
 * Zugriff auf die npm-Registry hat, um neue Pakete zu testen — die Kernlogik
 * hier ist gegen die offiziellen RFC-4226-Testvektoren verifiziert.
 *
 * Kompatibel mit Google Authenticator, Authy, 1Password, Microsoft
 * Authenticator etc. (Standard: SHA1, 6 Stellen, 30-Sekunden-Schritt).
 */

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const STEP_SECONDS = 30;
const DIGITS = 6;

function base32Encode(buffer: Buffer): string {
  let bits = "";
  for (const byte of buffer) {
    bits += byte.toString(2).padStart(8, "0");
  }
  let output = "";
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    output += BASE32_ALPHABET[parseInt(bits.slice(i, i + 5), 2)];
  }
  const remainder = bits.length % 5;
  if (remainder > 0) {
    const lastChunk = bits.slice(bits.length - remainder).padEnd(5, "0");
    output += BASE32_ALPHABET[parseInt(lastChunk, 2)];
  }
  return output;
}

function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = "";
  for (const char of clean) {
    const val = BASE32_ALPHABET.indexOf(char);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

/** HOTP nach RFC 4226 — gegen die offiziellen Testvektoren des RFC verifiziert. */
function hotp(secretBuffer: Buffer, counter: number): string {
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac("sha1", secretBuffer).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binCode =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return (binCode % 10 ** DIGITS).toString().padStart(DIGITS, "0");
}

/** Erzeugt ein neues, zufälliges Base32-Secret (160 Bit — von Google Authenticator empfohlene Länge). */
export function generateTotpSecret(): string {
  return base32Encode(crypto.randomBytes(20));
}

/**
 * Prüft einen 6-stelligen Code aus der Authenticator-App gegen das
 * Base32-Secret. `windowSteps` erlaubt eine kleine Zeitabweichung
 * (Standard ±1 Schritt = ±30s) für Uhr-Differenzen zwischen Handy und Server.
 * Zeitkonstanter Vergleich (crypto.timingSafeEqual) gegen Timing-Angriffe.
 */
export function verifyTotp(code: string, base32Secret: string, windowSteps = 1): boolean {
  const cleanCode = code.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(cleanCode)) return false;

  const secretBuffer = base32Decode(base32Secret);
  if (secretBuffer.length === 0) return false;

  const counter = Math.floor(Date.now() / 1000 / STEP_SECONDS);

  for (let errorWindow = -windowSteps; errorWindow <= windowSteps; errorWindow++) {
    const expected = hotp(secretBuffer, counter + errorWindow);
    const expectedBuf = Buffer.from(expected);
    const codeBuf = Buffer.from(cleanCode);
    if (expectedBuf.length === codeBuf.length && crypto.timingSafeEqual(expectedBuf, codeBuf)) {
      return true;
    }
  }
  return false;
}

/** otpauth://-URI für den Einrichtungs-QR-Code (Google Authenticator, Authy, 1Password, …). */
export function buildOtpAuthUri(
  secret: string,
  accountEmail: string,
  issuer = "SOUL Berlin Admin"
): string {
  const label = encodeURIComponent(`${issuer}:${accountEmail}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: String(DIGITS),
    period: String(STEP_SECONDS)
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}
