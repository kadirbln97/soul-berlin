"use client";

import { useEffect, useState } from "react";

type TimeLeft = {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function getTimeLeft(target: string): TimeLeft {
  const totalMs = Math.max(0, new Date(target).getTime() - Date.now());
  const totalSeconds = Math.floor(totalMs / 1000);
  return {
    totalMs,
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60
  };
}

const UNIT_LABEL: Record<keyof Omit<TimeLeft, "totalMs">, string> = {
  days: "Tage",
  hours: "Std",
  minutes: "Min",
  seconds: "Sek"
};

/**
 * Live-Countdown bis zu einem Ziel-Zeitpunkt (z.B. Verkaufsschluss). Läuft
 * rein clientseitig hoch, um Server/Client-Zeitzonen-Mismatches (Hydration)
 * zu vermeiden — der erste Render zeigt bewusst nichts, bis useEffect greift.
 */
export function Countdown({
  target,
  onExpire,
  urgentBelowMinutes = 60,
  label = "Anmeldung schließt in",
  urgentLabel = "Nur noch kurz"
}: {
  target: string;
  onExpire?: () => void;
  urgentBelowMinutes?: number;
  /** Beschriftung vor der Uhr — je nachdem, ob gerade Ticketkauf oder
   * Gästelisten-Anmeldung angezeigt wird (siehe TicketAvailabilityGate). */
  label?: string;
  urgentLabel?: string;
}) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    setTimeLeft(getTimeLeft(target));
    const interval = setInterval(() => {
      const next = getTimeLeft(target);
      setTimeLeft(next);
      if (next.totalMs <= 0) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [target, onExpire]);

  if (!timeLeft || timeLeft.totalMs <= 0) return null;

  const isUrgent = timeLeft.totalMs < urgentBelowMinutes * 60_000;
  const units: Array<keyof Omit<TimeLeft, "totalMs">> =
    timeLeft.days > 0 ? ["days", "hours", "minutes"] : ["hours", "minutes", "seconds"];

  return (
    <div
      role="timer"
      aria-live="polite"
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
        isUrgent
          ? "border-soul-orange/50 bg-soul-orange/10"
          : "border-paper/10 bg-white/[0.02]"
      }`}
    >
      <span
        className={`text-xs font-semibold uppercase tracking-widest ${
          isUrgent ? "text-soul-orange" : "text-paper/50"
        }`}
      >
        {isUrgent ? urgentLabel : label}
      </span>
      <div className="flex items-baseline gap-2">
        {units.map((unit) => (
          <span key={unit} className="flex items-baseline gap-1">
            <span className="text-display text-lg tabular-nums text-paper">
              {String(timeLeft[unit]).padStart(2, "0")}
            </span>
            <span className="text-[10px] uppercase text-paper/40">{UNIT_LABEL[unit]}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
