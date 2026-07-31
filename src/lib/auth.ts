import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "soul_admin_session";
const SESSION_DURATION = "7d";

// Kurzlebiges Zwischen-Cookie zwischen Schritt 1 (Passwort korrekt) und
// Schritt 2 (2FA-Code korrekt) des Admin-Logins. Solange nur dieses Cookie
// gesetzt ist, hat niemand Zugriff auf /admin/* — das prüft ausschließlich
// das echte Session-Cookie (SESSION_COOKIE), siehe middleware.ts.
export const PENDING_2FA_COOKIE = "soul_admin_2fa_pending";
const PENDING_2FA_DURATION = "5m";

function getSecretKey() {
  const secret = process.env.APP_SECRET;
  if (!secret || secret === "change-me-to-a-long-random-string") {
    throw new Error(
      "APP_SECRET fehlt oder ist noch der Platzhalter. Setze einen langen, zufälligen Wert in .env (z.B. mit `openssl rand -hex 32`)."
    );
  }
  return new TextEncoder().encode(secret);
}

/** Erstellt ein signiertes Session-JWT für den vollständig eingeloggten Admin (nach 2FA). */
export async function createSessionToken(email: string) {
  return new SignJWT({ role: "admin", email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(getSecretKey());
}

/** Prüft ein Session-JWT aus dem Cookie. Gibt null zurück, wenn ungültig/abgelaufen. */
export async function verifySessionToken(token: string | undefined | null) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (payload.role !== "admin") return null;
    return payload as { role: string; email: string };
  } catch {
    return null;
  }
}

/** Erstellt das kurzlebige Zwischen-Token nach korrektem Passwort, vor dem 2FA-Code. */
export async function createPendingTwoFactorToken(email: string) {
  return new SignJWT({ role: "admin-pending-2fa", email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(PENDING_2FA_DURATION)
    .sign(getSecretKey());
}

/** Prüft das Zwischen-Token aus PENDING_2FA_COOKIE. Gibt null zurück, wenn ungültig/abgelaufen. */
export async function verifyPendingTwoFactorToken(token: string | undefined | null) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (payload.role !== "admin-pending-2fa") return null;
    return payload as { role: string; email: string };
  } catch {
    return null;
  }
}
