"use client";

import { useState } from "react";
import { SignupForm } from "./SignupForm";
import { TicketAvailabilityGate } from "./TicketAvailabilityGate";
import { formatPrice, formatEventTime } from "@/lib/format";

type GuestlistTierView = {
  id: string;
  label: string | null;
  untilTime: string; // ISO
  priceCents: number;
};

/**
 * Sidebar-Box auf der Event-Detailseite. Bei ticketMode "PAID" oder
 * "GUESTLIST" verhält sie sich wie zuvor (ein einziges Formular). Bei
 * "BOTH" zeigt sie zusätzlich einen Umschalter, mit dem der Gast selbst
 * wählt, ob er ein Ticket kauft oder sich auf die Gästeliste einträgt —
 * beide Wege sind für dasselbe Event gleichzeitig gültig.
 */
export function TicketPurchasePanel({
  eventId,
  ticketMode,
  priceCents,
  currency,
  guestlistTiers,
  guestlistPrice,
  spotsLeft,
  isSoldOut,
  salesEndAtIso,
  salesClosed
}: {
  eventId: string;
  ticketMode: string;
  priceCents: number | null;
  currency: string;
  guestlistTiers: GuestlistTierView[];
  guestlistPrice: number | null;
  spotsLeft: number | null;
  isSoldOut: boolean;
  salesEndAtIso: string | null;
  salesClosed: boolean;
}) {
  const offersBoth = ticketMode === "BOTH";
  const [selected, setSelected] = useState<"PAID" | "GUESTLIST">(
    ticketMode === "GUESTLIST" ? "GUESTLIST" : "PAID"
  );

  return (
    <div className="rounded-2xl card-border bg-white/[0.02] p-6">
      {offersBoth && (
        <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl border border-paper/10 p-1">
          <button
            type="button"
            onClick={() => setSelected("PAID")}
            className={`rounded-lg py-2.5 text-xs font-semibold uppercase tracking-widest transition ${
              selected === "PAID"
                ? "bg-soul-orange text-ink"
                : "text-paper/50 hover:text-paper"
            }`}
          >
            Ticket kaufen
          </button>
          <button
            type="button"
            onClick={() => setSelected("GUESTLIST")}
            className={`rounded-lg py-2.5 text-xs font-semibold uppercase tracking-widest transition ${
              selected === "GUESTLIST"
                ? "bg-soul-orange text-ink"
                : "text-paper/50 hover:text-paper"
            }`}
          >
            Gästeliste
          </button>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-paper/50">
          {selected === "PAID" ? "Ticket" : "Gästeliste"}
        </span>
        <span className="text-display text-xl text-soul-orange">
          {selected === "PAID" && priceCents
            ? formatPrice(priceCents, currency)
            : guestlistPrice
              ? formatPrice(guestlistPrice, currency)
              : "Free"}
        </span>
      </div>

      {selected === "GUESTLIST" && guestlistTiers.length > 0 && (
        <div className="mb-6 flex flex-col gap-1.5 rounded-xl border border-paper/10 p-4">
          <p className="mb-1 text-[11px] uppercase tracking-widest text-paper/40">
            Preisstaffeln (Zahlung an der Abendkasse)
          </p>
          {guestlistTiers.map((tier) => {
            const isActive = tier.priceCents === guestlistPrice;
            return (
              <div
                key={tier.id}
                className={`flex items-center justify-between text-sm ${
                  isActive ? "text-soul-orange" : "text-paper/60"
                }`}
              >
                <span>
                  {tier.label ? `${tier.label} — ` : ""}
                  bis {formatEventTime(tier.untilTime)} Uhr
                </span>
                <span className="font-semibold">{formatPrice(tier.priceCents, currency)}</span>
              </div>
            );
          })}
        </div>
      )}

      {spotsLeft !== null && !isSoldOut && spotsLeft <= 20 && (
        <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-soul-orange">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-soul-orange" />
          Nur noch {spotsLeft} Plätze
        </p>
      )}

      {isSoldOut ? (
        <div className="rounded-xl border border-paper/15 p-6 text-center">
          <p className="text-display text-lg uppercase text-paper/60">Sold out</p>
          <p className="mt-2 text-sm text-paper/40">Dieses Event ist leider ausgebucht.</p>
        </div>
      ) : (
        <TicketAvailabilityGate ticketSalesEndAt={salesEndAtIso} initiallyClosed={salesClosed}>
          {/* key sorgt dafür, dass das Formular beim Umschalten zwischen Ticket
              und Gästeliste zurückgesetzt wird (kein stehen gebliebener
              Erfolgs-/Fehlerzustand aus dem jeweils anderen Modus). */}
          <SignupForm key={selected} eventId={eventId} ticketMode={selected} />
          {selected === "PAID" && (
            <p className="mt-4 text-center text-[11px] text-paper/40">
              Sichere Zahlung via Karte, Apple&nbsp;Pay, Google&nbsp;Pay oder PayPal
              (abgewickelt von Stripe).
            </p>
          )}
        </TicketAvailabilityGate>
      )}
    </div>
  );
}
