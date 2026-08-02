"use client";

import { useMemo, useRef, useState } from "react";
import { SITE_CONTENT_FIELDS, type SiteContentField } from "@/lib/siteContent";

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

export function HomepageEditor({ initialValues }: { initialValues: Record<string, string> }) {
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [savedValues, setSavedValues] = useState<Record<string, string>>(initialValues);
  const [saving, setSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState(false);

  // Cache-Buster: zwingt das Vorschau-iframe nach dem Speichern zum echten
  // Neuladen (sonst zeigt der Browser die alte Seite aus dem Cache).
  const [previewNonce, setPreviewNonce] = useState(0);
  const previewRef = useRef<HTMLIFrameElement>(null);

  const isDirty = useMemo(
    () =>
      SITE_CONTENT_FIELDS.some(
        (f) =>
          (values[f.key] ?? "") !== (savedValues[f.key] ?? "") ||
          (f.translatable &&
            (values[`${f.key}_en`] ?? "") !== (savedValues[`${f.key}_en`] ?? "")) ||
          (f.type === "image" &&
            (values[`${f.key}_ai`] ?? "") !== (savedValues[`${f.key}_ai`] ?? ""))
      ),
    [values, savedValues]
  );

  const groups = useMemo(() => {
    const map = new Map<string, SiteContentField[]>();
    SITE_CONTENT_FIELDS.forEach((field) => {
      const list = map.get(field.group) ?? [];
      list.push(field);
      map.set(field.group, list);
    });
    return Array.from(map.entries());
  }, []);

  function setValue(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setSavedNote(false);
  }

  async function handleImageUpload(key: string, file: File) {
    setError(null);

    if (file.size > MAX_IMAGE_BYTES) {
      setError(`Bild zu groß (max. ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)} MB).`);
      return;
    }

    setUploadingKey(key);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/gallery/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload fehlgeschlagen.");
        return;
      }
      setValue(key, data.url);
    } catch {
      setError("Verbindung fehlgeschlagen.");
    } finally {
      setUploadingKey(null);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/site-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Speichern fehlgeschlagen.");
        return;
      }
      setSavedValues(values);
      setSavedNote(true);
      setPreviewNonce((n) => n + 1);
    } catch {
      setError("Verbindung fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }

  function resetField(field: SiteContentField) {
    setValue(field.key, field.default);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-start">
      {/* --- Formular --- */}
      <div className="flex flex-col gap-5">
        {groups.map(([groupName, fields]) => (
          <section key={groupName} className="rounded-2xl card-border p-5">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-soul-orange">
              {groupName}
            </h2>
            <div className="flex flex-col gap-4">
              {fields.map((field) => (
                <div key={field.key}>
                  <div className="flex items-baseline justify-between gap-2">
                    <label className="label-field" htmlFor={field.key}>
                      {field.label}
                    </label>
                    {(values[field.key] ?? "") !== field.default && (
                      <button
                        type="button"
                        onClick={() => resetField(field)}
                        className="text-[10px] uppercase tracking-widest text-paper/30 hover:text-soul-orange"
                      >
                        Zurücksetzen
                      </button>
                    )}
                  </div>

                  {field.type === "image" ? (
                    <div className="flex items-start gap-3">
                      <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-paper/15 bg-neutral-900">
                        {values[field.key] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={values[field.key]}
                            alt="Vorschau"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[9px] uppercase text-paper/30">
                            Kein Bild
                          </div>
                        )}
                      </div>
                      <input
                        id={field.key}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={uploadingKey === field.key}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(field.key, file);
                          e.target.value = "";
                        }}
                        className="text-xs text-paper/70 file:mr-2 file:rounded-full file:border-0 file:bg-soul-orange file:px-3 file:py-1.5 file:text-[10px] file:font-bold file:uppercase file:tracking-widest file:text-ink hover:file:opacity-90"
                      />
                      <label className="flex cursor-pointer items-start gap-1.5 pt-1">
                        <input
                          type="checkbox"
                          checked={values[`${field.key}_ai`] === "1"}
                          onChange={(e) => setValue(`${field.key}_ai`, e.target.checked ? "1" : "")}
                          className="mt-0.5 h-3.5 w-3.5 accent-soul-orange"
                        />
                        <span className="text-[11px] leading-tight text-paper/50">
                          Mit KI erstellt
                          <br />
                          <span className="text-paper/30">zeigt Hinweis auf der Seite</span>
                        </span>
                      </label>
                    </div>
                  ) : field.type === "textarea" ? (
                    <textarea
                      id={field.key}
                      rows={3}
                      value={values[field.key] ?? ""}
                      onChange={(e) => setValue(field.key, e.target.value)}
                      className="input-field"
                    />
                  ) : (
                    <input
                      id={field.key}
                      value={values[field.key] ?? ""}
                      onChange={(e) => setValue(field.key, e.target.value)}
                      className="input-field"
                    />
                  )}

                  {field.translatable && (
                    <div className="mt-2 border-l-2 border-soul-orange/30 pl-3">
                      <label className="label-field" htmlFor={`${field.key}_en`}>
                        English (optional)
                      </label>
                      {field.type === "textarea" ? (
                        <textarea
                          id={`${field.key}_en`}
                          rows={2}
                          value={values[`${field.key}_en`] ?? ""}
                          onChange={(e) => setValue(`${field.key}_en`, e.target.value)}
                          className="input-field"
                        />
                      ) : (
                        <input
                          id={`${field.key}_en`}
                          value={values[`${field.key}_en`] ?? ""}
                          onChange={(e) => setValue(`${field.key}_en`, e.target.value)}
                          className="input-field"
                        />
                      )}
                    </div>
                  )}

                  {uploadingKey === field.key && (
                    <p className="mt-1 text-xs text-paper/50">Lädt hoch …</p>
                  )}
                  {field.help && (
                    <p className="mt-1 text-[11px] text-paper/40">{field.help}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}

        {error && (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        )}

        <div className="sticky bottom-4 flex items-center gap-3 rounded-2xl border border-paper/10 bg-ink/90 p-3 backdrop-blur">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="btn-primary disabled:opacity-40"
          >
            {saving ? "Speichern …" : "Speichern & Vorschau aktualisieren"}
          </button>
          {savedNote && !isDirty && (
            <span className="text-xs uppercase tracking-widest text-soul-orange">
              Gespeichert ✓
            </span>
          )}
          {isDirty && !saving && (
            <span className="text-xs text-paper/40">Ungespeicherte Änderungen</span>
          )}
        </div>
      </div>

      {/* --- Live-Vorschau --- */}
      <div className="lg:sticky lg:top-6">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-paper/40">
            Vorschau (echte Startseite)
          </p>
          <button
            type="button"
            onClick={() => setPreviewNonce((n) => n + 1)}
            className="text-[11px] uppercase tracking-widest text-paper/40 hover:text-soul-orange"
          >
            Neu laden
          </button>
        </div>
        <div className="overflow-hidden rounded-2xl border border-paper/10 bg-ink">
          <iframe
            ref={previewRef}
            key={previewNonce}
            src={`/?preview=${previewNonce}`}
            title="Vorschau der Startseite"
            className="h-[70vh] w-full lg:h-[80vh]"
          />
        </div>
        <p className="mt-2 text-[11px] text-paper/30">
          Die Vorschau zeigt den gespeicherten Stand. Nach dem Speichern lädt sie automatisch neu.
        </p>
      </div>
    </div>
  );
}
