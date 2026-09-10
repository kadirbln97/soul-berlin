"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { TablePlanEditor } from "./TablePlanEditor";
import { sortTablesById } from "@/lib/tablePlan";

/** Anderes Event, dessen Tischplan übernommen werden kann. */
export type TablePlanSource = {
  id: string;
  title: string;
  /** Vorformatiertes Datum, z.B. "Fr, 12.09.2026". */
  dateLabel: string;
};

type TablePlanTableInitial = {
  id: string;
  capacity: number;
  minSpendCents: number;
  x: number;
  y: number;
  w: number;
  h: number;
  isReserved?: boolean;
};

type TablePlanInitial = {
  imageUrl: string;
  whatsappNumber: string;
  tables: TablePlanTableInitial[];
};

type GuestlistTierInitial = {
  untilTime: string;
  priceCents: number;
  label?: string | null;
};

type TicketPhaseInitial = {
  id: string;
  label: string;
  priceCents: number;
  quantity: number | null;
  untilTime: string | null;
  isSoldOut: boolean;
  /** Schon verkaufte Tickets dieser Phase — reine Anzeige im Admin. */
  soldCount?: number;
};

type EventInitial = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string;
  venue: string;
  address: string | null;
  titleEn: string | null;
  subtitleEn: string | null;
  descriptionEn: string | null;
  imageUrl: string | null;
  imageIsAi?: boolean;
  dateStart: string;
  dateEnd: string | null;
  ticketMode: string;
  priceCents: number | null;
  capacity: number | null;
  guestlistCapacity?: number | null;
  ticketSalesEndAt: string | null;
  externalTicketUrl?: string | null;
  externalTicketLabel?: string | null;
  status: string;
  guestlistTiers?: GuestlistTierInitial[];
  ticketPhases?: TicketPhaseInitial[];
  tablePlan?: TablePlanInitial | null;
};

type TierRow = {
  untilTime: string; // datetime-local Format
  priceEuro: string;
  label: string;
};

type TableRow = {
  id: string;
  capacity: string;
  minSpendEuro: string;
  /** Geometrie in Prozent vom Bild — wird nur noch im Zeichen-Editor gesetzt. */
  x: number;
  y: number;
  w: number;
  h: number;
  isReserved: boolean;
};

type TableGeometry = Pick<TableRow, "x" | "y" | "w" | "h">;

/** Nächste freie Tischnummer — kleinste Zahl, die noch nicht vergeben ist. */
function nextTableId(tables: TableRow[]) {
  const used = new Set(tables.map((t) => t.id.trim()));
  let n = 1;
  while (used.has(String(n))) n++;
  return String(n);
}

type PhaseRow = {
  /** Leer bei neu angelegten Phasen — bestehende behalten ihre Id. */
  id: string | null;
  label: string;
  priceEuro: string;
  quantity: string;
  untilTime: string; // datetime-local Format
  isSoldOut: boolean;
  soldCount: number;
};

const MAX_TIERS = 3;
const MAX_PHASES = 5;
const MAX_TABLES = 60;

