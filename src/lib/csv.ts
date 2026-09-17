/**
 * CSV-Felder für Tabellenprogramme sicher aufbereiten.
 *
 * Zwei getrennte Probleme:
 *
 * 1. CSV-Syntax: Anführungszeichen verdoppeln, Feld in Anführungszeichen
 *    setzen — sonst zerlegt ein Semikolon im Namen die Zeile.
 *
 * 2. Formel-Injection: Excel, LibreOffice und Google Sheets werten einen
 *    Zellinhalt, der mit = + - @ oder einem Tabulator beginnt, als Formel aus
 *    — auch wenn das Feld in Anführungszeichen steht, denn die gehören zur
 *    CSV-Syntax und sind beim Auswerten längst weg. Ein Gast, der sich als
 *    =HYPERLINK("http://…") oder =WEBSERVICE(…) anmeldet, führt damit beim
 *    Öffnen der Liste Code auf dem Rechner aus, der sie öffnet.
 *    Gegenmittel: ein Apostroph davor. Den zeigt keine Tabelle an, er sorgt
 *    aber dafür, dass der Inhalt als Text gilt.
 */

/** Zeichen, die am Feldanfang eine Formel einleiten können. */
const FORMEL_START = /^[=+\-@\t\r]/;

/** Ein Wert als Textzelle — gegen Formel-Auswertung abgesichert. */
export function csvSafeValue(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  return FORMEL_START.test(text) ? `'${text}` : text;
}

/** Fertiges CSV-Feld: erst entschärfen, dann nach CSV-Regeln quoten. */
export function csvField(value: unknown): string {
  return `"${csvSafeValue(value).replace(/"/g, '""')}"`;
}

/** Ganze Zeile mit Semikolon — das Trennzeichen, das Excel im Deutschen erwartet. */
export function csvRow(values: unknown[]): string {
  return values.map(csvField).join(";");
}
