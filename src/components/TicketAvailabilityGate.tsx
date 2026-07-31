"use client";

import { useState, type ReactNode } from "react";
import { Countdown } from "./Countdown";

/**
 * Umschließt das Signup-Formular auf der Event-Seite: zeigt (falls gesetzt)
 * einen Live-Countdown bis zum Verkaufsschluss und blendet automatisch auf
 * eine "geschlossen"-Meldung um, sobald die Zeit abläuft — ohne Reload, auch
 * wenn ein Gast schon länger auf der Seite ist.
 */
export function TicketAvailabilityGate({
  ticketSalesEndAt,
  initiallyClosed,
  children
}: {
  ticketSalesEndAt: string | null;
  initiallyClosed: boolean;
  children: ReactNode;
}) {
  const [closed, setClosed] = useState(initiallyClosed);

  if (closed) {
    return (
      <div className="rounded-xl border border-paper/15 p-6 text-center">
        <p className="text-display text-lg uppercase text-paper/60">Anmeldung geschlossen</p>
        <p className="mt-2 text-sm text-paper/40">
          Der Anmeldezeitraum für dieses Event ist leider abgelaufen.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {ticketSalesEndAt && (
        <Countdown target={ticketSalesEndAt} onExpire={() => setClosed(true)} />
      )}
      {children}
    </div>
  );
}
