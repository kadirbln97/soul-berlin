"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Scanner } from "@/components/Scanner";
import { formatEventTime, formatPrice } from "@/lib/format";

type EventOption = {
  id: string;
  title: string;
  status: string;
};

// "PAID_ONLINE" = per Stripe-Ticketkauf bezahlt, "GUESTLIST" = Gästeliste
// (ggf. mit Staffelpreis, der an der Tür kassiert wird — siehe amountCents).
type TicketType = "PAID_ONLINE" | "GUESTLIST";

type ScanResult = {
  result: "VALID" | "ALREADY_USED" | "REFUNDED" | "INVALID";
  message: string;
  ticketId?: string;
  guestName?: string;
  eventTitle?: string;
  tierLabel?: string | null;
  ticketType?: TicketType;
  amountCents?: number | null;
  currency?: string;
  offline?: boolean;
};

type OfflineTicket = {
  id: string;
  name: string;
  status: string;
  tierLabel: string | null;
  checkedInAt: string | null;
  ticketType: TicketType;
  amountCents: number | null;
  currency: string;
};

type OfflineDataset = {
  eventId: string;
  eventTitle: string;
  fetchedAt: string;
  tickets: OfflineTicket[];
};

type PendingScan = {
  ticketId: string;
  scannedAt: string;
  guestName: string;
};

/**
 * Die letzten Scans bleiben kurz sichtbar, damit an der Tür in Ruhe
 * nachträglich erstattet werden kann — die eigentliche Ergebnisanzeige
 * verschwindet ja nach wenigen Sekunden automatisch, damit die Schlange
 * weiterläuft.
 */
type RecentScan = {
  ticketId: string;
  guestName: string;
  ticketType?: TicketType;
  amountCents?: number | null;
  currency?: string;
  refunded: boolean;
};

type TierStat = { label: string; total: number; checkedIn: number };
type Stats = { total: number; checkedIn: number; byTier: TierStat[] };

const RESULT_STYLE: Record<ScanResult["result"], string> = {
  VALID: "border-green-500 bg-green-500/10 text-green-400",
  ALREADY_USED: "border-yellow-500 bg-yellow-500/10 text-yellow-400",
  REFUNDED: "border-red-500 bg-red-500/10 text-red-400",
  INVALID: "border-red-500 bg-red-500/10 text-red-400"
};

const RESULT_TITLE: Record<ScanResult["result"], string> = {
  VALID: "Einlass gewährt ✅",
  ALREADY_USED: "Bereits eingecheckt ⚠️",
  REFUNDED: "Storniert / erstattet ❌",
  INVALID: "Ungültiger Code ❌"
};

function offlineKey(eventId: string) {
  return `soul-scanner-offline-${eventId}`;
}
function queueKey(eventId: string) {
  return `soul-scanner-queue-${eventId}`;
}

/** Extrahiert die Ticket-ID aus einem signierten Token (Format "<id>.<hmac>")
 * ohne die Signatur zu prüfen — reicht offline, weil nur IDs aus dem vorher
 * heruntergeladenen, authentifizierten Datensatz als gültig akzeptiert werden. */
function extractTicketId(token: string): string | null {
  const lastDot = token.lastIndexOf(".");
  if (lastDot <= 0) return null;
  return token.slice(0, lastDot);
}

