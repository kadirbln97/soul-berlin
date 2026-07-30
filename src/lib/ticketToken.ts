import crypto from "node:crypto";

/**
 * Signiert eine Ticket-ID zu einem fälschungssicheren Token, das als QR-Code
 * ausgegeben wird. Der Scanner muss die Datenbank nicht "erraten" können:
 * ohne gültige Signatur (APP_SECRET) wird der Code beim Scannen abgelehnt,
 * selbst wenn jemand eine Ticket-ID errät oder den QR-Code fälscht.
 *
 * Format: <ticketId>.<hmac-hex>
 */
function getSecret() {
  const secret = process.env.APP_SECRET;
  if (!secret || secret === "change-me-to-a-long-random-string") {
    throw new Error(
      "APP_SECRET fehlt oder ist noch der Platzhalter. Setze einen langen, zufälligen Wert in .env."
    );
  }
  return secret;
}

export function signTicketToken(ticketId: string): string {
  const hmac = crypto
    .createHmac("sha256", getSecret())
    .update(ticketId)
    .digest("hex");
  return `${ticketId}.${hmac}`;
}

export function verifyTicketToken(token: string): { valid: boolean; ticketId?: string } {
  if (!token || !token.includes(".")) return { valid: false };

  const lastDot = token.lastIndexOf(".");
  const ticketId = token.slice(0, lastDot);
  const signature = token.slice(lastDot + 1);

  if (!ticketId || !signature) return { valid: false };

  const expected = crypto.createHmac("sha256", getSecret()).update(ticketId).digest("hex");

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);

  if (sigBuf.length !== expBuf.length) return { valid: false };
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return { valid: false };

  return { valid: true, ticketId };
}
