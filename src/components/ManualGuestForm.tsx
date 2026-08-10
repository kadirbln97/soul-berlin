"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { parseGuestLines, countPeople } from "@/lib/parseGuestLine";

/**
 * Sammel-Eintrag für Gästelisten-Namen, die Promoter per Nachricht schicken.
 * Ein Name pro Zeile — die Liste kann direkt aus Notizen/WhatsApp eingefügt
 * werden, gängige Aufzählungszeichen werden serverseitig entfernt.
 *
 * Begleitpersonen dürfen wie gewohnt hinter dem Namen stehen ("Max +2"). Die
 * Vorschau zeigt deshalb beide Zahlen — Einträge und tatsächliche Gäste —,
 * damit vor dem Speichern sichtbar ist, was auf der Liste landet.
 */
export function ManualGuestForm({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [names, setNames] = useState("");
  const [promoterName, setPromoterName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<{ entries: number; people: number } | null>(null);

  // Dieselbe Zerlegung wie im Server, damit Vorschau und gespeichertes
  // Ergebnis nicht auseinanderlaufen können.
  const preview = useMemo(() => {
    const entries = parseGuestLines(names);
    return { entries: entries.length, people: countPeople(entries) };
  }, [names]);
  const previewCount = preview.entries;

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
      setAdded({ entries: data.added, people: data.people ?? data.added });
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
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 [&>*]:min-w-0 sm:grid-cols-[minmax(0,1fr)_240px]">
        <div>
          <label className="label-field" htmlFor="manual-names">
            Namen (ein Name pro Zeile, Begleitung als „+2“)
          </label>
          <textarea
            id="manual-names"
            rows={6}
            value={names}
            onChange={(e) => setNames(e.target.value)}
            className="input-field resize-y font-mono text-sm"
            placeholder={"Max Mustermann +2\nLisa Beispiel\nTom Schmidt +1"}
          />
          <p className="mt-1 text-[11px] text-paper/40">
            {previewCount > 0 ? (
              <>
                {previewCount} {previewCount === 1 ? "Eintrag" : "Einträge"} ·{" "}
                <span className="font-semibold text-soul-orange">
                  {preview.people} {preview.people === 1 ? "Gast" : "Gäste"}
                </span>
                {preview.people > previewCount ? " (inkl. Begleitung)" : ""}
              </>
            ) : (
              "Liste direkt aus WhatsApp/Notizen einfügen — Begleitung als „+2“ hinter den Namen, Aufzählungszeichen werden automatisch entfernt."
            )}
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
          {added.people} {added.people === 1 ? "Gast" : "Gäste"} zur Gästeliste hinzugefügt ✓
          {added.people > added.entries
            ? ` (${added.entries} ${added.entries === 1 ? "Eintrag" : "Einträge"} inkl. Begleitung)`
            : ""}
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
