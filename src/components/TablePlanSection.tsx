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
    const table = tablePlan.tables.find((t) => t.id === id);
    // Vergebene Tische lassen sich gar nicht erst auswählen — die Prüfung
    // steht hier zusätzlich zum disabled-Attribut am Knopf, damit ein Tisch
    // auch dann nicht ausgewählt bleibt, wenn er erst nach der Auswahl als
    // reserviert markiert wurde.
    if (!table || table.isReserved) return;
    setSelectedId(id);
    // Sinnvoller Startwert statt leerem Feld — bei den meisten Reservierungen
    // kommt ohnehin die volle Tischgröße, der Gast muss dann nichts eintippen.
    setPartySize(String(table.capacity));
  }

  const hasReserved = tablePlan.tables.some((t) => t.isReserved);

  const canReserve =
    Boolean(selected) &&
    !selected?.isReserved &&
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    Number(partySize) > 0;

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
    <section aria-labelledby="tableplan-heading" className="mt-4">
      <div className="mb-8">
        <h2 id="tableplan-heading" className="text-display text-2xl uppercase text-paper sm:text-3xl">Tischplan</h2>
        <p className="mt-1 text-sm text-paper/70">
          Tisch auswählen, Angaben ausfüllen und direkt per WhatsApp reservieren.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.3fr_1fr]">
        <div>
          {/* Der Rahmen ums Bild ist ein eigener Kasten, damit die Legende
              darunter außerhalb des beschnittenen Bereichs liegt. */}
          <div className="relative w-full overflow-hidden rounded-2xl border border-paper/10 bg-neutral-950">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={tablePlan.imageUrl} alt="Tischplan" className="block w-full" />
          {tablePlan.tables.map((table) => {
            const isSelected = table.id === selectedId;
            const isReserved = Boolean(table.isReserved);
            return (
              <button
                key={table.id}
                type="button"
                onClick={() => selectTable(table.id)}
                disabled={isReserved}
                aria-pressed={isSelected}
                aria-label={
                  isReserved
                    ? `Tisch ${table.id}, bereits vergeben`
                    : `Tisch ${table.id}, ${table.capacity} Personen, Mindestverzehr ${formatTablePlanEuro(table.minSpendCents)} €`
                }
                // Bewusst ohne eigene Beschriftung: die Tischnummern stehen
                // bereits im Grundriss-Bild. Eine zweite Zahl obendrauf lag
                // leicht versetzt über der gedruckten und sah doppelt aus.
                // Die Fläche bleibt deshalb durchsichtig getönt — sie zeigt
                // nur, dass hier etwas anklickbar ist, und lässt die Nummer
                // aus dem Bild durchscheinen. Für Screenreader steht die
                // vollständige Angabe weiterhin im aria-label.
                className={`absolute rounded border-2 transition ${
                  isReserved
                    ? // Vergeben: kräftig abgedunkelt und mit Schraffur, damit
                      // der Unterschied auch ohne Farbsehen erkennbar ist.
                      "cursor-not-allowed border-paper/20 bg-ink/75 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(245,243,238,0.14)_5px,rgba(245,243,238,0.14)_7px)]"
                    : isSelected
                      ? // Ausgewählt: deutlich kräftiger als der Ruhezustand —
                        // auf dem Handy ist der Rahmen allein zu leise, um den
                        // Tipp sicher zu quittieren. Der Leuchtrahmen (ring)
                        // liegt außerhalb der Fläche und verdeckt die Nummer
                        // aus dem Grundriss deshalb nicht.
                        "border-soul-orange bg-soul-orange/55 ring-2 ring-soul-orange ring-offset-2 ring-offset-ink"
                      : "border-paper/25 bg-paper/[0.06] hover:border-soul-orange hover:bg-soul-orange/20"
                }`}
                style={{
                  left: `${table.x}%`,
                  top: `${table.y}%`,
                  width: `${table.w}%`,
                  height: `${table.h}%`
                }}
              />
            );
          })}
          </div>

          {/* Legende nur, wenn es tatsächlich vergebene Tische gibt — sonst
              erklärt sie einen Zustand, den auf dieser Seite niemand sieht. */}
          {hasReserved && (
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-paper/60">
              <span className="flex items-center gap-2">
                <span className="h-3 w-5 rounded-sm border-2 border-paper/25 bg-paper/[0.06]" />
                frei
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3 w-5 rounded-sm border-2 border-soul-orange bg-soul-orange/55" />
                ausgewählt
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3 w-5 rounded-sm border-2 border-paper/20 bg-ink/75 bg-[repeating-linear-gradient(45deg,transparent,transparent_3px,rgba(245,243,238,0.2)_3px,rgba(245,243,238,0.2)_4px)]" />
                schon vergeben
              </span>
            </div>
          )}
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
              {hasReserved && " Schraffierte Tische sind bereits vergeben."}
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label-field" htmlFor="tableplan-first-name">Vorname</label>
              <input
                id="tableplan-first-name"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="input-field"
                placeholder="Vorname"
              />
            </div>
            <div>
              <label className="label-field" htmlFor="tableplan-last-name">Nachname</label>
              <input
                id="tableplan-last-name"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="input-field"
                placeholder="Nachname"
              />
            </div>
          </div>

          <div>
            <label className="label-field" htmlFor="tableplan-party-size">Personenzahl</label>
            <input
              id="tableplan-party-size"
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
          <p className="text-[11px] text-paper/60">
            Öffnet WhatsApp mit einer vorausgefüllten Nachricht — die Reservierung ist erst
            bestätigt, sobald wir dort antworten.
          </p>
        </div>
      </div>
    </section>
  );
}
