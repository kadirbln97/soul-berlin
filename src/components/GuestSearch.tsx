"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/format";

type Guest = {
  id: string;
  name: string;
  email: string;
  status: string;
  tierLabel: string | null;
  amountCents: number | null;
  currency: string;
  isManual: boolean;
  /** Gast plus Begleitung — bei "Max Mustermann +2" also 3. */
  partySize: number;
  promoterName: string | null;
  checkedInAt: string | null;
  ticketType: "PAID_ONLINE" | "GUESTLIST";
};

/**
 * Namenssuche für den Einlass — für Gäste ohne QR-Code (manuell eingetragene
 * Promoter-Gäste) oder wenn jemand seine Bestätigungsmail nicht findet.
 */
export function GuestSearch({
  eventId,
  onCheckedIn
}: {
  eventId: string;
  onCheckedIn?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Kurz warten, statt bei jedem Tastendruck zu suchen.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setGuests([]);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/admin/events/${eventId}/guest-search?q=${encodeURIComponent(q)}`
        );
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? "Suche fehlgeschlagen.");
          return;
        }
        setGuests(data.guests ?? []);
      } catch {
        if (!cancelled) setError("Verbindung fehlgeschlagen.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, eventId]);

  async function checkIn(guest: Guest) {
    setBusyId(guest.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/tickets/${guest.id}/checkin`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Check-in fehlgeschlagen.");
        return;
      }
      setGuests((prev) =>
        prev.map((g) =>
          g.id === guest.id
            ? { ...g, status: "CHECKED_IN", checkedInAt: new Date().toISOString() }
            : g
        )
      );
      onCheckedIn?.();
    } catch {
      setError("Verbindung fehlgeschlagen.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="rounded-2xl card-border p-4">
      <label className="label-field" htmlFor="guest-search">
        Gast per Name suchen
      </label>
      <input
        id="guest-search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="input-field"
        placeholder="Name eingeben (mind. 2 Zeichen)"
        autoComplete="off"
      />

      {error && (
        <p role="alert" className="mt-2 text-xs text-red-400">
          {error}
        </p>
      )}

      {loading && <p className="mt-2 text-xs text-paper/40">Suche …</p>}

      {!loading && query.trim().length >= 2 && guests.length === 0 && !error && (
        <p className="mt-3 text-sm text-paper/40">Kein Gast mit diesem Namen gefunden.</p>
      )}

      {guests.length > 0 && (
        <ul className="mt-3 flex flex-col divide-y divide-paper/10">
          {guests.map((g) => {
            const isCheckedIn = g.status === "CHECKED_IN";
            const isBlocked = g.status === "REFUNDED" || g.status === "CANCELLED";
            return (
              <li key={g.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm text-paper">
                    <span className="truncate">{g.name}</span>
                    {/* Deutlich sichtbar statt nur als Randnotiz: an der Tür
                        entscheidet diese Zahl, wie viele Leute reindürfen. */}
                    {g.partySize > 1 && (
                      <span className="shrink-0 rounded-full bg-soul-orange/20 px-2 py-0.5 text-[11px] font-bold text-soul-orange">
                        {g.partySize} Pers.
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-paper/40">
                    {g.ticketType === "PAID_ONLINE" ? "Ticket · bezahlt" : "Gästeliste"}
                    {g.partySize > 1 ? ` · inkl. ${g.partySize - 1} Begleitung` : ""}
                    {g.tierLabel ? ` · ${g.tierLabel}` : ""}
                    {g.promoterName ? ` · via ${g.promoterName}` : ""}
                    {g.ticketType === "GUESTLIST" && g.amountCents
                      ? ` · ${formatPrice(g.amountCents, g.currency)} an der Tür`
                      : ""}
                  </p>
                </div>

                {isBlocked ? (
                  <span className="shrink-0 text-[11px] font-semibold uppercase tracking-widest text-red-400">
                    Storniert
                  </span>
                ) : isCheckedIn ? (
                  <span className="shrink-0 text-[11px] font-semibold uppercase tracking-widest text-green-400">
                    {g.partySize > 1 ? `${g.partySize} eingecheckt ✓` : "Eingecheckt ✓"}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => checkIn(g)}
                    disabled={busyId === g.id}
                    className="shrink-0 rounded-full bg-soul-orange px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-ink hover:opacity-90 disabled:opacity-40"
                  >
                    {busyId === g.id
                      ? "…"
                      : g.partySize > 1
                        ? `${g.partySize} einchecken`
                        : "Einchecken"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
