"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export type ScopeOption = {
  id: string;
  label: string;
};

/**
 * Auswahl, für welches Event die Zahlen im Dashboard gelten sollen.
 *
 * Die Auswahl landet als "?event=..." in der Adresse und wird server-seitig
 * ausgewertet. Vorteil: die Ansicht lässt sich als Lesezeichen speichern und
 * teilen — wer immer dasselbe Event im Blick hat, springt mit einem Klick
 * dorthin, statt jedes Mal neu auszuwählen.
 *
 * Der aktuelle Wert kommt als Prop von der Seite (nicht aus useSearchParams),
 * damit die Komponente ohne zusätzliche Suspense-Grenze auskommt.
 */
export function EventScopePicker({
  options,
  value
}: {
  options: ScopeOption[];
  /** Leerer String = alle Events. */
  value: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-2">
      <span className="sr-only">Zahlen anzeigen für</span>
      <select
        value={value}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value;
          startTransition(() => {
            router.push(next ? `/admin?event=${encodeURIComponent(next)}` : "/admin");
          });
        }}
        className="max-w-[240px] truncate rounded-full border border-paper/20 bg-ink px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-paper outline-none transition hover:border-soul-orange focus:border-soul-orange focus:ring-1 focus:ring-soul-orange disabled:opacity-50 sm:max-w-none"
      >
        <option value="">Alle Events</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
