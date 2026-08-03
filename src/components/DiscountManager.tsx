"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatPrice } from "@/lib/format";

type DiscountView = {
  id: string;
  code: string | null;
  type: string;
  value: number;
  label: string | null;
  active: boolean;
  maxUses: number | null;
  usedCount: number;
};

const TYPE_LABEL: Record<string, string> = {
  PERCENT: "Prozent",
  FIXED: "Fester Betrag",
  BOGO: "2 für 1"
};

function describe(d: DiscountView, currency: string) {
  if (d.type === "PERCENT") return `${d.value} % Rabatt`;
  if (d.type === "FIXED") return `${formatPrice(d.value, currency)} Rabatt`;
  return "2 für 1 — jedes zweite Ticket gratis";
}

export function DiscountManager({
  eventId,
  currency,
  initialDiscounts
}: {
  eventId: string;
  currency: string;
  initialDiscounts: DiscountView[];
}) {
  const router = useRouter();
  const [discounts, setDiscounts] = useState(initialDiscounts);

  const [type, setType] = useState<"PERCENT" | "FIXED" | "BOGO">("PERCENT");
  const [code, setCode] = useState("");
  const [value, setValue] = useState("");
  const [label, setLabel] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/discounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim() || undefined,
          type,
          value: type === "BOGO" ? 0 : parseFloat(value || "0"),
          label: label.trim() || undefined,
          maxUses: maxUses ? parseInt(maxUses, 10) : undefined
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Speichern fehlgeschlagen.");
        return;
      }
      setDiscounts((prev) => [...prev, data.discount]);
      setCode("");
      setValue("");
      setLabel("");
      setMaxUses("");
      router.refresh();
    } catch {
      setError("Verbindung fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(d: DiscountView) {
    setBusyId(d.id);
    try {
      await fetch(`/api/admin/discounts/${d.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !d.active })
      });
      setDiscounts((prev) =>
        prev.map((x) => (x.id === d.id ? { ...x, active: !x.active } : x))
      );
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function remove(d: DiscountView) {
    if (!confirm(`Rabatt "${d.code ?? "automatisch"}" wirklich löschen?`)) return;
    setBusyId(d.id);
    try {
      await fetch(`/api/admin/discounts/${d.id}`, { method: "DELETE" });
      setDiscounts((prev) => prev.filter((x) => x.id !== d.id));
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={handleCreate} className="rounded-2xl card-border p-5">
        <div className="grid gap-4 [&>*]:min-w-0 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="label-field">Art</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
              className="input-field"
            >
              <option value="PERCENT">Prozent</option>
              <option value="FIXED">Fester Betrag (€)</option>
              <option value="BOGO">2 für 1</option>
            </select>
          </div>

          {type !== "BOGO" && (
            <div>
              <label className="label-field">
                {type === "PERCENT" ? "Prozent (1–100)" : "Betrag in €"}
              </label>
              <input
                type="number"
                min={type === "PERCENT" ? 1 : 0.01}
                max={type === "PERCENT" ? 100 : undefined}
                step={type === "PERCENT" ? 1 : 0.01}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="input-field"
                placeholder={type === "PERCENT" ? "20" : "5.00"}
                required
              />
            </div>
          )}

          <div>
            <label className="label-field">Code (leer = für alle)</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="input-field"
              placeholder="z.B. SOUL20"
            />
          </div>

          <div>
            <label className="label-field">Max. Einlösungen</label>
            <input
              type="number"
              min={1}
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              className="input-field"
              placeholder="unbegrenzt"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="label-field">Bezeichnung für Gäste (optional)</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="input-field"
              placeholder='z.B. "Early Bird Aktion"'
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-3 text-sm text-red-400">
            {error}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Speichern …" : "+ Rabatt anlegen"}
          </button>
          <p className="text-[11px] text-paper/40">
            Ohne Code gilt der Rabatt automatisch für alle (nur einer pro Event möglich).
          </p>
        </div>
      </form>

      {discounts.length === 0 ? (
        <p className="rounded-2xl card-border p-8 text-center text-sm text-paper/50">
          Noch keine Rabatte für dieses Event.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl card-border">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-white/5 text-xs uppercase tracking-widest text-paper/50">
                <tr>
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Art</th>
                  <th className="px-5 py-3">Rabatt</th>
                  <th className="px-5 py-3">Genutzt</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {discounts.map((d) => (
                  <tr key={d.id} className="border-t border-paper/10">
                    <td className="px-5 py-4 font-medium text-paper">
                      {d.code ?? (
                        <span className="text-soul-orange">automatisch für alle</span>
                      )}
                      {d.label && (
                        <span className="block text-[11px] text-paper/40">{d.label}</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-paper/60">{TYPE_LABEL[d.type] ?? d.type}</td>
                    <td className="px-5 py-4 text-paper/60">{describe(d, currency)}</td>
                    <td className="px-5 py-4 text-paper/60">
                      {d.usedCount}
                      {d.maxUses ? ` / ${d.maxUses}` : ""}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase ${
                          d.active
                            ? "bg-soul-orange/20 text-soul-orange"
                            : "bg-paper/10 text-paper/50"
                        }`}
                      >
                        {d.active ? "Aktiv" : "Inaktiv"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => toggle(d)}
                          disabled={busyId === d.id}
                          className="text-xs font-semibold uppercase tracking-widest text-paper/60 hover:text-soul-orange"
                        >
                          {d.active ? "Deaktivieren" : "Aktivieren"}
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(d)}
                          disabled={busyId === d.id}
                          className="text-xs font-semibold uppercase tracking-widest text-paper/40 hover:text-red-400"
                        >
                          Löschen
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
