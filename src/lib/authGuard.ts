import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { SESSION_COOKIE, SESSIONS_VALID_FROM_KEY, verifySessionToken } from "./auth";

// Kurzer Cache, damit nicht jeder Admin-Aufruf (Layout + API) die Datenbank
// nach dem Entwertungs-Zeitpunkt fragt. 10 s Verzögerung nach "Überall
// abmelden" sind unkritisch.
let validFromCache: { value: number; fetchedAt: number } | null = null;

async function getSessionsValidFrom(): Promise<number> {
  const now = Date.now();
  if (validFromCache && now - validFromCache.fetchedAt < 10_000) return validFromCache.value;
  let value = 0;
  try {
    const row = await prisma.siteContent.findUnique({ where: { key: SESSIONS_VALID_FROM_KEY } });
    const parsed = row ? Date.parse(row.value) : NaN;
    if (Number.isFinite(parsed)) value = parsed;
  } catch (err) {
    // Ohne Datenbank gilt die Signatur allein — Sessions bleiben nutzbar.
    console.error("[authGuard] Entwertungs-Zeitpunkt nicht lesbar:", err);
  }
  validFromCache = { value, fetchedAt: now };
  return value;
}

/** Nach "Überall abmelden": alle vor jetzt ausgestellten Sitzungen entwerten. */
export async function invalidateAllSessions() {
  const nowIso = new Date().toISOString();
  await prisma.siteContent.upsert({
    where: { key: SESSIONS_VALID_FROM_KEY },
    create: { key: SESSIONS_VALID_FROM_KEY, value: nowIso },
    update: { value: nowIso }
  });
  validFromCache = null;
}

/**
 * Server-seitiger Helfer: gibt die Session zurück oder null, wenn nicht
 * eingeloggt. Prüft zusätzlich zur Signatur (die auch die Middleware prüft),
 * ob die Sitzung seit "Überall abmelden" noch gültig ist — das kann nur hier
 * passieren, weil die Middleware keinen Datenbankzugriff hat.
 */
export async function getAdminSession() {
  // Seit Next.js 15 ist cookies() asynchron.
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);
  if (!session) return null;

  const validFrom = await getSessionsValidFrom();
  // iat ist in Sekunden; eine Sekunde Toleranz, weil beide Zeitstempel
  // im selben Augenblick entstehen können.
  if (validFrom > 0 && session.iat * 1000 + 1000 < validFrom) return null;

  return session;
}
