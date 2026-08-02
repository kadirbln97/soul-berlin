/**
 * Sichtbarer Hinweis auf KI-generierte Bilder/Videos.
 *
 * Hintergrund: Seit dem 02.08.2026 gelten die Transparenzpflichten aus
 * Art. 50 KI-VO. Für uns als Betreiber ist vor allem Abs. 4 relevant —
 * KI-erzeugte Bild-/Videoinhalte, die reale Personen, Orte oder Ereignisse
 * darstellen bzw. authentisch wirken, müssen als solche offengelegt werden.
 *
 * Die Verordnung verlangt, dass der Hinweis "klar und erkennbar" spätestens
 * bei der ersten Wahrnehmung des Inhalts erscheint. Deshalb sitzt das Badge
 * direkt auf dem Bild (nicht in einer Fußnote), hat starken Kontrast und
 * einen ausgeschriebenen Titel für Screenreader.
 */
export function AiBadge({
  label,
  title,
  position = "bottom-2 left-2"
}: {
  /** Kurzer Text im Badge, z.B. "KI-generiert". */
  label: string;
  /** Ausführlicher Satz für Screenreader und Tooltip. */
  title: string;
  /** Ecke, in der das Badge sitzt — je nach Bild, damit nichts überdeckt wird. */
  position?: string;
}) {
  return (
    <span
      title={title}
      className={`pointer-events-none absolute z-10 ${position} rounded-full bg-ink/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-paper ring-1 ring-paper/30 backdrop-blur-sm`}
    >
      <span aria-hidden="true">{label}</span>
      <span className="sr-only">{title}</span>
    </span>
  );
}