function toLocalInputValue(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export function EventForm({
  initial,
  tablePlanSources = []
}: {
  initial?: EventInitial;
  tablePlanSources?: TablePlanSource[];
}) {
  const router = useRouter();
  const isEdit = Boolean(initial);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tablePlanFileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [titleEn, setTitleEn] = useState(initial?.titleEn ?? "");
  const [subtitleEn, setSubtitleEn] = useState(initial?.subtitleEn ?? "");
  const [descriptionEn, setDescriptionEn] = useState(initial?.descriptionEn ?? "");
  const [venue, setVenue] = useState(initial?.venue ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [imageIsAi, setImageIsAi] = useState(initial?.imageIsAi ?? false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dateStart, setDateStart] = useState(toLocalInputValue(initial?.dateStart));
  const [dateEnd, setDateEnd] = useState(toLocalInputValue(initial?.dateEnd));
  const [ticketMode, setTicketMode] = useState(initial?.ticketMode ?? "GUESTLIST");
  const [priceEuro, setPriceEuro] = useState(
    initial?.priceCents ? (initial.priceCents / 100).toString() : ""
  );
  const [capacity, setCapacity] = useState(initial?.capacity ? String(initial.capacity) : "");
  const [guestlistCapacity, setGuestlistCapacity] = useState(
    initial?.guestlistCapacity ? String(initial.guestlistCapacity) : ""
  );
  const [salesEndAt, setSalesEndAt] = useState(toLocalInputValue(initial?.ticketSalesEndAt));
  const [externalUrl, setExternalUrl] = useState(initial?.externalTicketUrl ?? "");
  const [externalLabel, setExternalLabel] = useState(initial?.externalTicketLabel ?? "");
  const [status, setStatus] = useState(initial?.status ?? "DRAFT");

  const [tiers, setTiers] = useState<TierRow[]>(
    (initial?.guestlistTiers ?? []).map((t) => ({
      untilTime: toLocalInputValue(t.untilTime),
      priceEuro: (t.priceCents / 100).toString(),
      label: t.label ?? ""
    }))
  );

  const [phases, setPhases] = useState<PhaseRow[]>(
    (initial?.ticketPhases ?? []).map((p) => ({
      id: p.id,
      label: p.label,
      priceEuro: (p.priceCents / 100).toString(),
      quantity: p.quantity !== null ? String(p.quantity) : "",
      untilTime: toLocalInputValue(p.untilTime),
      isSoldOut: p.isSoldOut,
      soldCount: p.soldCount ?? 0
    }))
  );

  const [tablePlanEnabled, setTablePlanEnabled] = useState(Boolean(initial?.tablePlan));
  const [tablePlanImageUrl, setTablePlanImageUrl] = useState(initial?.tablePlan?.imageUrl ?? "");
  const [tablePlanUploading, setTablePlanUploading] = useState(false);
  const [tablePlanUploadError, setTablePlanUploadError] = useState<string | null>(null);
  const [tablePlanWhatsapp, setTablePlanWhatsapp] = useState(
    initial?.tablePlan?.whatsappNumber ?? "4915772524610"
  );
  const [tables, setTables] = useState<TableRow[]>(
    sortTablesById(initial?.tablePlan?.tables ?? []).map((t) => ({
      id: t.id,
      capacity: String(t.capacity),
      minSpendEuro: (t.minSpendCents / 100).toString(),
      x: t.x,
      y: t.y,
      w: t.w,
      h: t.h,
      isReserved: t.isReserved ?? false
    }))
  );
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [tablePlanSourceId, setTablePlanSourceId] = useState("");
  const [tablePlanBusy, setTablePlanBusy] = useState<"copy" | "detect" | null>(null);
  const [tablePlanNotice, setTablePlanNotice] = useState<string | null>(null);
  const [tablePlanNoticeIsError, setTablePlanNoticeIsError] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadError(
        `Datei zu groß (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximal 10 MB erlaubt.`
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

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

  async function handleTablePlanFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setTablePlanUploadError(null);

    if (file.size > MAX_UPLOAD_BYTES) {
      setTablePlanUploadError(
        `Datei zu groß (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximal 10 MB erlaubt.`
      );
      if (tablePlanFileInputRef.current) tablePlanFileInputRef.current.value = "";
      return;
    }

    setTablePlanUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setTablePlanUploadError(data.error ?? "Upload fehlgeschlagen.");
        setTablePlanUploading(false);
        return;
      }
      setTablePlanImageUrl(data.url);
    } catch {
      setTablePlanUploadError("Verbindung fehlgeschlagen.");
    } finally {
      setTablePlanUploading(false);
      if (tablePlanFileInputRef.current) tablePlanFileInputRef.current.value = "";
    }
  }

  /** Neuer Tisch — Personen und Mindestverzehr wie beim zuletzt angelegten. */
  function createTable(geometry: TableGeometry): number {
    if (tables.length >= MAX_TABLES) return tables.length - 1;
    const last = tables[tables.length - 1];
    const next: TableRow = {
      id: nextTableId(tables),
      capacity: last?.capacity || "4",
      minSpendEuro: last?.minSpendEuro || "300",
      ...geometry,
      isReserved: false
    };
    setTables([...tables, next]);
    return tables.length;
  }

  function addTableRow() {
    // Ohne Zeichnen: Kasten leicht versetzt zum letzten, damit neue Tische
    // nicht alle exakt übereinander liegen.
    const last = tables[tables.length - 1];
    const x = last ? Math.min(85, last.x + 4) : 40;
    const y = last ? Math.min(90, last.y + 4) : 40;
    const index = createTable({ x, y, w: last?.w ?? 12, h: last?.h ?? 8 });
    setSelectedTable(index);
  }

  function removeTableRow(index: number) {
    setTables(tables.filter((_, i) => i !== index));
    setSelectedTable(null);
  }

  function updateTableRow<K extends keyof TableRow>(index: number, field: K, value: TableRow[K]) {
    setTables(tables.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
  }

  function updateTableGeometry(index: number, geometry: TableGeometry) {
    setTables(tables.map((t, i) => (i === index ? { ...t, ...geometry } : t)));
  }

  function showTablePlanNotice(message: string, isError = false) {
    setTablePlanNotice(message);
    setTablePlanNoticeIsError(isError);
  }

  /** Tischplan eines anderen Events übernehmen — „vergeben“ wird zurückgesetzt. */
  async function copyTablePlanFrom(sourceId: string) {
    setTablePlanSourceId(sourceId);
    if (!sourceId) return;
    if (
      tables.length > 0 &&
      !window.confirm("Die vorhandenen Tische werden durch den übernommenen Plan ersetzt. Weiter?")
    ) {
      setTablePlanSourceId("");
      return;
    }
    setTablePlanBusy("copy");
    setTablePlanNotice(null);
    try {
      const res = await fetch(`/api/admin/events/${sourceId}/table-plan`);
      const data = await res.json();
      if (!res.ok) {
        showTablePlanNotice(data.error ?? "Übernahme fehlgeschlagen.", true);
        return;
      }
      const plan = data.tablePlan as TablePlanInitial;
      setTablePlanImageUrl(plan.imageUrl);
      setTablePlanWhatsapp(plan.whatsappNumber);
      setTables(
        sortTablesById(plan.tables).map((t) => ({
          id: t.id,
          capacity: String(t.capacity),
          minSpendEuro: (t.minSpendCents / 100).toString(),
          x: t.x,
          y: t.y,
          w: t.w,
          h: t.h,
          isReserved: false
        }))
      );
      setSelectedTable(null);
      showTablePlanNotice(
        `${plan.tables.length} Tische übernommen — alle als frei markiert. Erst nach „Änderungen speichern“ wirksam.`
      );
    } catch {
      showTablePlanNotice("Verbindung fehlgeschlagen.", true);
    } finally {
      setTablePlanBusy(null);
      setTablePlanSourceId("");
    }
  }

  /** Tische per Bildverständnis-Modell erkennen lassen; Ergebnis ist ein Vorschlag. */
  async function detectTables() {
    if (!tablePlanImageUrl) return;
    if (
      tables.length > 0 &&
      !window.confirm("Die vorhandenen Tische werden durch die erkannten ersetzt. Weiter?")
    ) {
      return;
    }
    setTablePlanBusy("detect");
    setTablePlanNotice(null);
    try {
      const res = await fetch("/api/admin/table-plan/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: tablePlanImageUrl })
      });
      const data = await res.json();
      if (!res.ok) {
        showTablePlanNotice(data.error ?? "Erkennung fehlgeschlagen.", true);
        return;
      }
      const detected = data.tables as Array<{
        id: string;
        capacity: number | null;
        x: number;
        y: number;
        w: number;
        h: number;
      }>;
      const last = tables[tables.length - 1];
      setTables(
        sortTablesById(detected).slice(0, MAX_TABLES).map((t) => ({
          id: t.id,
          capacity: t.capacity ? String(t.capacity) : last?.capacity || "4",
          minSpendEuro: last?.minSpendEuro || "300",
          x: t.x,
          y: t.y,
          w: t.w,
          h: t.h,
          isReserved: false
        }))
      );
      setSelectedTable(null);
      showTablePlanNotice(
        `${detected.length} Tische erkannt. Bitte Kästen und Nummern prüfen — die Erkennung ist ein Vorschlag, Personen und Mindestverzehr musst du selbst eintragen.`
      );
    } catch {
      showTablePlanNotice("Verbindung fehlgeschlagen.", true);
    } finally {
      setTablePlanBusy(null);
    }
  }

  function addTier() {
    if (tiers.length >= MAX_TIERS) return;
    setTiers([...tiers, { untilTime: "", priceEuro: "", label: "" }]);
  }

  function removeTier(index: number) {
    setTiers(tiers.filter((_, i) => i !== index));
  }

  function updateTier(index: number, field: keyof TierRow, value: string) {
    setTiers(tiers.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
  }

  function addPhase() {
    if (phases.length >= MAX_PHASES) return;
    setPhases([
      ...phases,
      {
        id: null,
        label: `Phase ${phases.length + 1}`,
        priceEuro: "",
        quantity: "",
        untilTime: "",
        isSoldOut: false,
        soldCount: 0
      }
    ]);
  }

  function removePhase(index: number) {
    const phase = phases[index];
    // Warnen statt stillschweigend löschen: an einer Phase mit Verkäufen
    // hängen echte Tickets. Die bleiben zwar bestehen, zählen danach aber
    // keinem Kontingent mehr zu.
    if (
      phase.soldCount > 0 &&
      !window.confirm(
        `In der Phase „${phase.label}“ sind bereits ${phase.soldCount} Tickets verkauft.\n\nDie Tickets bleiben gültig, verlieren aber ihre Zuordnung zu dieser Phase. Trotzdem entfernen?`
      )
    ) {
      return;
    }
    setPhases(phases.filter((_, i) => i !== index));
  }

  function updatePhase<K extends keyof PhaseRow>(index: number, field: K, value: PhaseRow[K]) {
    setPhases(phases.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const tiersPayload = tiers
      .filter((t) => t.untilTime && t.priceEuro !== "")
      .map((t) => ({
        untilTime: new Date(t.untilTime).toISOString(),
        priceCents: Math.round(parseFloat(t.priceEuro) * 100),
        label: t.label.trim() || null
      }));

    const usesGuestlist = ticketMode === "GUESTLIST" || ticketMode === "BOTH";
    const usesTickets = ticketMode === "PAID" || ticketMode === "BOTH";

    if (usesGuestlist && tiers.length > 0 && tiersPayload.length !== tiers.length) {
      setError("Bitte bei jeder Preisstaffel Uhrzeit und Preis ausfüllen (oder die Zeile entfernen).");
      return;
    }

    if (ticketMode === "EXTERNAL" && !externalUrl.trim()) {
      setError(
        "Bei „Nur externer Anbieter“ muss ein Link zum Ticketshop angegeben werden — sonst hätte die Event-Seite keine Kaufmöglichkeit."
      );
      return;
    }

    if (externalUrl.trim() && !/^https?:\/\//i.test(externalUrl.trim())) {
      setError("Der Link zum Ticketshop muss mit https:// beginnen.");
      return;
    }

    if (usesTickets && phases.some((p) => !p.label.trim() || p.priceEuro === "")) {
      setError("Bitte bei jeder Ticketphase einen Namen und einen Preis angeben (oder die Zeile entfernen).");
      return;
    }

    const phasesPayload = phases.map((p) => ({
      id: p.id,
      label: p.label.trim(),
      priceCents: Math.round(parseFloat(p.priceEuro) * 100),
      quantity: p.quantity ? parseInt(p.quantity, 10) : null,
      untilTime: p.untilTime ? new Date(p.untilTime).toISOString() : null,
      isSoldOut: p.isSoldOut
    }));

    if (tablePlanEnabled) {
      if (!tablePlanImageUrl) {
        setError("Bitte für den Tischplan einen Grundriss hochladen (oder den Tischplan deaktivieren).");
        return;
      }
      if (tables.length === 0) {
        setError("Bitte mindestens einen Tisch anlegen (oder den Tischplan deaktivieren).");
        return;
      }
      if (tables.some((t) => !t.id.trim() || t.capacity === "" || t.minSpendEuro === "")) {
        setError(
          "Bitte bei jedem Tisch Nummer, Personen und Mindestverzehr ausfüllen (oder den Tisch entfernen)."
        );
        return;
      }
      const ids = tables.map((t) => t.id.trim());
      const duplicate = ids.find((id, i) => ids.indexOf(id) !== i);
      if (duplicate) {
        setError(`Tischnummer „${duplicate}“ ist doppelt vergeben.`);
        return;
      }
      if (!/^[1-9]\d{6,14}$/.test(tablePlanWhatsapp.trim())) {
        setError(
          "WhatsApp-Nummer bitte als Ländervorwahl + Nummer ohne Plus oder führende Null angeben, z.B. 4915772524610."
        );
        return;
      }
    }

    const tablePlanPayload = tablePlanEnabled
      ? {
          imageUrl: tablePlanImageUrl,
          whatsappNumber: tablePlanWhatsapp.trim(),
          tables: tables.map((t) => ({
            id: t.id.trim(),
            capacity: parseInt(t.capacity, 10),
            minSpendCents: Math.round(parseFloat(t.minSpendEuro) * 100),
            x: t.x,
            y: t.y,
            w: t.w,
            h: t.h,
            isReserved: t.isReserved
          }))
        }
      : null;

    setLoading(true);

    const payload = {
      title,
      subtitle,
      description,
      titleEn,
      subtitleEn,
      descriptionEn,
      venue,
      address,
      imageUrl,
      // Ohne Bild ergibt die KI-Kennzeichnung keinen Sinn — sonst bliebe ein
      // gesetztes Häkchen nach dem Entfernen des Bildes stillschweigend stehen.
      imageIsAi: imageUrl ? imageIsAi : false,
      dateStart: dateStart ? new Date(dateStart).toISOString() : "",
      dateEnd: dateEnd ? new Date(dateEnd).toISOString() : "",
      ticketMode,
      priceCents: priceEuro ? Math.round(parseFloat(priceEuro) * 100) : undefined,
      capacity: capacity ? parseInt(capacity, 10) : undefined,
      guestlistCapacity: guestlistCapacity ? parseInt(guestlistCapacity, 10) : null,
      ticketSalesEndAt: salesEndAt ? new Date(salesEndAt).toISOString() : "",
      status,
      guestlistTiers: usesGuestlist ? tiersPayload : [],
      ticketPhases: usesTickets ? phasesPayload : [],
      externalTicketUrl: externalUrl.trim(),
      externalTicketLabel: externalLabel.trim(),
      tablePlan: tablePlanPayload
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
      {/* minmax(0,1fr) statt der Standard-Spalte: eine auto-Spalte darf auf die
          Mindestbreite ihres Inhalts wachsen und sprengt dann die Karte. Genau
          das passiert auf dem iPhone bei datetime-local-Feldern, die von Safari
          eine feste Mindestbreite bekommen. Mit minmax(0,1fr) ist die Spalte
          nach oben durch den Container begrenzt — das Feld muss sich fügen. */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 [&>*]:min-w-0 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label-field" htmlFor="ev-titel">Titel</label>
          <input
            id="ev-titel"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field"
            placeholder="z.B. SØUL ROOFTOP EDITION"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label-field" htmlFor="ev-untertitel">Untertitel (optional)</label>
          <input
            id="ev-untertitel"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className="input-field"
            placeholder="z.B. House Music Sunset Session"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label-field" htmlFor="ev-beschreibung">Beschreibung</label>
          <textarea
            id="ev-beschreibung"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="input-field"
            placeholder="Line-up, Dresscode, Ablauf …"
          />
        </div>
        {/* Englische Fassung — optional. Bleibt ein Feld leer, sieht der
            englischsprachige Gast den deutschen Text. */}
        <div className="sm:col-span-2 rounded-xl border border-paper/10 p-4">
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-soul-orange">
            English version (optional)
          </p>
          <p className="mb-4 text-xs text-paper/40">
            Leer lassen ist okay — dann wird auf der englischen Seite der deutsche Text
            angezeigt.
          </p>
          <div className="flex flex-col gap-4">
            <div>
              <label className="label-field" htmlFor="ev-title">Title (EN)</label>
              <input
                id="ev-title"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                className="input-field"
                placeholder={title || "e.g. SØUL ROOFTOP EDITION"}
              />
            </div>
            <div>
              <label className="label-field" htmlFor="ev-subtitle">Subtitle (EN)</label>
              <input
                id="ev-subtitle"
                value={subtitleEn}
                onChange={(e) => setSubtitleEn(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-field" htmlFor="ev-description">Description (EN)</label>
              <textarea
                id="ev-description"
                value={descriptionEn}
                onChange={(e) => setDescriptionEn(e.target.value)}
                rows={5}
                className="input-field"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="label-field" htmlFor="ev-venue">Venue</label>
          <input
            id="ev-venue"
            required
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            className="input-field"
            placeholder="z.B. THE DOOR Boutique Club"
          />
        </div>
        <div>
          <label className="label-field" htmlFor="ev-adresse">Adresse (optional)</label>
          <input
            id="ev-adresse"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="input-field"
            placeholder="Straße, PLZ Stadt"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label-field">Event-Bild (optional)</label>
          <div className="flex min-w-0 items-start gap-4">
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
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              {/* Das native Dateifeld bleibt unsichtbar, wird aber weiterhin
                  benutzt — es bringt eine feste Eigenbreite mit (Knopf plus
                  „Keine Datei ausgewählt“), die sich nicht kürzen lässt und auf
                  dem Handy aus der Karte herausragt. Der eigene Knopf löst es
                  über die Referenz aus und darf schrumpfen. */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileChange}
                disabled={uploading}
                className="sr-only"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full max-w-[200px] rounded-full bg-soul-orange px-4 py-2 text-xs font-bold uppercase tracking-widest text-ink transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {uploading ? "Lädt hoch …" : imageUrl ? "Bild ersetzen" : "Datei auswählen"}
              </button>
              <p className="text-[11px] text-paper/40">
                Empfohlen: mind. 1200 × 1500 Px (Hochformat, Verhältnis ca. 4:5) — wird auf
                der Seite automatisch zugeschnitten. JPEG, PNG, WebP oder GIF, max. 10 MB.
              </p>
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

          {imageUrl && (
            <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-xl border border-paper/15 bg-white/[0.02] p-3">
              <input
                type="checkbox"
                checked={imageIsAi}
                onChange={(e) => setImageIsAi(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-soul-orange"
              />
              <span>
                <span className="block text-sm text-paper">
                  Dieses Bild wurde mit KI erstellt oder bearbeitet
                </span>
                <span className="mt-0.5 block text-[11px] text-paper/40">
                  Blendet auf der Event-Seite den Hinweis „KI-generiert“ ein. Pflicht nach
                  Art. 50 KI-VO, sobald das Bild echt wirkt — im Zweifel lieber ankreuzen.
                </span>
              </span>
            </label>
          )}
        </div>
        <div>
          <label className="label-field" htmlFor="ev-start">Start (Datum & Uhrzeit)</label>
          <input
            id="ev-start"
            required
            type="datetime-local"
            value={dateStart}
            onChange={(e) => setDateStart(e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label className="label-field" htmlFor="ev-ende">Ende (optional)</label>
          <input
            id="ev-ende"
            type="datetime-local"
            value={dateEnd}
            onChange={(e) => setDateEnd(e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label className="label-field" htmlFor="ev-ticket-modus">Ticket-Modus</label>
          <select
            id="ev-ticket-modus"
            value={ticketMode}
            onChange={(e) => setTicketMode(e.target.value)}
            className="input-field"
          >
            <option value="GUESTLIST">Gästeliste</option>
            <option value="PAID">Bezahlte Tickets (Stripe)</option>
            <option value="BOTH">Beides — Gast wählt (Ticket oder Gästeliste)</option>
            <option value="EXTERNAL">Nur externer Anbieter (z.B. Eventbrite)</option>
          </select>
          {ticketMode === "EXTERNAL" && (
            <p className="mt-1 text-[11px] text-paper/40">
              Weder Gästeliste noch eigener Ticketverkauf — auf der Event-Seite steht
              nur der Knopf zum Anbieter. Link unten ist dann Pflicht.
            </p>
          )}
        </div>
        {(ticketMode === "PAID" || ticketMode === "BOTH") && (
          <div>
            <label className="label-field" htmlFor="ev-preis-ticket">Preis Ticket (€)</label>
            <input
              id="ev-preis-ticket"
              required
              type="number"
              min="0"
              step="0.01"
              value={priceEuro}
              onChange={(e) => setPriceEuro(e.target.value)}
              className="input-field"
              placeholder="15.00"
            />
            {ticketMode === "BOTH" && (
              <p className="mt-1 text-[11px] text-paper/40">
                Gilt nur für den Online-Ticketkauf. Die Gästeliste unten kann einen eigenen
                (niedrigeren oder kostenlosen) Preis haben.
              </p>
            )}
          </div>
        )}
        <div>
          <label className="label-field" htmlFor="ev-gesamtkapazitaet">Gesamtkapazität (optional)</label>
          <input
            id="ev-gesamtkapazitaet"
            type="number"
            min="1"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            className="input-field"
            placeholder="unbegrenzt, wenn leer"
          />
          <p className="mt-1 text-[11px] text-paper/40">
            Obergrenze über alle Wege zusammen — Tickets und Gästeliste.
          </p>
        </div>

        {(ticketMode === "GUESTLIST" || ticketMode === "BOTH") && (
          <div>
            <label className="label-field" htmlFor="ev-plaetze-auf-der-gaesteliste">Plätze auf der Gästeliste (optional)</label>
            <input
              id="ev-plaetze-auf-der-gaesteliste"
              type="number"
              min="1"
              value={guestlistCapacity}
              onChange={(e) => setGuestlistCapacity(e.target.value)}
              className="input-field"
              placeholder="unbegrenzt, wenn leer"
            />
            <p className="mt-1 text-[11px] text-paper/40">
              Eigenes Kontingent nur für Gästelisten-Eintragungen. Ist es voll, schließt
              die Gästeliste automatisch — der Ticketverkauf läuft davon unberührt weiter.
              Begleitpersonen („+2“) zählen mit.
            </p>
          </div>
        )}
        <div>
          <label className="label-field" htmlFor="ev-status">Status</label>
          <select
            id="ev-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="input-field"
          >
            <option value="DRAFT">Entwurf (nicht sichtbar)</option>
            <option value="PUBLISHED">Veröffentlicht</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label-field" htmlFor="ev-anmelde-verkaufsschluss">Anmelde-/Verkaufsschluss (optional)</label>
          <input
            id="ev-anmelde-verkaufsschluss"
            type="datetime-local"
            value={salesEndAt}
            onChange={(e) => setSalesEndAt(e.target.value)}
            className="input-field sm:max-w-xs"
          />
          <p className="mt-1 text-[11px] text-paper/40">
            Ab diesem Zeitpunkt schließt die Gästeliste bzw. der Ticketverkauf automatisch.
            Gäste sehen bis dahin einen Countdown auf der Event-Seite. Leer lassen für kein Limit.
          </p>
        </div>

        <div className="sm:col-span-2 rounded-xl border border-paper/10 p-4">
          <label className="label-field mb-0">Externer Ticketshop (optional)</label>
          <p className="mt-1 mb-3 text-[11px] text-paper/40">
            Verkauft ihr (auch) über Eventbrite, RA o.Ä.? Dann erscheint auf der
            Event-Seite zusätzlich ein Knopf dorthin — unter dem Formular, klar
            abgesetzt, weil der Klick von unserer Seite wegführt.
          </p>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 [&>*]:min-w-0 sm:grid-cols-[minmax(0,1fr)_200px]">
            <div>
              <label className="label-field text-[10px]" htmlFor="external-url">
                Link zum Ticketshop
              </label>
              <input
                id="external-url"
                type="url"
                inputMode="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                className="input-field"
                placeholder="https://www.eventbrite.de/e/..."
              />
            </div>
            <div>
              <label className="label-field text-[10px]" htmlFor="external-label">
                Name des Anbieters
              </label>
              <input
                id="external-label"
                value={externalLabel}
                onChange={(e) => setExternalLabel(e.target.value)}
                className="input-field"
                placeholder="Eventbrite"
              />
              <p className="mt-1 text-[11px] text-paper/40">
                Ergibt „Tickets bei Eventbrite ↗“. Leer = neutrale Beschriftung.
              </p>
            </div>
          </div>
        </div>

        {(ticketMode === "PAID" || ticketMode === "BOTH") && (
          <div className="sm:col-span-2 rounded-xl border border-paper/10 p-4">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
              <div>
                <label className="label-field mb-0">
                  Ticketphasen (optional, max. {MAX_PHASES})
                </label>
                <p className="mt-1 text-[11px] text-paper/40">
                  Ohne Phasen gilt durchgehend der Ticketpreis oben. Mit Phasen verkaufst du
                  gestaffelt: „Phase 1: 20 Stück à 10 €“, danach automatisch die nächste.
                  Eine Phase endet, sobald das Kontingent voll ist, die Uhrzeit erreicht ist
                  oder du den Schalter „Ausverkauft“ setzt.
                </p>
              </div>
            </div>

            {phases.length > 0 && (
              <div className="flex flex-col gap-3">
                {phases.map((phase, i) => (
                  <div
                    key={phase.id ?? `neu-${i}`}
                    className="grid grid-cols-[minmax(0,1fr)] gap-3 rounded-lg border border-paper/5 p-3 [&>*]:min-w-0 sm:grid-cols-[minmax(0,1.2fr)_100px_100px_minmax(0,1fr)_auto] sm:items-end"
                  >
                    <div>
                      <label className="label-field text-[10px]" htmlFor={`ev-name-der-phase-phase-${i}`}>Name der Phase</label>
                      <input
                        id={`ev-name-der-phase-phase-${i}`}
                        value={phase.label}
                        onChange={(e) => updatePhase(i, "label", e.target.value)}
                        className="input-field"
                        placeholder="Early Bird"
                      />
                    </div>
                    <div>
                      <label className="label-field text-[10px]" htmlFor={`ev-preis-phase-${i}`}>Preis (€)</label>
                      <input
                        id={`ev-preis-phase-${i}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={phase.priceEuro}
                        onChange={(e) => updatePhase(i, "priceEuro", e.target.value)}
                        className="input-field"
                        placeholder="10.00"
                      />
                    </div>
                    <div>
                      <label className="label-field text-[10px]" htmlFor={`ev-stueckzahl-phase-${i}`}>Stückzahl</label>
                      <input
                        id={`ev-stueckzahl-phase-${i}`}
                        type="number"
                        min="1"
                        value={phase.quantity}
                        onChange={(e) => updatePhase(i, "quantity", e.target.value)}
                        className="input-field"
                        placeholder="∞"
                      />
                    </div>
                    <div>
                      <label className="label-field text-[10px]" htmlFor={`ev-endet-am-phase-${i}`}>Endet am (optional)</label>
                      <input
                        id={`ev-endet-am-phase-${i}`}
                        type="datetime-local"
                        value={phase.untilTime}
                        onChange={(e) => updatePhase(i, "untilTime", e.target.value)}
                        className="input-field"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removePhase(i)}
                      className="justify-self-start text-xs uppercase tracking-widest text-paper/40 hover:text-red-400 sm:pb-3"
                    >
                      Entfernen
                    </button>

                    {/* Eigene Zeile: der Schalter ist die Funktion, wegen der
                        die Phasen überhaupt existieren — vorzeitig dichtmachen,
                        ohne auf das Kontingent zu warten. */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:col-span-5">
                      <label className="flex cursor-pointer items-center gap-2 text-xs text-paper/75">
                        <input
                          type="checkbox"
                          checked={phase.isSoldOut}
                          onChange={(e) => updatePhase(i, "isSoldOut", e.target.checked)}
                          className="h-4 w-4 accent-soul-orange"
                        />
                        Ausverkauft (schließt die Phase sofort)
                      </label>
                      <span className="text-[11px] text-paper/40">
                        {phase.soldCount > 0
                          ? `${phase.soldCount} verkauft${
                              phase.quantity ? ` von ${phase.quantity}` : ""
                            }`
                          : "noch nichts verkauft"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {phases.length < MAX_PHASES && (
              <button
                type="button"
                onClick={addPhase}
                className="mt-3 text-xs font-semibold uppercase tracking-widest text-soul-orange hover:opacity-80"
              >
                + Phase hinzufügen
              </button>
            )}
          </div>
        )}

        {(ticketMode === "GUESTLIST" || ticketMode === "BOTH") && (
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

            <div className="flex flex-col gap-4">
              {tiers.map((tier, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[minmax(0,1fr)] gap-3 rounded-lg border border-paper/5 p-3 [&>*]:min-w-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_100px_auto] sm:items-end sm:border-0 sm:p-0"
                >
                  <div>
                    <label className="label-field" htmlFor={`ev-name-tier-${i}`}>Name (optional)</label>
                    <input
                      id={`ev-name-tier-${i}`}
                      value={tier.label}
                      onChange={(e) => updateTier(i, "label", e.target.value)}
                      className="input-field"
                      placeholder="z.B. Early Bird"
                    />
                  </div>
                  <div>
                    <label className="label-field" htmlFor={`ev-gueltig-bis-tier-${i}`}>Gültig bis</label>
                    <input
                      id={`ev-gueltig-bis-tier-${i}`}
                      type="datetime-local"
                      value={tier.untilTime}
                      onChange={(e) => updateTier(i, "untilTime", e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label-field" htmlFor={`ev-preis-tier-${i}`}>Preis (€)</label>
                    <input
                      id={`ev-preis-tier-${i}`}
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
                    className="justify-self-start text-xs font-semibold uppercase tracking-widest text-paper/40 hover:text-red-400 sm:mb-1 sm:justify-self-auto"
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

        <div className="sm:col-span-2 rounded-xl border border-paper/10 p-4">
          <label className="mb-1 flex cursor-pointer items-start gap-2">
            <input
              type="checkbox"
              checked={tablePlanEnabled}
              onChange={(e) => setTablePlanEnabled(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-soul-orange"
            />
            <span>
              <span className="block text-sm font-semibold text-paper">
                Tischplan mit WhatsApp-Reservierung
              </span>
              <span className="mt-0.5 block text-[11px] text-paper/40">
                Grundriss hochladen, klickbare Tische mit Kapazität & Mindestverzehr anlegen.
                Ein Klick auf „Jetzt reservieren“ öffnet WhatsApp mit einer vorausgefüllten
                Nachricht an die unten hinterlegte Nummer.
              </span>
            </span>
          </label>

          {tablePlanEnabled && (
            <div className="mt-4 flex flex-col gap-4">
              <div>
                <label className="label-field">Grundriss-Bild</label>
                <div className="flex min-w-0 items-start gap-4">
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-paper/15 bg-neutral-900">
                    {tablePlanImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={tablePlanImageUrl}
                        alt="Vorschau"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] uppercase text-paper/30">
                        Kein Bild
                      </div>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <input
                      ref={tablePlanFileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleTablePlanFileChange}
                      disabled={tablePlanUploading}
                      className="sr-only"
                    />
                    <button
                      type="button"
                      onClick={() => tablePlanFileInputRef.current?.click()}
                      disabled={tablePlanUploading}
                      className="w-full max-w-[200px] rounded-full bg-soul-orange px-4 py-2 text-xs font-bold uppercase tracking-widest text-ink transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {tablePlanUploading
                        ? "Lädt hoch …"
                        : tablePlanImageUrl
                          ? "Bild ersetzen"
                          : "Datei auswählen"}
                    </button>
                    {tablePlanUploadError && (
                      <p role="alert" className="text-xs text-red-400">
                        {tablePlanUploadError}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="sm:max-w-xs">
                <label className="label-field" htmlFor="ev-whatsapp-nummer">WhatsApp-Nummer</label>
                <input
                  id="ev-whatsapp-nummer"
                  value={tablePlanWhatsapp}
                  onChange={(e) => setTablePlanWhatsapp(e.target.value)}
                  className="input-field"
                  placeholder="4915772524610"
                />
                <p className="mt-1 text-[11px] text-paper/40">
                  Ländervorwahl + Nummer, ohne Plus und ohne führende Null.
                </p>
              </div>

              {(tablePlanSources.length > 0 || tablePlanImageUrl) && (
                <div className="flex flex-wrap items-end gap-3">
                  {tablePlanSources.length > 0 && (
                    <div className="min-w-0 flex-1 sm:max-w-xs">
                      <label className="label-field" htmlFor="ev-tischplan-quelle">
                        Tischplan aus anderem Event übernehmen
                      </label>
                      <select
                        id="ev-tischplan-quelle"
                        value={tablePlanSourceId}
                        onChange={(e) => copyTablePlanFrom(e.target.value)}
                        disabled={tablePlanBusy !== null}
                        className="input-field"
                      >
                        <option value="">— Event wählen —</option>
                        {tablePlanSources.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.dateLabel} · {s.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {tablePlanImageUrl && (
                    <button
                      type="button"
                      onClick={detectTables}
                      disabled={tablePlanBusy !== null}
                      className="rounded-full border border-soul-orange/60 px-4 py-2 text-xs font-bold uppercase tracking-widest text-soul-orange transition hover:bg-soul-orange/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {tablePlanBusy === "detect"
                        ? "Erkennt Tische …"
                        : tablePlanBusy === "copy"
                          ? "Übernimmt …"
                          : "Tische automatisch erkennen"}
                    </button>
                  )}
                </div>
              )}
              {tablePlanNotice && (
                <p
                  role={tablePlanNoticeIsError ? "alert" : "status"}
                  className={`text-xs ${tablePlanNoticeIsError ? "text-red-400" : "text-paper/70"}`}
                >
                  {tablePlanNotice}
                </p>
              )}

              {tablePlanImageUrl && (
                <div>
                  <label className="label-field">Tische auf dem Plan einzeichnen</label>
                  <TablePlanEditor
                    imageUrl={tablePlanImageUrl}
                    tables={tables}
                    selectedIndex={selectedTable}
                    onSelect={setSelectedTable}
                    onChange={updateTableGeometry}
                    onCreate={createTable}
                    onDelete={removeTableRow}
                  />
                </div>
              )}

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="label-field mb-0">
                    Tische ({tables.length}/{MAX_TABLES})
                  </label>
                </div>
                <div className="flex flex-col gap-3">
                  {tables.map((t, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedTable(i)}
                      className={`grid grid-cols-[minmax(0,1fr)] gap-2 rounded-lg border p-3 [&>*]:min-w-0 sm:grid-cols-[70px_80px_120px_auto] sm:items-end ${
                        selectedTable === i
                          ? "border-soul-orange/70 bg-soul-orange/[0.06]"
                          : "border-paper/5"
                      }`}
                    >
                      <div>
                        <label className="label-field text-[10px]" htmlFor={`ev-nr-table-${i}`}>Nr.</label>
                        <input
                          id={`ev-nr-table-${i}`}
                          value={t.id}
                          onChange={(e) => updateTableRow(i, "id", e.target.value)}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="label-field text-[10px]" htmlFor={`ev-personen-table-${i}`}>Personen</label>
                        <input
                          id={`ev-personen-table-${i}`}
                          type="number"
                          min="1"
                          value={t.capacity}
                          onChange={(e) => updateTableRow(i, "capacity", e.target.value)}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="label-field text-[10px]" htmlFor={`ev-mindestverzehr-table-${i}`}>Mindestverzehr (€)</label>
                        <input
                          id={`ev-mindestverzehr-table-${i}`}
                          type="number"
                          min="0"
                          step="1"
                          value={t.minSpendEuro}
                          onChange={(e) => updateTableRow(i, "minSpendEuro", e.target.value)}
                          className="input-field"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeTableRow(i);
                        }}
                        className="justify-self-start text-xs uppercase tracking-widest text-paper/40 hover:text-red-400 sm:pb-3"
                      >
                        Entfernen
                      </button>

                      {/* Eigene Zeile, weil der Schalter der Grund ist, warum
                          du hier während der Woche überhaupt reinschaust:
                          vergebene Tische ausknipsen. */}
                      <label className="flex cursor-pointer items-center gap-2 text-xs text-paper/75 sm:col-span-4">
                        <input
                          type="checkbox"
                          checked={t.isReserved}
                          onChange={(e) => updateTableRow(i, "isReserved", e.target.checked)}
                          className="h-4 w-4 accent-soul-orange"
                        />
                        Vergeben — Gäste sehen den Tisch schraffiert und können ihn nicht mehr
                        auswählen
                      </label>
                    </div>
                  ))}
                </div>
                {tables.length < MAX_TABLES && (
                  <button
                    type="button"
                    onClick={addTableRow}
                    className="mt-3 text-xs font-semibold uppercase tracking-widest text-soul-orange hover:underline"
                  >
                    + Tisch hinzufügen
                  </button>
                )}
                <p className="mt-2 text-[11px] text-paper/40">
                  Position und Größe der Klickflächen ziehst du oben direkt auf dem Plan.
                  Ein Klick auf eine Zeile hebt den zugehörigen Tisch im Plan hervor.
                </p>
              </div>
            </div>
          )}
        </div>
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
