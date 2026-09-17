/**
 * Das eine Geheimnis, das Admin-Sitzungen signiert und die QR-Codes auf den
 * Tickets absichert (siehe auth.ts und ticketToken.ts).
 *
 * Geprüft wird hier nicht nur, DASS es gesetzt ist, sondern auch, dass es
 * lang genug ist: Ein kurzes Geheimnis lässt sich durchprobieren, und wer es
 * hat, kann sich selbst eine gültige Admin-Sitzung und beliebige Tickets
 * ausstellen. 32 Zeichen sind die Untergrenze; `openssl rand -hex 32` liefert
 * 64 und ist der empfohlene Weg (siehe .env.example).
 */

export const APP_SECRET_MIN_LENGTH = 32;
const PLACEHOLDER = "change-me-to-a-long-random-string";

/** Prüft einen Wert und gibt die Fehlermeldung zurück — oder null, wenn er taugt. */
export function appSecretProblem(secret: string | undefined): string | null {
  if (!secret || secret.trim() === "") {
    return "APP_SECRET fehlt. Setze einen langen, zufälligen Wert (z.B. mit `openssl rand -hex 32`).";
  }
  if (secret === PLACEHOLDER) {
    return "APP_SECRET ist noch der Platzhalter aus .env.example. Bitte durch einen eigenen zufälligen Wert ersetzen (`openssl rand -hex 32`).";
  }
  if (secret.length < APP_SECRET_MIN_LENGTH) {
    return `APP_SECRET ist mit ${secret.length} Zeichen zu kurz (mindestens ${APP_SECRET_MIN_LENGTH}). Neuen Wert erzeugen: \`openssl rand -hex 32\`. Achtung: Ein Wechsel macht alle Ticket-QR-Codes ungültig — siehe RUNBOOK.`;
  }
  return null;
}

/** Liefert das geprüfte Geheimnis oder wirft mit einer Anleitung, was zu tun ist. */
export function getAppSecret(): string {
  const secret = process.env.APP_SECRET;
  const problem = appSecretProblem(secret);
  if (problem) throw new Error(problem);
  return secret as string;
}
