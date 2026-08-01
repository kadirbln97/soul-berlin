"use client";

import { useState, type ReactNode } from "react";
import { Countdown } from "./Countdown";
import { getDict, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";

/**
 * Umschließt das Signup-Formular auf der Event-Seite: zeigt (falls gesetzt)
 * einen Live-Countdown bis zum Verkaufsschluss und blendet automatisch auf
 * eine "geschlossen"-Meldung um, sobald die Zeit abläuft — ohne Reload, auch
 * wenn ein Gast schon länger auf der Seite ist.
 *
 * Die Beschriftungen richten sich danach, was der Gast gerade sieht: beim
 * Ticketkauf endet ein Verkauf, bei der Gästeliste eine Anmeldung. Bei Events
 * mit beiden Optionen wechselt der Text mit, sobald umgeschaltet wird.
 */
export function TicketAvailabilityGate({
  ticketSalesEndAt,
  initiallyClosed,
  mode,
  locale = DEFAULT_LOCALE,
  children
}: {
  ticketSalesEndAt: string | null;
  initiallyClosed: boolean;
  /** Was dem Gast gerade angezeigt wird: Ticketkauf oder Gästeliste. */
  mode: "PAID" | "GUESTLIST";
  locale?: Locale;
  children: ReactNode;
}) {
  const t = getDict(locale);
  const [closed, setClosed] = useState(initiallyClosed);

  const isPaid = mode === "PAID";
  const countdownLabel = isPaid ? t.event.salesEndsIn : t.event.signupEndsIn;
  const closedTitle = isPaid ? t.event.salesClosed : t.event.signupClosed;
  const closedText = isPaid ? t.event.salesClosedText : t.event.signupClosedText;

  if (closed) {
    return (
      <div className="rounded-xl border border-paper/15 p-6 text-center">
        <p className="text-display text-lg uppercase text-paper/60">{closedTitle}</p>
        <p className="mt-2 text-sm text-paper/40">{closedText}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {ticketSalesEndAt && (
        <Countdown
          target={ticketSalesEndAt}
          onExpire={() => setClosed(true)}
          label={countdownLabel}
          urgentLabel={t.event.almostOver}
          unitLabels={{
            days: t.event.unitDays,
            hours: t.event.unitHours,
            minutes: t.event.unitMinutes,
            seconds: t.event.unitSeconds
          }}
        />
      )}
      {children}
    </div>
  );
}
