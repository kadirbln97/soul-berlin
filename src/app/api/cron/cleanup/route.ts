import { NextResponse } from "next/server";
import { runRetentionCleanup } from "@/lib/retention";

/**
 * Täglicher Aufräumlauf (Vercel Cron, siehe vercel.json): löscht bzw.
 * anonymisiert Gästedaten 90 Tage nach dem Event — siehe src/lib/retention.ts.
 *
 * Absicherung: Vercel schickt bei Cron-Aufrufen "Authorization: Bearer
 * <CRON_SECRET>", sobald die Umgebungsvariable CRON_SECRET im Projekt gesetzt
 * ist. Ohne gültigen Header wird nichts gelöscht — sonst könnte jeder mit der
 * URL den Lauf anstoßen. Ohne gesetztes CRON_SECRET läuft der Job bewusst
 * gar nicht, damit ein vergessenes Geheimnis nicht in einem offenen
 * Lösch-Endpunkt endet.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron/cleanup] CRON_SECRET ist nicht gesetzt — Lauf übersprungen.");
    return NextResponse.json({ error: "CRON_SECRET nicht konfiguriert" }, { status: 503 });
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const result = await runRetentionCleanup();
    console.log(
      `[cron/cleanup] ${result.events} Events vor ${result.cutoff.toISOString()}: ` +
        `${result.deleted} Einträge gelöscht, ${result.anonymized} anonymisiert, ` +
        `${result.stalePending} unbestätigte Newsletter-Anmeldungen entfernt.`
    );
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron/cleanup] Lauf fehlgeschlagen:", err);
    return NextResponse.json({ error: "Aufräumlauf fehlgeschlagen" }, { status: 500 });
  }
}
