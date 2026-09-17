import { SignJWT, jwtVerify } from "jose";
import { getAppSecret } from "./appSecret";

/**
 * Cookie-Name mit "__Host-"-Präfix in Produktion: der Browser akzeptiert ihn
 * dann nur mit Secure, Path=/ und ohne Domain — eine Subdomain oder eine
 * unverschlüsselte Verbindung kann das Cookie damit weder setzen noch
 * überschreiben. Lokal (http://localhost) ist das Präfix nicht erlaubt.
 */
export const SESSION_COOKIE =
  process.env.NODE_ENV === "production" ? "__Host-soul_admin_session" : "soul_admin_session";

/** 24 Stunden: ein gestohlenes Cookie ist damit spätestens am nächsten Tag wertlos. */
const SESSION_DURATION = "24h";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24;

/** Schlüssel in SiteContent: Sitzungen, die vor diesem Zeitpunkt ausgestellt wurden, sind ungültig. */
export const SESSIONS_VALID_FROM_KEY = "admin_sessions_valid_from";

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
    if (payload.role !== "admin" || typeof payload.iat !== "number") return null;
    return payload as { role: string; email: string; iat: number };
  } catch {
    return null;
  }
}
