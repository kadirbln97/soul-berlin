"use client";

import { useRef, useState } from "react";

type GalleryItem = {
  id: string;
  type: "PHOTO" | "VIDEO";
  url: string;
  posterUrl: string | null;
  label: string | null;
};

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

async function uploadFile(file: File): Promise<{ url?: string; error?: string }> {
  const formData = new FormData();
  formData.append("file", file);
  try {
    const res = await fetch("/api/admin/gallery/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) return { error: data.error ?? "Upload fehlgeschlagen." };
    return { url: data.url };
  } catch {
    return { error: "Verbindung fehlgeschlagen." };
  }
}

export function GalleryManager({ initialItems }: { initialItems: GalleryItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [type, setType] = useState<"PHOTO" | "VIDEO">("PHOTO");
  const [label, setLabel] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const posterInputRef = useRef<HTMLInputElement>(null);

  async function persistOrder(next: GalleryItem[]) {
    setItems(next);
    await fetch("/api/admin/gallery/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: next.map((i) => i.id) })
    }).catch(() => {
      // Bei Netzwerkfehler bleibt die alte Reihenfolge serverseitig bestehen —
      // beim nächsten Laden der Seite wird der tatsächliche Stand wieder sichtbar.
    });
  }

  function moveItem(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const next = [...items];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    persistOrder(next);
  }

  async function deleteItem(id: string) {
    if (!confirm("Diese Kachel wirklich aus der Galerie löschen?")) return;
    setBusyId(id);
    try {
      await fetch(`/api/admin/gallery/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((i) => i.id !== id));
    } finally {
      setBusyId(null);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError(type === "PHOTO" ? "Bitte ein Foto auswählen." : "Bitte ein Video auswählen.");
      return;
    }

    const maxBytes = type === "PHOTO" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
    if (file.size > maxBytes) {
      setError(`Datei zu groß (max. ${Math.round(maxBytes / 1024 / 1024)} MB).`);
      return;
    }

    setUploading(true);

    const uploaded = await uploadFile(file);
    if (uploaded.error || !uploaded.url) {
      setError(uploaded.error ?? "Upload fehlgeschlagen.");
      setUploading(false);
      return;
    }

    let posterUrl: string | undefined;
    const posterFile = posterInputRef.current?.files?.[0];
    if (type === "VIDEO" && posterFile) {
      const posterUploaded = await uploadFile(posterFile);
      if (posterUploaded.error) {
        setError(`Video hochgeladen, aber Vorschaubild fehlgeschlagen: ${posterUploaded.error}`);
        setUploading(false);
        return;
      }
      posterUrl = posterUploaded.url;
    }

    try {
      const res = await fetch("/api/admin/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, url: uploaded.url, posterUrl, label })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Speichern fehlgeschlagen.");
        setUploading(false);
        return;
      }
      setItems((prev) => [
        ...prev,
        { id: data.item.id, type, url: uploaded.url!, posterUrl: posterUrl ?? null, label: label || null }
      ]);
      setLabel("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (posterInputRef.current) posterInputRef.current.value = "";
    } catch {
      setError("Verbindung fehlgeschlagen.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <form
        onSubmit={handleAdd}
        className="flex flex-col gap-4 rounded-2xl card-border p-5 sm:flex-row sm:flex-wrap sm:items-end"
      >
        <div>
          <label className="label-field">Typ</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "PHOTO" | "VIDEO")}
            className="input-field"
          >
            <option value="PHOTO">Foto</option>
            <option value="VIDEO">Video</option>
          </select>
        </div>
        <div>
          <label className="label-field">{type === "PHOTO" ? "Foto-Datei" : "Video-Datei"}</label>
          <input
            ref={fileInputRef}
            type="file"
            accept={type === "PHOTO" ? "image/jpeg,image/png,image/webp,image/gif" : "video/mp4,video/webm,video/quicktime"}
            className="text-sm text-paper/70 file:mr-3 file:rounded-full file:border-0 file:bg-soul-orange file:px-4 file:py-2 file:text-xs file:font-bold file:uppercase file:tracking-widest file:text-ink hover:file:opacity-90"
          />
        </div>
        {type === "VIDEO" && (
          <div>
            <label className="label-field">Vorschaubild (optional)</label>
            <input
              ref={posterInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="text-sm text-paper/70 file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-xs file:font-bold file:uppercase file:tracking-widest file:text-paper hover:file:opacity-90"
            />
          </div>
        )}
        <div>
          <label className="label-field">Alt-Text/Label (optional)</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="input-field"
            placeholder="z.B. SØUL Rooftop Session"
          />
        </div>
        <button type="submit" disabled={uploading} className="btn-primary">
          {uploading ? "Lädt hoch …" : "+ Hinzufügen"}
        </button>
        {error && (
          <p role="alert" className="w-full text-sm text-red-400">
            {error}
          </p>
        )}
      </form>

      {items.length === 0 ? (
        <p className="rounded-2xl card-border p-10 text-center text-paper/50">
          Noch keine Galerie-Einträge. Oben das erste Foto oder Video hinzufügen.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {items.map((item, index) => (
            <div key={item.id} className="flex flex-col gap-2 rounded-2xl card-border p-2">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-neutral-900">
                {item.type === "PHOTO" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.url}
                    alt={item.label ?? ""}
                    className="h-full w-full object-cover"
                  />
                ) : item.posterUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.posterUrl}
                    alt={item.label ?? ""}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <video src={item.url} muted className="h-full w-full object-cover" />
                )}
                <span className="absolute left-2 top-2 rounded-full bg-ink/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-paper/80">
                  {item.type === "PHOTO" ? "Foto" : "Video"}
                </span>
              </div>
              {item.label && (
                <p className="truncate px-1 text-[11px] text-paper/50">{item.label}</p>
              )}
              <div className="flex items-center justify-between gap-1 px-1">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => moveItem(index, -1)}
                    disabled={index === 0}
                    className="rounded-full border border-paper/15 px-2 py-1 text-xs text-paper/70 hover:text-soul-orange disabled:opacity-20"
                    aria-label="Nach vorne verschieben"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(index, 1)}
                    disabled={index === items.length - 1}
                    className="rounded-full border border-paper/15 px-2 py-1 text-xs text-paper/70 hover:text-soul-orange disabled:opacity-20"
                    aria-label="Nach hinten verschieben"
                  >
                    →
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => deleteItem(item.id)}
                  disabled={busyId === item.id}
                  className="text-[11px] font-semibold uppercase tracking-widest text-paper/40 hover:text-red-400"
                >
                  Löschen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
