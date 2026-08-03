import type { ReactNode } from "react";
import { formatPrice } from "@/lib/format";
import type { RevenueSummary } from "@/lib/revenue";

/**
 * Kompakte Umsatzanzeige für Dashboard und Event-Seite im Admin-Bereich.
 * Zeigt nur online über Stripe kassierte Beträge — Abendkassen-Einnahmen der
 * Gästeliste laufen bewusst nicht durchs System.
 */
/**
 * Eine Kennzahl in der Zeile unter dem Umsatz.
 *
 * grid-rows-subgrid übernimmt die Zeilen des Elterngitters: Beschriftung,
 * Zahl und Zusatz liegen dadurch bei allen drei Kennzahlen auf einer Linie —
 * auch wenn eine Beschriftung wie "Tickets verkauft" auf dem Handy zweizeilig
 * umbricht. Vorher schob dieser Umbruch die Zahl darunter nach unten.
 */
function Stat({ label, value, note }: { label: string; value: number; note?: string }) {
  return (
    <div className="row-span-3 grid grid-rows-subgrid gap-y-2">
      {/* 10px mit tracking-wider statt widest: bei 375–402 px Bildschirmbreite
          ist eine Spalte rund 94 px breit, „Anmeldungen“ misst so 85 px. Mit
          dem weiteren Zeichenabstand wären es 90 px — zu knapp, ein Umbruch
          würde die ganze Reihe wieder schief aussehen lassen. */}
      <dt className="text-[10px] font-semibold uppercase leading-tight tracking-wider text-paper/60">
        {label}
      </dt>
      <dd className="text-display self-end text-3xl leading-none text-paper">{value}</dd>
      <p className="text-[10px] leading-snug text-paper/50">{note ?? ""}</p>
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
      <dl className="mt-6 grid grid-cols-3 grid-rows-[auto_auto_auto] gap-x-4 gap-y-2 border-t border-paper/10 pt-5">
        <Stat label="Anmeldungen" value={summary.signupCount} note="Gäste gesamt" />
        {/* Kurzes Label mit Absicht: "Tickets verkauft" bricht auf dem Handy um
            und lässt die Spalte gedrängt wirken. Der Zusatz darunter erklärt es. */}
        <Stat label="Tickets" value={summary.paidCount} note="online bezahlt" />
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
