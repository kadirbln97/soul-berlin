import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "soul_admin_session";
const SESSION_DURATION = "7d";

export type AdminUser = { email: string; passwordHash: string };

/**
 * Alle Admin-Konten.
 *
 * Das Hauptkonto kommt aus ADMIN_EMAIL/ADMIN_PASSWORD_HASH. Weitere Konten
 * stehen in ADMIN_USERS als "email:bcrypt-hash", mehrere durch Komma
 * getrennt — damit beide Betreiber einen eigenen Zugang haben und im
 * Check-in-Protokoll (checkedInBy) nachvollziehbar ist, wer eingecheckt hat.
 *
 * Hash erzeugen: npm run hash-password -- "Passwort"
 */
export function getAdminUsers(): AdminUser[] {
  const users: AdminUser[] = [];
  const primaryEmail = process.env.ADMIN_EMAIL?.trim();
  const primaryHash = process.env.ADMIN_PASSWORD_HASH?.trim();
  if (primaryEmail && primaryHash) users.push({ email: primaryEmail, passwordHash: primaryHash });

  for (const entry of (process.env.ADMIN_USERS ?? "").split(",")) {
    const trimmed = entry.trim();
    if (!trimmed) continue;
    // bcrypt-Hashes enthalten selbst Doppelpunkte nicht, die E-Mail auch nicht —
    // der erste Doppelpunkt trennt also zuverlässig.
    const idx = trimmed.indexOf(":");
    if (idx <= 0) continue;
    const email = trimmed.slice(0, idx).trim();
    const passwordHash = trimmed.slice(idx + 1).trim();
    if (email && passwordHash.startsWith("$2")) users.push({ email, passwordHash });
  }
  return users;
}

function getAppSecret() {
  const secret = process.env.APP_SECRET;
  if (!secret || secret === "change-me-to-a-long-random-string") {
    throw new Error(
      "APP_SECRET fehlt oder ist noch der Platzhalter. Setze einen langen, zufälligen Wert in .env (z.B. mit `openssl rand -hex 32`)."
    );
  }
  return secret;
}

/**
 * Signaturschlüssel für Sessions.
 *
 * Bewusst nicht APP_SECRET allein, sondern APP_SECRET plus die Passwort-
 * Hashes aller Admin-Konten: ändert jemand sein Passwort, ändert sich der
 * Schlüssel — und alle bestehenden Sessions sind sofort ungültig, ohne dass
 * APP_SECRET rotiert werden muss (das würde auch die QR-Codes auf allen
 * Tickets ungültig machen, siehe ticketToken.ts).
 */
async function getSessionKey() {
  const material = getAppSecret() + "|" + getAdminUsers().map((u) => u.passwordHash).join("|");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(material));
  return new Uint8Array(digest);
}

/** Erstellt ein signiertes Session-JWT für den eingeloggten Admin. */
export async function createSessionToken(email: string) {
  return new SignJWT({ role: "admin", email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(await getSessionKey());
}

/** Prüft ein Session-JWT aus dem Cookie. Gibt null zurück, wenn ungültig/abgelaufen. */
export async function verifySessionToken(token: string | undefined | null) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, await getSessionKey());
    if (payload.role !== "admin") return null;
    return payload as { role: string; email: string };
  } catch {
    return null;
  }
}
