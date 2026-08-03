"use client";

import { useState } from "react";
import { SignupForm } from "./SignupForm";
import { TicketAvailabilityGate } from "./TicketAvailabilityGate";
import { formatPrice, formatEventTime } from "@/lib/format";
import { fill } from "@/lib/i18n";
import {
  calculatePriceBreakdown,
  describeDiscount,
  type DiscountRule
} from "@/lib/discount";
import { MAX_TICKETS_PER_ORDER } from "@/lib/validation";
import { getDict, type Locale } from "@/lib/i18n";

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
  salesClosed,
  autoDiscount,
  locale
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
  /** Rabatt, der ohne Code für alle gilt (falls eingerichtet). */
  autoDiscount?: DiscountRule | null;
  locale: Locale;
}) {
  const t = getDict(locale);
  const offersBoth = ticketMode === "BOTH";
  const [quantity, setQuantity] = useState(1);
  const [codeInput, setCodeInput] = useState("");
  const [appliedRule, setAppliedRule] = useState<DiscountRule | null>(autoDiscount ?? null);
  const [appliedCode, setAppliedCode] = useState("");
  const [codeChecking, setCodeChecking] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  const breakdown = priceCents
    ? calculatePriceBreakdown(priceCents, quantity, appliedRule)
    : null;

  async function applyCode() {
    const code = codeInput.trim();
    if (!code) return;
    setCodeChecking(true);
    setCodeError(null);
    try {
      const res = await fetch(
        `/api/discounts/check?eventId=${encodeURIComponent(eventId)}&code=${encodeURIComponent(code)}`
      );
      const data = await res.json();
      if (!res.ok || !data.discount) {
        setCodeError(data.error ?? "Code ungültig.");
        return;
      }
      setAppliedRule(data.discount);
      setAppliedCode(code);
      setCodeInput("");
    } catch {
      setCodeError("Verbindung fehlgeschlagen.");
    } finally {
      setCodeChecking(false);
    }
  }

  function removeCode() {
    setAppliedCode("");
    setAppliedRule(autoDiscount ?? null);
    setCodeError(null);
  }
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
                : "text-paper/70 hover:text-paper"
            }`}
          >
            {t.event.buyTicket}
          </button>
          <button
            type="button"
            onClick={() => setSelected("GUESTLIST")}
            className={`rounded-lg py-2.5 text-xs font-semibold uppercase tracking-widest transition ${
              selected === "GUESTLIST"
                ? "bg-soul-orange text-ink"
                : "text-paper/70 hover:text-paper"
            }`}
          >
            {t.event.guestlist}
          </button>
        </div>
      )}

      {/* Beim Ticketkauf wird die Servicegebühr offen aufgeschlüsselt und der
          Gesamtpreis hervorgehoben — der Gast soll vor dem Klick sehen, was
          tatsächlich abgebucht wird (Preisangabenverordnung). */}
      {selected === "PAID" && priceCents && breakdown ? (
        <div className="mb-6 flex flex-col gap-4">
          {/* Stückzahl */}
          <div>
            <label className="label-field" htmlFor="ticket-quantity">
              {t.event.quantity}
            </label>
            <select
              id="ticket-quantity"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="input-field"
            >
              {Array.from({ length: MAX_TICKETS_PER_ORDER }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          {/* Gutscheincode */}
          {appliedRule && appliedCode ? (
            <div className="flex items-center justify-between rounded-xl border border-soul-orange/40 bg-soul-orange/10 px-3 py-2">
              <span className="text-xs uppercase tracking-widest text-soul-orange">
                {appliedCode} · {describeDiscount(appliedRule, currency)}
              </span>
              <button
                type="button"
                onClick={removeCode}
                className="text-[11px] uppercase tracking-widest text-paper/60 hover:text-red-400"
              >
                {t.event.remove}
              </button>
            </div>
          ) : (
            <div>
              <label className="label-field">{t.event.voucher}</label>
              <div className="flex gap-2">
                <input
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                  className="input-field flex-1"
                  placeholder={t.event.voucherPlaceholder}
                />
                <button
                  type="button"
                  onClick={applyCode}
                  disabled={codeChecking || !codeInput.trim()}
                  className="shrink-0 rounded-full border border-paper/20 px-4 text-xs font-semibold uppercase tracking-widest text-paper/70 hover:text-soul-orange disabled:opacity-30"
                >
                  {codeChecking ? "…" : t.event.redeem}
                </button>
              </div>
              {codeError && <p className="mt-1 text-xs text-red-400">{codeError}</p>}
            </div>
          )}

          {/* Preisaufstellung */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-paper/70">
                {t.event.subtotal}{quantity > 1 ? ` × ${quantity}` : ""}
              </span>
              <span className="text-paper/70">
                {formatPrice(breakdown.subtotalCents, currency)}
              </span>
            </div>
            {breakdown.discountCents > 0 && appliedRule && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-soul-orange">
                  {describeDiscount(appliedRule, currency)}
                </span>
                <span className="text-soul-orange">
                  − {formatPrice(breakdown.discountCents, currency)}
                </span>
              </div>
            )}
            {breakdown.feeCents > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-paper/70">{t.event.serviceFee}</span>
                <span className="text-paper/70">
                  {formatPrice(breakdown.feeCents, currency)}
                </span>
              </div>
            )}
            <div className="mt-1 flex items-center justify-between border-t border-paper/10 pt-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-paper/70">
                {t.event.total}
              </span>
              <span className="text-display text-xl text-soul-orange">
                {formatPrice(breakdown.totalCents, currency)}
              </span>
            </div>
            {/* Pflichtangabe: Als Kleinunternehmer nach § 19 UStG wird keine
                Umsatzsteuer erhoben. "inkl. MwSt." wäre hier falsch und
                irreführend — deshalb bewusst dieser Hinweis. */}
            <p className="text-[11px] leading-snug text-paper/60">{t.price.noVat}</p>
          </div>
        </div>
      ) : (
        <div className="mb-6 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-paper/70">
            {selected === "PAID" ? t.events.ticket : t.event.guestlist}
          </span>
          <span className="text-display text-xl text-soul-orange">
            {guestlistPrice ? formatPrice(guestlistPrice, currency) : t.events.free}
          </span>
        </div>
      )}

      {selected === "GUESTLIST" && guestlistTiers.length > 0 && (
        <div className="mb-6 flex flex-col gap-1.5 rounded-xl border border-paper/10 p-4">
          <p className="mb-1 text-[11px] uppercase tracking-widest text-paper/60">
            {t.event.tierHeading}
          </p>
          {guestlistTiers.map((tier) => {
            const isActive = tier.priceCents === guestlistPrice;
            return (
              <div
                key={tier.id}
                className={`flex items-center justify-between text-sm ${
                  isActive ? "text-soul-orange" : "text-paper/75"
                }`}
              >
                <span>
                  {tier.label ? `${tier.label} — ` : ""}
                  {t.event.until} {formatEventTime(tier.untilTime)}
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
          {fill(t.event.spotsLeft, { n: spotsLeft })}
        </p>
      )}

      {isSoldOut ? (
        <div className="rounded-xl border border-paper/15 p-6 text-center">
          <p className="text-display text-lg uppercase text-paper/75">{t.event.soldOut}</p>
          <p className="mt-2 text-sm text-paper/60">{t.event.soldOutText}</p>
        </div>
      ) : (
        <TicketAvailabilityGate
          ticketSalesEndAt={salesEndAtIso}
          initiallyClosed={salesClosed}
          mode={selected}
          locale={locale}
        >
          {/* key sorgt dafür, dass das Formular beim Umschalten zwischen Ticket
              und Gästeliste zurückgesetzt wird (kein stehen gebliebener
              Erfolgs-/Fehlerzustand aus dem jeweils anderen Modus). */}
          <SignupForm
            key={selected}
            eventId={eventId}
            ticketMode={selected}
            quantity={selected === "PAID" ? quantity : 1}
            discountCode={appliedCode}
            locale={locale}
          />
          {selected === "PAID" && (
            <p className="mt-4 text-center text-[11px] text-paper/60">
              {t.event.payNote}
            </p>
          )}
        </TicketAvailabilityGate>
      )}
    </div>
  );
}
