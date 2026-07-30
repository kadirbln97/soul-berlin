"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";

type GuestlistTierInitial = {
  untilTime: string;
  priceCents: number;
};

type EventInitial = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string;
  venue: string;
  address: string | null;
  imageUrl: string | null;
  dateStart: string;
  dateEnd: string | null;
  ticketMode: string;
  priceCents: number | null;
  capacity: number | null;
  status: string;
  guestlistTiers?: GuestlistTierInitial[];
};

type TierRow = {
  untilTime: string; // datetime-local Format
  priceEuro: string;
};

const MAX_TIERS = 3;

function toLocalInputValue(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export function EventForm({ initial }: { initial?: EventInitial }) {
  const router = useRouter();
  const isEdit = Boolean(initial);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [venue, setVenue] = useState(initial?.venue ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dateStart, setDateStart] = useState(toLocalInputValue(initial?.dateStart));
  const [dateEnd, setDateEnd] = useState(toLocalInputValue(initial?.dateEnd));
  const [ticketMode, setTicketMode] = useState(initial?.ticketMode ?? "GUESTLIST");
  const [priceEuro, setPriceEuro] = useState(
    initial?.priceCents ? (initial.priceCents / 100).toString() : ""
  );
  const [capacity, setCapacity] = useState(initial?.capacity ? String(initial.capacity) : "");
  const [status, setStatus] = useState(initial?.status ?? "DRAFT");

  const [tiers, setTiers] = useState<TierRow[]>(
    (initial?.guestlistTiers ?? []).map((t) => ({
      untilTime: toLocalInputValue(t.untilTime),
      priceEuro: (t.priceCents / 100).toString()
    }))
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error ?? "Upload fehlgeschlagen.");
        setUploading(false);
        return;
      }
      setImageUrl(data.url);
    } catch {
      setUploadError("Verbindung fehlgeschlagen.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function addTier() {
    if (tiers.length >= MAX_TIERS) return;
    setTiers([...tiers, { untilTime: "", priceEuro: "" }]);
  }

  function removeTier(index: number) {
    setTiers(tiers.filter((_, i) => i !== index));
  }

  function updateTier(index: number, field: keyof TierRow, value: string) {
    setTiers(tiers.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const tiersPayload = tiers
      .filter((t) => t.untilTime && t.priceEuro !== "")
      .map((t) => ({
        untilTime: new Date(t.untilTime).toISOString(),
        priceCents: Math.round(parseFloat(t.priceEuro) * 100)
      }));

    if (ticketMode === "GUESTLIST" && tiers.length > 0 && tiersPayload.length !== tiers.length) {
      setError("Bitte bei jeder Preisstaffel Uhrzeit und Preis ausfüllen (oder die Zeile entfernen).");
      return;
    }

    setLoading(true);

    const payload = {
      title,
      subtitle,
      description,
      venue,
      address,
      imageUrl,
      dateStart: dateStart ? new Date(dateStart).toISOString() : "",
      dateEnd: dateEnd ? new Date(dateEnd).toISOString() : "",
      ticketMode,
      priceCents: priceEuro ? Math.round(parseFloat(priceEuro) * 100) : undefined,
      capacity: capacity ? parseInt(capacity, 10) : undefined,
      status,
      guestlistTiers: ticketMode === "GUESTLIST" ? tiersPayload : []
    };

    try {
      const res = await fetch(
        isEdit ? `/api/admin/events/${initial!.id}` : "/api/admin/events",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Speichern fehlgeschlagen.");
        setLoading(false);
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Verbindung fehlgeschlagen.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label-field">Titel</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field"
            placeholder="z.B. SØUL ROOFTOP EDITION"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label-field">Untertitel (optional)</label>
          <input
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className="input-field"
            placeholder="z.B. House Music Sunset Session"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label-field">Beschreibung</label>
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="input-field"
            placeholder="Line-up, Dresscode, Ablauf …"
          />
        </div>
        <div>
          <label className="label-field">Venue</label>
          <input
            required
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            className="input-field"
            placeholder="z.B. THE DOOR Boutique Club"
          />
        </div>
        <div>
          <label className="label-field">Adresse (optional)</label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="input-field"
            placeholder="Straße, PLZ Stadt"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label-field">Event-Bild (optional)</label>
          <div className="flex items-start gap-4">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-paper/15 bg-neutral-900">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt="Vorschau" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[10px] uppercase text-paper/30">
                  Kein Bild
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileChange}
                disabled={uploading}
                className="text-sm text-paper/70 file:mr-3 file:rounded-full file:border-0 file:bg-soul-orange file:px-4 file:py-2 file:text-xs file:font-bold file:uppercase file:tracking-widest file:text-ink hover:file:opacity-90"
              />
              {uploading && <p className="text-xs text-paper/50">Lädt hoch …</p>}
              {uploadError && (
                <p role="alert" className="text-xs text-red-400">
                  {uploadError}
                </p>
              )}
              {imageUrl && !uploading && (
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="self-start text-[11px] uppercase tracking-widest text-paper/40 hover:text-red-400"
                >
                  Bild entfernen
                </button>
              )}
            </div>
          </div>
        </div>
        <div>
          <label className="label-field">Start (Datum & Uhrzeit)</label>
          <input
            required
            type="datetime-local"
            value={dateStart}
            onChange={(e) => setDateStart(e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label className="label-field">Ende (optional)</label>
          <input
            type="datetime-local"
            value={dateEnd}
            onChange={(e) => setDateEnd(e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label className="label-field">Ticket-Modus</label>
          <select
            value={ticketMode}
            onChange={(e) => setTicketMode(e.target.value)}
            className="input-field"
          >
            <option value="GUESTLIST">Gästeliste</option>
            <option value="PAID">Bezahlte Tickets (Stripe)</option>
          </select>
        </div>
        {ticketMode === "PAID" && (
          <div>
            <label className="label-field">Preis (€)</label>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={priceEuro}
              onChange={(e) => setPriceEuro(e.target.value)}
              className="input-field"
              placeholder="15.00"
            />
          </div>
        )}
        <div>
          <label className="label-field">Kapazität (optional)</label>
          <input
            type="number"
            min="1"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            className="input-field"
            placeholder="unbegrenzt, wenn leer"
          />
        </div>
        <div>
          <label className="label-field">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="input-field"
          >
            <option value="DRAFT">Entwurf (nicht sichtbar)</option>
            <option value="PUBLISHED">Veröffentlicht</option>
          </select>
        </div>

        {ticketMode === "GUESTLIST" && (
          <div className="sm:col-span-2 rounded-xl border border-paper/10 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <label className="label-field mb-0">Preisstaffeln (optional, max. 3)</label>
                <p className="text-xs text-paper/40">
                  Ohne Staffeln bleibt die Gästeliste kostenlos. Mit Staffeln zeigst du z.B.
                  "bis 23:00 Uhr 5 €, danach 10 €" — bezahlt wird an der Abendkasse, nicht online.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {tiers.map((tier, i) => (
                <div key={i} className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="label-field">Gültig bis</label>
                    <input
                      type="datetime-local"
                      value={tier.untilTime}
                      onChange={(e) => updateTier(i, "untilTime", e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div className="w-32">
                    <label className="label-field">Preis (€)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={tier.priceEuro}
                      onChange={(e) => updateTier(i, "priceEuro", e.target.value)}
                      className="input-field"
                      placeholder="5.00"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeTier(i)}
                    className="mb-1 text-xs font-semibold uppercase tracking-widest text-paper/40 hover:text-red-400"
                  >
                    Entfernen
                  </button>
                </div>
              ))}
            </div>

            {tiers.length < MAX_TIERS && (
              <button
                type="button"
                onClick={addTier}
                className="mt-3 text-xs font-semibold uppercase tracking-widest text-soul-orange hover:underline"
              >
                + Staffel hinzufügen
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      <button type="submit" disabled={loading || uploading} className="btn-primary self-start">
        {loading ? "Speichern …" : isEdit ? "Änderungen speichern" : "Event erstellen"}
      </button>
    </form>
  );
}
