const BARS = [0, 120, 240, 360, 480];

/**
 * Ladeanzeige für Next.js' automatische loading.tsx-Grenzen (Start-,
 * Events- und Eventdetailseite rendern per force-dynamic bei jedem Aufruf
 * neu — ohne sichtbares Feedback wirkt der Bildschirm in diesem kurzen
 * Moment eingefroren). Fünf Balken im Takt statt eines generischen
 * Spinners, passend zum Club-Kontext.
 *
 * role="status" + sr-only-Text: Screenreader bekommen "Wird geladen" statt
 * fünf stumme <div>s vorgelesen.
 */
export function LoadingEqualizer() {
  return (
    <div
      role="status"
      className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-4"
    >
      <div className="flex h-10 items-end gap-[5px]">
        {BARS.map((delay) => (
          <span
            key={delay}
            aria-hidden="true"
            className="loading-bar h-full w-[5px] rounded-full bg-soul-orange"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
      <span className="sr-only">Wird geladen …</span>
    </div>
  );
}
