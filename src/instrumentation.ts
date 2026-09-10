import type { Instrumentation } from "next";

/**
 * Fehlerüberwachung ohne Fremddienst.
 *
 * Next ruft onRequestError für jeden nicht abgefangenen Fehler beim Rendern
 * einer Seite oder in einer API-Route auf. Wir schreiben ihn ins Log (Vercel)
 * und schicken eine Mail an ALERT_EMAIL bzw. ADMIN_EMAIL — damit ein kaputter
 * Ticketversand nicht erst am Einlass auffällt.
 *
 * Gedrosselt: pro Fehlerart (Nachricht + Pfad) höchstens eine Mail alle 15
 * Minuten pro Funktionsinstanz. Sonst würde ein Datenbankausfall bei
 * hundert Seitenaufrufen hundert Mails erzeugen — und das Postfach wäre
 * genau dann unbrauchbar, wenn man es braucht.
 */
const ALERT_COOLDOWN_MS = 15 * 60_000;
const lastAlertAt = new Map<string, number>();

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  const err = error instanceof Error ? error : new Error(String(error));
  const path = request.path;
  const key = `${context.routePath ?? path}|${err.message.slice(0, 120)}`;

  console.error(`[onRequestError] ${request.method} ${path} (${context.routeType}):`, err);

  const now = Date.now();
  const last = lastAlertAt.get(key) ?? 0;
  if (now - last < ALERT_COOLDOWN_MS) return;
  lastAlertAt.set(key, now);

  try {
    // Dynamischer Import: instrumentation läuft sehr früh, und nodemailer
    // soll nicht in Edge-Bundles landen.
    const { sendAlertEmail } = await import("./lib/email");
    await sendAlertEmail({
      subject: `Fehler auf ${path}`,
      text: [
        `Zeit: ${new Date(now).toISOString()}`,
        `Route: ${request.method} ${path}`,
        `Art: ${context.routeType} (${context.renderSource ?? "-"})`,
        `Fehler: ${err.message}`,
        "",
        err.stack ?? "",
        "",
        "Nächste Schritte: RUNBOOK.md → 'die Seite zeigt einen Fehler'.",
        "Diese Mail kommt pro Fehlerart höchstens alle 15 Minuten."
      ].join("\n")
    });
  } catch (mailErr) {
    console.error("[onRequestError] Alarm-Mail konnte nicht gesendet werden:", mailErr);
  }
};
