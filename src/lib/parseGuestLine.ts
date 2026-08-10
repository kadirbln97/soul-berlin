/** Obergrenze pro Zeile — schützt vor Tippfehlern wie "Max +500". */
export const MAX_PARTY_SIZE = 20;

export type ParsedGuestLine = {
  /** Name ohne den Begleitungs-Zusatz. */
  name: string;
  /** Gast + Begleitung, also mindestens 1. */
  partySize: number;
};

/**
 * Erkennt am Zeilenende, wie viele Begleitpersonen ein Gast mitbringt.
 * Promoter schreiben ihre Listen frei Hand, deshalb werden die gängigen
 * Schreibweisen abgedeckt:
 *
 *   "Max Mustermann +2"        → 3 Personen
 *   "Max Mustermann+2"         → 3 Personen
 *   "Max Mustermann (+2)"      → 3 Personen
 *   "Max Mustermann plus 2"    → 3 Personen
 *   "Max Mustermann +2 Pers."  → 3 Personen
 *   "Max Mustermann"           → 1 Person
 *
 * Bewusst nur am Zeilenende: ein "+" mitten im Namen (etwa bei einem
 * Künstlernamen wie "Sam + The Band") bleibt damit unangetastet.
 */
export function parseGuestLine(rawLine: string): ParsedGuestLine {
  // Häufige Listenzeichen aus kopierten Notizen entfernen ("- Max", "1. Max").
  const line = rawLine.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim();

  const match = line.match(
    // Optional Klammer auf, dann "+" oder "plus", die Zahl, optional noch ein
    // Wort wie "Personen"/"Pers."/"Gäste", optional Klammer zu — alles am Ende.
    /^(.*?)\s*\(?\s*(?:\+|plus\s)\s*(\d{1,3})\s*(?:p(?:ers(?:onen|\.)?)?|g(?:äste|aeste)?|leute)?\s*\)?\s*$/i
  );

  if (!match) {
    return { name: line, partySize: 1 };
  }

  const name = match[1].trim();
  const companions = Number(match[2]);

  // Ohne Namen davor ist das keine Begleitangabe, sondern eine reine Zahl —
  // dann lieber die Zeile unverändert lassen, statt einen leeren Gast anzulegen.
  if (name.length === 0) {
    return { name: line, partySize: 1 };
  }

  return {
    name,
    partySize: Math.min(1 + companions, MAX_PARTY_SIZE)
  };
}

/**
 * Zerlegt einen mehrzeiligen Namensblock in Gästeeinträge. Leere Zeilen und
 * offensichtliche Fragmente (unter 2 Zeichen) fallen raus.
 */
export function parseGuestLines(text: string): ParsedGuestLine[] {
  return text
    .split(/\r?\n/)
    .map(parseGuestLine)
    .filter((entry) => entry.name.length >= 2);
}

/** Summe aller Personen inklusive Begleitung. */
export function countPeople(entries: ParsedGuestLine[]): number {
  return entries.reduce((sum, entry) => sum + entry.partySize, 0);
}
