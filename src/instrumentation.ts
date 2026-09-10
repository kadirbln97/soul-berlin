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

  // Nur im Node-Runtime: Next baut diese Datei auch für die Edge-Runtime
  // (Middleware), und dort gibt es kein nodemailer ('crypto', 'path' …).
  // Der Import muss IN dem if-Block stehen — webpack erkennt den Zweig beim
  // Bündeln als tot (NEXT_RUNTIME wird beim Build zu einem festen Wert) und
  // lässt nodemailer aus dem Edge-Bundle. Ein früher return davor würde
  // nicht reichen, weil der Import schon beim Parsen eingesammelt wird.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
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
  }
};
