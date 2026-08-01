"use client";

import { useState, type ReactNode } from "react";
import { Countdown } from "./Countdown";

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
  children
}: {
  ticketSalesEndAt: string | null;
  initiallyClosed: boolean;
  /** Was dem Gast gerade angezeigt wird: Ticketkauf oder Gästeliste. */
  mode: "PAID" | "GUESTLIST";
  children: ReactNode;
}) {
  const [closed, setClosed] = useState(initiallyClosed);

  const isPaid = mode === "PAID";
  const countdownLabel = isPaid ? "Ticketverkauf endet in" : "Anmeldung schließt in";
  const closedTitle = isPaid ? "Ticketverkauf beendet" : "Anmeldung geschlossen";
  const closedText = isPaid
    ? "Für dieses Event werden online keine Tickets mehr verkauft."
    : "Der Anmeldezeitraum für dieses Event ist leider abgelaufen.";

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
        />
      )}
      {children}
    </div>
  );
}
