import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/authGuard";
import { checkRateLimit } from "@/lib/rateLimit";
import {
  askModelForTables,
  parseDetectedTables,
  prepareImageForDetection
} from "@/lib/tablePlanDetect";

export const runtime = "nodejs";
// Bildverständnis dauert je nach Plan 10–30 s; Vercel-Standard wären 10 s.
export const maxDuration = 60;

const bodySchema = z.object({
  imageUrl: z.string().url().max(2000)
});

/** Nur Bilder aus dem eigenen Blob-Speicher — kein Abruf beliebiger Adressen. */
function isAllowedImageHost(url: URL) {
  return url.protocol === "https:" && url.hostname.endsWith(".public.blob.vercel-storage.com");
}

/**
 * Tische auf einem hochgeladenen Grundriss automatisch erkennen lassen.
 * Ergebnis: Rechtecke in Prozent, die der Admin im Editor nachzieht.
 */
export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    return NextResponse.json(
      {
        error:
          "Automatische Erkennung ist nicht eingerichtet: In Vercel fehlt die Umgebungsvariable ANTHROPIC_API_KEY (Schlüssel unter console.anthropic.com erzeugen, dann Redeploy)."
      },
      { status: 503 }
    );
  }

  // Jeder Aufruf kostet Geld — pro Admin höchstens 15 Erkennungen je 10 Minuten.
  const rl = await checkRateLimit(`detect:${session.email}`, 15, 10 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Zu viele Erkennungen in kurzer Zeit. Bitte ein paar Minuten warten." },
      { status: 429 }
    );
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Bitte zuerst einen Grundriss hochladen." }, { status: 400 });
  }

  let url: URL;
  try {
    url = new URL(parsed.data.imageUrl);
  } catch {
    return NextResponse.json({ error: "Ungültige Bildadresse." }, { status: 400 });
  }
  if (!isAllowedImageHost(url)) {
    return NextResponse.json(
      { error: "Nur hochgeladene Grundrisse (eigener Speicher) können erkannt werden." },
      { status: 400 }
    );
  }

  const imageRes = await fetch(url, { cache: "no-store" }).catch(() => null);
  if (!imageRes || !imageRes.ok) {
    return NextResponse.json({ error: "Grundriss konnte nicht geladen werden." }, { status: 502 });
  }
  const original = Buffer.from(await imageRes.arrayBuffer());
  if (original.byteLength > 15 * 1024 * 1024) {
    return NextResponse.json({ error: "Grundriss ist zu groß (max. 15 MB)." }, { status: 400 });
  }

  try {
    const prepared = await prepareImageForDetection(original);
    const text = await askModelForTables(prepared);
    const tables = parseDetectedTables(text);
    console.log(`[table-plan/detect] ${tables.length} Tische erkannt (${session.email})`);
    return NextResponse.json({ tables });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler";
    console.error("[table-plan/detect] fehlgeschlagen:", message);
    const userMessage = message.startsWith("Claude API")
      ? "Der Erkennungsdienst hat einen Fehler gemeldet. Bitte später erneut versuchen."
      : message;
    return NextResponse.json({ error: userMessage }, { status: 502 });
  }
}
