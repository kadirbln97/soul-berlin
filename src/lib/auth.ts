import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "soul_admin_session";
const SESSION_DURATION = "7d";

function getSecretKey() {
  const secret = process.env.APP_SECRET;
  if (!secret || secret === "change-me-to-a-long-random-string") {
    throw new Error(
      "APP_SECRET fehlt oder ist noch der Platzhalter. Setze einen langen, zufälligen Wert in .env (z.B. mit `openssl rand -hex 32`)."
    );
  }
  return new TextEncoder().encode(secret);
}

/** Erstellt ein signiertes Session-JWT für den eingeloggten Admin. */
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
