import { formatPrice } from "@/lib/format";
import type { RevenueSummary } from "@/lib/revenue";

/**
 * Kompakte Umsatzanzeige für Dashboard und Event-Seite im Admin-Bereich.
 * Zeigt nur online über Stripe kassierte Beträge — Abendkassen-Einnahmen der
 * Gästeliste laufen bewusst nicht durchs System.
 */
export function RevenueSummaryCard({
  summary,
  currency = "eur",
  title = "Umsatz (online)",
  hint
}: {
  summary: RevenueSummary;
  currency?: string;
  title?: string;
  hint?: string;
}) {
  const netCents = summary.grossCents;

  return (
    <div className="rounded-2xl card-border p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xs font-bold uppercase tracking-widest text-paper/40">{title}</h2>
        <span className="text-[11px] text-paper/30">
          {summary.paidCount} {summary.paidCount === 1 ? "Ticket" : "Tickets"} verkauft
        </span>
      </div>

      <p className="text-display text-3xl text-soul-orange">
        {formatPrice(netCents, currency)}
      </p>
      <p className="mt-1 text-[11px] text-paper/40">
        Gesamt eingenommen (Tickets + Servicegebühren)
      </p>

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
