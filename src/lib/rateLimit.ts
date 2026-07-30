/**
 * Einfaches In-Memory-Rate-Limiting (Sliding Window) — schützt Login,
 * Gästeliste, Checkout & Scanner-Validierung vor Spam/Brute-Force.
 *
 * Hinweis: Läuft pro Server-Prozess. Auf Single-Node-Hosting (z.B. ein VM/Docker
 * Deployment) greift das voll. Bei Serverless mit vielen parallelen Instanzen
 * (z.B. Vercel unter Last) ist der Schutz best-effort, da jede Instanz ihren
 * eigenen Zähler hat — für hartes Rate-Limiting in dem Fall z.B. Upstash Redis
 * (@upstash/ratelimit) ergänzen. Für eine Party-Ticketseite reicht dieser
 * einfache Schutz in der Praxis gut aus.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Gelegentliches Aufräumen, damit die Map nicht unbegrenzt wächst.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}, 60_000).unref?.();

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count };
}

/** Liest die Client-IP aus Standard-Proxy-Headern (Vercel/nginx setzen x-forwarded-for). */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