export function ScannerClient({ events }: { events: EventOption[] }) {
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id ?? "");
  const [active, setActive] = useState(true);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [offlineDataset, setOfflineDataset] = useState<OfflineDataset | null>(null);
  const [queue, setQueue] = useState<PendingScan[]>([]);
  const [loadingOffline, setLoadingOffline] = useState(false);
  const [offlineLoadError, setOfflineLoadError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [refundError, setRefundError] = useState<string | null>(null);

  const busyRef = useRef(false);
  const selectedEventIdRef = useRef(selectedEventId);
  selectedEventIdRef.current = selectedEventId;
  const autoResumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedEvent = useMemo(
    () => events.find((e) => e.id === selectedEventId) ?? null,
    [events, selectedEventId]
  );

  // Online/Offline-Status verfolgen.
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // Lokale Offline-Daten + Warteschlange laden, wenn das Event wechselt.
  useEffect(() => {
    if (!selectedEventId) return;
    try {
      const rawData = localStorage.getItem(offlineKey(selectedEventId));
      setOfflineDataset(rawData ? JSON.parse(rawData) : null);
      const rawQueue = localStorage.getItem(queueKey(selectedEventId));
      setQueue(rawQueue ? JSON.parse(rawQueue) : []);
    } catch {
      setOfflineDataset(null);
      setQueue([]);
    }
    setResult(null);
    setSyncMessage(null);
  }, [selectedEventId]);

  function persistQueue(eventId: string, next: PendingScan[]) {
    setQueue(next);
    try {
      localStorage.setItem(queueKey(eventId), JSON.stringify(next));
    } catch {
      // localStorage evtl. voll/deaktiviert — Warteschlange bleibt zumindest im State.
    }
  }

  function persistOfflineDataset(eventId: string, next: OfflineDataset) {
    setOfflineDataset(next);
    try {
      localStorage.setItem(offlineKey(eventId), JSON.stringify(next));
    } catch {
      // ignorieren — Datensatz bleibt zumindest für diese Sitzung im State.
    }
  }

  // Live-Statistik vom Server holen (nur online) — alle paar Sekunden.
  const refreshStats = useCallback(async () => {
    if (!selectedEventId) return;
    try {
      const res = await fetch(`/api/admin/events/${selectedEventId}/checkin-stats`, {
        cache: "no-store"
      });
      if (!res.ok) return;
      const data = await res.json();
      setStats({ total: data.total, checkedIn: data.checkedIn, byTier: data.byTier });
    } catch {
      // still — Anzeige bleibt einfach auf dem letzten bekannten Stand.
    }
  }, [selectedEventId]);

  useEffect(() => {
    if (!selectedEventId || !isOnline) return;
    refreshStats();
    const interval = setInterval(refreshStats, 8000);
    return () => clearInterval(interval);
  }, [selectedEventId, isOnline, refreshStats]);

  // Lokale (Offline-)Statistik aus Datensatz + Warteschlange ableiten — wird
  // angezeigt, wenn keine Verbindung besteht oder zusätzlich zur Server-Statistik.
  const localStats: Stats | null = useMemo(() => {
    if (!offlineDataset) return null;
    const pendingIds = new Set(queue.map((q) => q.ticketId));
    const byTierMap = new Map<string, TierStat>();
    let checkedIn = 0;
    for (const t of offlineDataset.tickets) {
      if (t.status === "REFUNDED" || t.status === "CANCELLED") continue;
      const key = t.tierLabel ?? "__none__";
      const label = t.tierLabel ?? "Ohne Kategorie";
      if (!byTierMap.has(key)) byTierMap.set(key, { label, total: 0, checkedIn: 0 });
      const entry = byTierMap.get(key)!;
      entry.total += 1;
      const isCheckedIn = t.status === "CHECKED_IN" || pendingIds.has(t.id);
      if (isCheckedIn) {
        entry.checkedIn += 1;
        checkedIn += 1;
      }
    }
    return {
      total: offlineDataset.tickets.filter((t) => t.status !== "REFUNDED" && t.status !== "CANCELLED")
        .length,
      checkedIn,
      byTier: Array.from(byTierMap.values()).sort((a, b) => a.label.localeCompare(b.label, "de"))
    };
  }, [offlineDataset, queue]);

  const displayStats = isOnline && stats ? stats : localStats;

  async function loadOfflineData() {
    if (!selectedEventId) return;
    setLoadingOffline(true);
    setOfflineLoadError(null);
    try {
      const res = await fetch(`/api/admin/events/${selectedEventId}/offline-tickets`, {
        cache: "no-store"
      });
      if (!res.ok) {
        setOfflineLoadError("Konnte Offline-Daten nicht laden.");
        return;
      }
      const data = await res.json();
      persistOfflineDataset(selectedEventId, {
        eventId: data.eventId,
        eventTitle: data.eventTitle,
        fetchedAt: data.fetchedAt,
        tickets: data.tickets
      });
      // Warteschlange bleibt bestehen (falls noch offene Syncs), wird nicht gelöscht.
    } catch {
      setOfflineLoadError("Verbindung fehlgeschlagen — bitte online erneut versuchen.");
    } finally {
      setLoadingOffline(false);
    }
  }

  const syncQueue = useCallback(async () => {
    const eventId = selectedEventIdRef.current;
    if (!eventId) return;
    let currentQueue: PendingScan[] = [];
    try {
      const raw = localStorage.getItem(queueKey(eventId));
      currentQueue = raw ? JSON.parse(raw) : [];
    } catch {
      currentQueue = [];
    }
    if (currentQueue.length === 0) return;

    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/sync-offline-checkins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scans: currentQueue.map((q) => ({ ticketId: q.ticketId, scannedAt: q.scannedAt }))
        })
      });
      if (!res.ok) {
        setSyncMessage("Sync fehlgeschlagen — wird automatisch erneut versucht.");
        return;
      }
      const data = await res.json();
      const already = data.results.filter((r: { result: string }) => r.result === "ALREADY_USED").length;
      persistQueue(eventId, []);
      setSyncMessage(
        already > 0
          ? `${currentQueue.length} Scans synchronisiert (${already} waren bereits von einem anderen Gerät eingecheckt).`
          : `${currentQueue.length} Scans erfolgreich synchronisiert.`
      );
      refreshStats();
    } catch {
      setSyncMessage("Noch keine Verbindung — wird automatisch erneut versucht, sobald online.");
    } finally {
      setSyncing(false);
    }
  }, [refreshStats]);

  // Automatisch synchronisieren, sobald die Verbindung wieder da ist.
  useEffect(() => {
    if (isOnline) {
      syncQueue();
    }
  }, [isOnline, syncQueue]);

  const handleScan = useCallback(
    async (decodedText: string) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setActive(false);

      const eventId = selectedEventIdRef.current;

      // 1) Online-Pfad: Server ist die Wahrheit, solange erreichbar.
      if (isOnline) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 6000);
          const res = await fetch("/api/tickets/validate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: decodedText }),
            signal: controller.signal
          });
          clearTimeout(timeout);
          const data = await res.json();
          setResult(data);
          refreshStats();
          busyRef.current = false;
          return;
        } catch {
          // Fetch fehlgeschlagen (kein Internet trotz "online" oder Server nicht
          // erreichbar) — auf Offline-Pfad zurückfallen, falls Daten vorhanden.
        }
      }

      // 2) Offline-Pfad.
      const ticketId = extractTicketId(decodedText);
      if (!ticketId) {
        setResult({ result: "INVALID", message: "QR-Code konnte nicht gelesen werden.", offline: true });
        busyRef.current = false;
        return;
      }

      let dataset: OfflineDataset | null = null;
      try {
        const raw = eventId ? localStorage.getItem(offlineKey(eventId)) : null;
        dataset = raw ? JSON.parse(raw) : null;
      } catch {
        dataset = null;
      }

      if (!dataset) {
        setResult({
          result: "INVALID",
          message:
            "Keine Offline-Daten geladen. Bitte vorher online auf „Für Offline-Scan laden“ tippen.",
          offline: true
        });
        busyRef.current = false;
        return;
      }

      let currentQueue: PendingScan[] = [];
      try {
        const raw = eventId ? localStorage.getItem(queueKey(eventId)) : null;
        currentQueue = raw ? JSON.parse(raw) : [];
      } catch {
        currentQueue = [];
      }

      const ticket = dataset.tickets.find((t) => t.id === ticketId);
      if (!ticket) {
        setResult({
          result: "INVALID",
          message: "Ticket nicht in den lokalen Offline-Daten gefunden.",
          offline: true
        });
        busyRef.current = false;
        return;
      }

      if (ticket.status === "REFUNDED" || ticket.status === "CANCELLED") {
        setResult({
          result: "REFUNDED",
          message: "Dieses Ticket wurde storniert/erstattet — kein Einlass.",
          guestName: ticket.name,
          tierLabel: ticket.tierLabel,
          ticketType: ticket.ticketType,
          amountCents: ticket.amountCents,
          currency: ticket.currency,
          offline: true
        });
        busyRef.current = false;
        return;
      }

      const alreadyPending = currentQueue.some((q) => q.ticketId === ticketId);
      if (ticket.status === "CHECKED_IN" || alreadyPending) {
        setResult({
          result: "ALREADY_USED",
          message: "Bereits eingecheckt (offline erfasst).",
          guestName: ticket.name,
          tierLabel: ticket.tierLabel,
          ticketType: ticket.ticketType,
          amountCents: ticket.amountCents,
          currency: ticket.currency,
          offline: true
        });
        busyRef.current = false;
        return;
      }

      // Als eingecheckt markieren — lokal, wird später synchronisiert.
      const scannedAt = new Date().toISOString();
      const updatedDataset: OfflineDataset = {
        ...dataset,
        tickets: dataset.tickets.map((t) =>
          t.id === ticketId ? { ...t, status: "CHECKED_IN", checkedInAt: scannedAt } : t
        )
      };
      if (eventId) persistOfflineDataset(eventId, updatedDataset);

      const nextQueue = [...currentQueue, { ticketId, scannedAt, guestName: ticket.name }];
      if (eventId) persistQueue(eventId, nextQueue);

      setResult({
        result: "VALID",
        message: "Einlass gewährt (offline — wird synchronisiert, sobald wieder online).",
        guestName: ticket.name,
        tierLabel: ticket.tierLabel,
        ticketType: ticket.ticketType,
        amountCents: ticket.amountCents,
        currency: ticket.currency,
        offline: true
      });
      busyRef.current = false;
    },
    [isOnline, refreshStats]
  );

  // Jeden erkannten Gast in die Liste der letzten Scans aufnehmen (max. 5),
  // damit die Erstattung nicht davon abhängt, ob man den 4-Sekunden-Moment
  // der Ergebnisanzeige erwischt.
  useEffect(() => {
    if (!result?.ticketId || !result.guestName) return;
    if (result.result !== "VALID" && result.result !== "ALREADY_USED") return;

    const entry: RecentScan = {
      ticketId: result.ticketId,
      guestName: result.guestName,
      ticketType: result.ticketType,
      amountCents: result.amountCents,
      currency: result.currency,
      refunded: false
    };
    setRecentScans((prev) => [entry, ...prev.filter((s) => s.ticketId !== entry.ticketId)].slice(0, 5));
  }, [result]);

  /** Storniert das Ticket und erstattet bei Online-Käufen echtes Geld zurück. */
  async function refundTicket(scan: RecentScan) {
    const isPaid = scan.ticketType === "PAID_ONLINE";
    const confirmText = isPaid
      ? `${scan.guestName} abweisen und ${
          scan.amountCents ? formatPrice(scan.amountCents, scan.currency ?? "eur") : "den Ticketpreis"
        } zurückerstatten?\n\nDas Geld geht automatisch zurück, das Ticket wird ungültig. Das lässt sich nicht rückgängig machen.`
      : `${scan.guestName} abweisen und den Gästeliste-Eintrag stornieren?\n\nDas lässt sich nicht rückgängig machen.`;

    if (!confirm(confirmText)) return;

    setRefundingId(scan.ticketId);
    setRefundError(null);
    try {
      const res = await fetch(`/api/tickets/${scan.ticketId}/refund`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setRefundError(data.error ?? "Rückerstattung fehlgeschlagen.");
        return;
      }
      setRecentScans((prev) =>
        prev.map((s) => (s.ticketId === scan.ticketId ? { ...s, refunded: true } : s))
      );
      refreshStats();
    } catch {
      setRefundError("Verbindung fehlgeschlagen — Rückerstattung nicht ausgeführt.");
    } finally {
      setRefundingId(null);
    }
  }

  function scanNext() {
    if (autoResumeTimerRef.current) {
      clearTimeout(autoResumeTimerRef.current);
      autoResumeTimerRef.current = null;
    }
    setResult(null);
    setActive(true);
  }

  // Nach jedem Scan automatisch weiterscannen, statt zwingend auf einen Tap
  // auf "Weiter scannen" zu warten — an der Tür müssen viele Gäste schnell
  // hintereinander eingelassen werden. Das Kamerabild bleibt dabei die ganze
  // Zeit live (siehe Scanner.tsx), es "hängt" also nichts.
  useEffect(() => {
    if (!result) return;
    autoResumeTimerRef.current = setTimeout(() => {
      scanNext();
    }, 4000);
    return () => {
      if (autoResumeTimerRef.current) {
        clearTimeout(autoResumeTimerRef.current);
        autoResumeTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <div>
        <h1 className="text-display mb-1 text-3xl uppercase text-paper">Einlass-Scanner</h1>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest">
          <span
            className={`inline-flex h-2 w-2 rounded-full ${isOnline ? "bg-green-400" : "bg-yellow-400"}`}
          />
          <span className={isOnline ? "text-green-400" : "text-yellow-400"}>
            {isOnline ? "Online" : "Offline-Modus"}
          </span>
        </div>
      </div>

      {events.length > 1 && (
        <div>
          <label className="label-field">Event</label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="input-field"
          >
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} {e.status === "PUBLISHED" ? "" : "(Entwurf)"}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Live-Statusanzeige */}
      {displayStats && (
        <div className="rounded-2xl card-border p-5">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-display text-3xl text-paper">
                {displayStats.checkedIn}
                <span className="text-lg text-paper/40"> / {displayStats.total}</span>
              </p>
              <p className="text-xs uppercase tracking-widest text-paper/40">eingecheckt</p>
            </div>
            {!isOnline && (
              <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-yellow-400">
                Lokaler Stand
              </span>
            )}
          </div>
          <div className="mb-4 h-2 overflow-hidden rounded-full bg-paper/10">
            <div
              className="h-full rounded-full bg-soul-orange transition-all"
              style={{
                width: `${displayStats.total > 0 ? Math.min(100, (displayStats.checkedIn / displayStats.total) * 100) : 0}%`
              }}
            />
          </div>
          {displayStats.byTier.length > 0 && (
            <div className="flex flex-col gap-1.5 border-t border-paper/10 pt-3">
              {displayStats.byTier.map((tier) => (
                <div key={tier.label} className="flex items-center justify-between text-sm">
                  <span className="text-paper/70">{tier.label}</span>
                  <span className="font-semibold text-paper">
                    {tier.checkedIn} / {tier.total}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Offline-Vorbereitung */}
      <div className="rounded-2xl card-border p-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-paper/60">
          Offline-Scan vorbereiten
        </p>
        {offlineDataset ? (
          <p className="mb-3 text-xs text-paper/40">
            {offlineDataset.tickets.length} Tickets geladen · Stand{" "}
            {formatEventTime(offlineDataset.fetchedAt)} Uhr
          </p>
        ) : (
          <p className="mb-3 text-xs text-paper/40">
            Noch keine Offline-Daten geladen. Solange WLAN/Netz vorhanden ist, hier laden — danach
            funktioniert der Scanner auch ohne Internet.
          </p>
        )}
        <button
          type="button"
          onClick={loadOfflineData}
          disabled={loadingOffline || !isOnline || !selectedEventId}
          className="btn-outline w-full"
        >
          {loadingOffline ? "Lädt …" : "Für Offline-Scan laden"}
        </button>
        {!isOnline && (
          <p className="mt-2 text-[11px] text-paper/40">Zum Laden wird eine Verbindung benötigt.</p>
        )}
        {offlineLoadError && <p className="mt-2 text-xs text-red-400">{offlineLoadError}</p>}

        {queue.length > 0 && (
          <div className="mt-4 border-t border-paper/10 pt-3">
            <p className="mb-2 text-xs text-yellow-400">
              {queue.length} Scan{queue.length === 1 ? "" : "s"} warten auf Synchronisierung.
            </p>
            <button
              type="button"
              onClick={syncQueue}
              disabled={syncing || !isOnline}
              className="btn-outline w-full"
            >
              {syncing ? "Synchronisiert …" : "Jetzt synchronisieren"}
            </button>
          </div>
        )}
        {syncMessage && <p className="mt-2 text-xs text-paper/50">{syncMessage}</p>}
      </div>

      <Scanner active={active} onScan={handleScan} />

      {result && (
        <div
          role="status"
          aria-live="assertive"
          className={`rounded-2xl border p-6 text-center ${RESULT_STYLE[result.result]}`}
        >
          <p className="text-display text-xl uppercase">{RESULT_TITLE[result.result]}</p>
          {result.guestName && <p className="mt-2 text-paper">{result.guestName}</p>}
          {result.tierLabel && (
            <p className="text-xs uppercase tracking-widest text-paper/50">{result.tierLabel}</p>
          )}
          {result.eventTitle && <p className="text-sm text-paper/60">{result.eventTitle}</p>}

          {/* Ticket-Typ wird automatisch erkannt (online bezahlt vs. Gästeliste)
              — bei Gästeliste mit Staffelpreis zusätzlich der an der Tür fällige
              Betrag, prominent für schnelles Kassieren. */}
          {result.ticketType && (
            <div className="mt-3 flex flex-col items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                  result.ticketType === "PAID_ONLINE"
                    ? "bg-green-500/15 text-green-400"
                    : "bg-paper/10 text-paper/70"
                }`}
              >
                {result.ticketType === "PAID_ONLINE" ? "Ticket · online bezahlt" : "Gästeliste"}
              </span>
              {result.ticketType === "GUESTLIST" &&
                (result.amountCents ? (
                  <div className="rounded-xl border border-soul-orange/40 bg-soul-orange/10 px-4 py-2">
                    <p className="text-[10px] uppercase tracking-widest text-soul-orange/80">
                      Zu zahlen an der Tür
                    </p>
                    <p className="text-display text-lg text-soul-orange">
                      {formatPrice(result.amountCents, result.currency ?? "eur")}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-paper/40">Kostenlos</p>
                ))}
            </div>
          )}

          <p className="mt-3 text-sm opacity-80">{result.message}</p>
          <button onClick={scanNext} className="btn-primary mt-5 w-full sm:w-auto">
            Weiter scannen
          </button>
          <p className="mt-3 text-[11px] text-paper/40">Scannt in wenigen Sekunden automatisch weiter …</p>
        </div>
      )}

      {/* Letzte Scans — hierüber kann ein Gast, der doch abgewiesen wird, in
          Ruhe erstattet werden, auch wenn die Ergebnisanzeige oben schon
          weitergesprungen ist. */}
      {recentScans.length > 0 && (
        <div className="rounded-2xl card-border p-4">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-paper/40">
            Letzte Scans
          </p>

          {refundError && (
            <p role="alert" className="mb-3 text-xs text-red-400">
              {refundError}
            </p>
          )}

          <ul className="flex flex-col divide-y divide-paper/10">
            {recentScans.map((scan) => (
              <li
                key={scan.ticketId}
                className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-paper">{scan.guestName}</p>
                  <p className="text-[11px] text-paper/40">
                    {scan.ticketType === "PAID_ONLINE"
                      ? `Online bezahlt${
                          scan.amountCents
                            ? " · " + formatPrice(scan.amountCents, scan.currency ?? "eur")
                            : ""
                        }`
                      : "Gästeliste"}
                  </p>
                </div>

                {scan.refunded ? (
                  <span className="shrink-0 text-[11px] font-semibold uppercase tracking-widest text-red-400">
                    {scan.ticketType === "PAID_ONLINE" ? "Erstattet ✓" : "Storniert ✓"}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => refundTicket(scan)}
                    disabled={!isOnline || refundingId === scan.ticketId}
                    className="shrink-0 rounded-full border border-red-500/40 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-red-400 hover:bg-red-500/10 disabled:opacity-30"
                  >
                    {refundingId === scan.ticketId
                      ? "…"
                      : scan.ticketType === "PAID_ONLINE"
                        ? "Abweisen & Geld zurück"
                        : "Abweisen"}
                  </button>
                )}
              </li>
            ))}
          </ul>

          {!isOnline && (
            <p className="mt-3 text-[11px] text-paper/40">
              Rückerstattung braucht Internet — offline nicht möglich.
            </p>
          )}
        </div>
      )}

      {!result && (
        <p className="text-center text-xs uppercase tracking-widest text-paper/40">
          QR-Code des Gastes vor die Kamera halten
        </p>
      )}
    </div>
  );
}
