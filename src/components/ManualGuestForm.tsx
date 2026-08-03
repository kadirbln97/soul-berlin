"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

/**
 * Sammel-Eintrag für Gästelisten-Namen, die Promoter per Nachricht schicken.
 * Ein Name pro Zeile — die Liste kann direkt aus Notizen/WhatsApp eingefügt
 * werden, gängige Aufzählungszeichen werden serverseitig entfernt.
 */
export function ManualGuestForm({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [names, setNames] = useState("");
  const [promoterName, setPromoterName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<number | null>(null);

  const previewCount = useMemo(
    () =>
      names
        .split(/\r?\n/)
        .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
        .filter((l) => l.length >= 2).length,
    [names]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setAdded(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/manual-guests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ names, promoterName })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Speichern fehlgeschlagen.");
        return;
      }
      setAdded(data.added);
      setNames("");
      router.refresh();
    } catch {
      setError("Verbindung fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl card-border p-5">
      <div className="grid gap-4 [&>*]:min-w-0 sm:grid-cols-[1fr_240px]">
        <div>
          <label className="label-field" htmlFor="manual-names">
            Namen (ein Name pro Zeile)
          </label>
          <textarea
            id="manual-names"
            rows={6}
            value={names}
            onChange={(e) => setNames(e.target.value)}
            className="input-field resize-y font-mono text-sm"
            placeholder={"Max Mustermann\nLisa Beispiel\nTom Schmidt"}
          />
          <p className="mt-1 text-[11px] text-paper/40">
            {previewCount > 0
              ? `${previewCount} ${previewCount === 1 ? "Name" : "Namen"} erkannt`
              : "Liste direkt aus WhatsApp/Notizen einfügen — Aufzählungszeichen werden automatisch entfernt."}
          </p>
        </div>

        <div>
          <label className="label-field" htmlFor="promoter">
            Promoter (optional)
          </label>
          <input
            id="promoter"
            value={promoterName}
            onChange={(e) => setPromoterName(e.target.value)}
            className="input-field"
            placeholder="z.B. Kevin"
          />
          <p className="mt-1 text-[11px] text-paper/40">
            Wird bei jedem Namen gespeichert — so siehst du später, wer wie viele Gäste
            gebracht hat.
          </p>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-400">
          {error}
        </p>
      )}
      {added !== null && (
        <p className="mt-3 text-sm text-soul-orange">
          {added} {added === 1 ? "Gast" : "Gäste"} zur Gästeliste hinzugefügt ✓
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={saving || previewCount === 0} className="btn-primary">
          {saving ? "Wird gespeichert …" : "+ Zur Gästeliste hinzufügen"}
        </button>
        <p className="text-[11px] text-paper/40">
          Diese Gäste erhalten keine E-Mail und keinen QR-Code — sie werden an der Tür über
          die Namenssuche eingecheckt.
        </p>
      </div>
    </form>
  );
}
