import { prisma } from "./prisma";

/**
 * Rate-Limiting (Sliding Window pro Schlüssel) — schützt Login, Gästeliste,
 * Kontaktformular, Checkout und Scanner-Validierung vor Spam und Brute-Force.
 *
 * Der Zähler liegt in der Datenbank (Tabelle RateLimitBucket), nicht im
 * Arbeitsspeicher: auf Vercel laufen mehrere Funktionsinstanzen parallel,
 * jede mit eigenem Speicher und kurzer Lebensdauer. Ein Zähler im Speicher
 * sieht deshalb nur einen Bruchteil der Anfragen und vergisst nach jedem
 * Kaltstart alles — für einen Brute-Force-Schutz ist das wertlos.
 *
 * Ein einziger atomarer Upsert pro Anfrage: erhöht den Zähler, oder setzt ihn
 * auf 1 zurück, wenn das Fenster abgelaufen ist. Kein Lesen-dann-Schreiben,
 * also auch bei gleichzeitigen Anfragen kein Zählverlust.
 *
 * Fällt die Datenbank aus, greift ein Zähler im Speicher als Notlösung —
 * besser als gar kein Schutz, und die Seite bleibt bedienbar.
 */

type Bucket = { count: number; resetAt: number };

const memoryBuckets = new Map<string, Bucket>();

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of memoryBuckets) {
    if (bucket.resetAt < now) memoryBuckets.delete(key);
  }
}, 60_000).unref?.();

function checkInMemory(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = memoryBuckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count };
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; retryAfterMs?: number }> {
  const resetAt = new Date(Date.now() + windowMs);

  try {
    const rows = await prisma.$queryRaw<{ count: number; resetAt: Date }[]>`
      INSERT INTO "RateLimitBucket" ("key", "count", "resetAt")
      VALUES (${key}, 1, ${resetAt})
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE
          WHEN "RateLimitBucket"."resetAt" < now() THEN 1
          ELSE "RateLimitBucket"."count" + 1
        END,
        "resetAt" = CASE
          WHEN "RateLimitBucket"."resetAt" < now() THEN ${resetAt}
          ELSE "RateLimitBucket"."resetAt"
        END
      RETURNING "count", "resetAt"
    `;
    const row = rows[0];
    if (!row) return checkInMemory(key, limit, windowMs);

    const count = Number(row.count);
    if (count > limit) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: Math.max(0, new Date(row.resetAt).getTime() - Date.now())
      };
    }
    return { allowed: true, remaining: limit - count };
  } catch (err) {
    console.error("[rateLimit] Datenbank nicht erreichbar, Zähler im Speicher:", err);
    return checkInMemory(key, limit, windowMs);
  }
}

/** Liest die Client-IP aus Standard-Proxy-Headern (Vercel/nginx setzen x-forwarded-for). */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
