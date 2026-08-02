import type { ReactNode } from "react";
import { formatPrice } from "@/lib/format";
import type { RevenueSummary } from "@/lib/revenue";

/**
 * Kompakte Umsatzanzeige für Dashboard und Event-Seite im Admin-Bereich.
 * Zeigt nur online über Stripe kassierte Beträge — Abendkassen-Einnahmen der
 * Gästeliste laufen bewusst nicht durchs System.
 */
/** Eine Kennzahl in der Zeile unter dem Umsatz. */
function Stat({ label, value, note }: { label: string; value: number; note?: string }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-widest text-paper/40">
        {label}
      </dt>
      <dd className="text-display mt-1 text-2xl text-paper">{value}</dd>
      {note && <p className="mt-0.5 text-[10px] text-paper/30">{note}</p>}
    </div>
  );
}

export function RevenueSummaryCard({
  summary,
  currency = "eur",
  title = "Umsatz (online)",
  hint,
  action
}: {
  summary: RevenueSummary;
  currency?: string;
  title?: string;
  hint?: string;
  /** Optionales Bedienelement rechts neben der Überschrift (z.B. Event-Auswahl). */
  action?: ReactNode;
}) {
  const netCents = summary.grossCents;

  return (
    <div className="rounded-2xl card-border p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-paper/40">{title}</h2>
        {action}
      </div>

      <p className="text-display text-3xl text-soul-orange">
        {formatPrice(netCents, currency)}
      </p>
      <p className="mt-1 text-[11px] text-paper/40">
        Gesamt eingenommen (Tickets + Servicegebühren)
      </p>

      {/* Anmeldezahlen: die Summe ist das, was an der Tür ankommt — Tickets und
          Gästeliste zusammen. Die Aufteilung darunter zeigt, wie sie zustande
          kommt, weil nur der Ticket-Anteil Umsatz erzeugt. */}
      <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-paper/10 pt-4">
        <Stat label="Anmeldungen" value={summary.signupCount} note="Gäste gesamt" />
        <Stat label="Tickets verkauft" value={summary.paidCount} note="online bezahlt" />
        <Stat
          label="Gästeliste"
          value={summary.guestlistCount}
          note={
            summary.manualCount > 0
              ? `davon ${summary.manualCount} manuell`
              : "Zahlung an der Tür"
          }
        />
      </dl>

      <dl className="mt-4 flex flex-col gap-2 border-t border-paper/10 pt-4 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-paper/50">Ticketumsatz</dt>
          <dd className="text-paper/80">{formatPrice(summary.ticketCents, currency)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-paper/50">Servicegebühren</dt>
          <dd className="text-paper/80">{formatPrice(summary.feeCents, currency)}</dd>
        </div>
        {summary.refundedCount > 0 && (
          <div className="flex items-center justify-between">
            <dt className="text-paper/50">
              Erstattet ({summary.refundedCount})
            </dt>
            <dd className="text-red-400">− {formatPrice(summary.refundedCents, currency)}</dd>
          </div>
        )}
      </dl>

      <p className="mt-4 text-[11px] text-paper/30">
        {hint ??
          "Nur online bezahlte Tickets. Bar-/Kartenzahlungen an der Abendkasse sind hier nicht enthalten."}
      </p>
    </div>
  );
}
