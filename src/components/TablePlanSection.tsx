"use client";

import { useState } from "react";
import type { TablePlan } from "@/lib/tablePlan";
import { buildReservationWhatsAppUrl, formatTablePlanEuro } from "@/lib/tablePlan";

export function TablePlanSection({
  tablePlan,
  eventTitle,
  eventDateLabel
}: {
  tablePlan: TablePlan;
  eventTitle: string;
  eventDateLabel: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [partySize, setPartySize] = useState("");

  const selected = tablePlan.tables.find((t) => t.id === selectedId) ?? null;

  function selectTable(id: string) {
    setSelectedId(id);
    const table = tablePlan.tables.find((t) => t.id === id);
    // Sinnvoller Startwert statt leerem Feld — bei den meisten Reservierungen
    // kommt ohnehin die volle Tischgröße, der Gast muss dann nichts eintippen.
    if (table) setPartySize(String(table.capacity));
  }

  const canReserve =
    Boolean(selected) && firstName.trim().length > 0 && lastName.trim().length > 0 && Number(partySize) > 0;

  function handleReserve() {
    if (!selected || !canReserve) return;
    const url = buildReservationWhatsAppUrl({
      whatsappNumber: tablePlan.whatsappNumber,
      tableId: selected.id,
      minSpendCents: selected.minSpendCents,
      eventTitle,
      eventDateLabel,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      partySize: Number(partySize)
    });
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <section className="mx-auto max-w-6xl px-5 pb-24">
      <div className="mb-8">
        <h2 className="text-display text-2xl uppercase text-paper sm:text-3xl">Tischplan</h2>
        <p className="mt-1 text-sm text-paper/70">
          Tisch auswählen, Angaben ausfüllen und direkt per WhatsApp reservieren.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.3fr_1fr]">
        <div className="relative w-full overflow-hidden rounded-2xl border border-paper/10 bg-neutral-950">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={tablePlan.imageUrl} alt="Tischplan" className="block w-full" />
          {tablePlan.tables.map((table) => {
            const isSelected = table.id === selectedId;
            return (
              <button
                key={table.id}
                type="button"
                onClick={() => selectTable(table.id)}
                aria-pressed={isSelected}
                aria-label={`Tisch ${table.id}, ${table.capacity} Personen, Mindestverzehr ${formatTablePlanEuro(table.minSpendCents)} €`}
                className={`absolute flex items-center justify-center rounded border-2 text-xs font-bold transition sm:text-sm ${
                  isSelected
                    ? "border-soul-orange bg-soul-orange/70 text-ink"
                    : "border-paper/50 bg-ink/40 text-paper hover:border-soul-orange hover:bg-soul-orange/30"
                }`}
                style={{
                  left: `${table.x}%`,
                  top: `${table.y}%`,
                  width: `${table.w}%`,
                  height: `${table.h}%`
                }}
              >
                {table.id}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-5 rounded-2xl card-border p-6">
          {selected ? (
            <div>
              <p className="text-sm font-semibold text-soul-orange">Tisch {selected.id}</p>
              <p className="mt-1 text-sm text-paper/70">
                Für {selected.capacity} Personen · Mindestverzehr{" "}
                {formatTablePlanEuro(selected.minSpendCents)} €
              </p>
            </div>
          ) : (
            <p className="text-sm text-paper/60">
              Tippe im Plan auf eine Tischnummer, um sie zu reservieren.
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label-field">Vorname</label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="input-field"
                placeholder="Vorname"
              />
            </div>
            <div>
              <label className="label-field">Nachname</label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="input-field"
                placeholder="Nachname"
              />
            </div>
          </div>

          <div>
            <label className="label-field">Personenzahl</label>
            <input
              type="number"
              min="1"
              max="50"
              value={partySize}
              onChange={(e) => setPartySize(e.target.value)}
              className="input-field sm:max-w-[140px]"
            />
          </div>

          <button
            type="button"
            onClick={handleReserve}
            disabled={!canReserve}
            className="btn-primary"
          >
            Jetzt reservieren →
          </button>
          <p className="text-[11px] text-paper/40">
            Öffnet WhatsApp mit einer vorausgefüllten Nachricht — die Reservierung ist erst
            bestätigt, sobald wir dort antworten.
          </p>
        </div>
      </div>
    </section>
  );
}
