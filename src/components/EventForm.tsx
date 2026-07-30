"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

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
};

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

  const [title, setTitle] = useState(initial?.title ?? "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [venue, setVenue] = useState(initial?.venue ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [dateStart, setDateStart] = useState(toLocalInputValue(initial?.dateStart));
  const [dateEnd, setDateEnd] = useState(toLocalInputValue(initial?.dateEnd));
  const [ticketMode, setTicketMode] = useState(initial?.ticketMode ?? "GUESTLIST");
  const [priceEuro, setPriceEuro] = useState(
    initial?.priceCents ? (initial.priceCents / 100).toString() : ""
  );
  const [capacity, setCapacity] = useState(initial?.capacity ? String(initial.capacity) : "");
  const [status, setStatus] = useState(initial?.status ?? "DRAFT");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
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
      status
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
          <label className="label-field">Bild-URL (optional)</label>
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="input-field"
            placeholder="https://…"
          />
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
            <option value="GUESTLIST">Kostenlose Gästeliste</option>
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
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary self-start">
        {loading ? "Speichern …" : isEdit ? "Änderungen speichern" : "Event erstellen"}
      </button>
    </form>
  );
}
