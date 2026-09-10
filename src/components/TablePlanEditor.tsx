"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

/**
 * Zeichen-Editor für den Tischplan: Tische werden direkt auf dem Grundriss
 * gezogen statt als Prozentwerte getippt.
 *
 * - Auf freier Fläche ziehen → neuer Tisch.
 * - Tisch anfassen und ziehen → verschieben.
 * - Ecke anfassen und ziehen → Größe ändern.
 * - Klick → auswählen; Pfeiltasten schieben (Shift = größere Schritte),
 *   Entf löscht.
 *
 * Alle Geometrie in Prozent vom Bild (0–100), wie es die Event-Seite und die
 * Datenbank erwarten — der Editor rechnet nur zwischen Pixeln und Prozent um.
 */

export type EditorTable = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  isReserved: boolean;
};

type Corner = "nw" | "ne" | "sw" | "se";

type Drag =
  | { kind: "draw"; startX: number; startY: number; index: number }
  | { kind: "move"; index: number; offsetX: number; offsetY: number }
  | { kind: "resize"; index: number; corner: Corner; anchorX: number; anchorY: number };

const MIN_SIZE = 2; // Prozent — kleiner ist am Handy nicht mehr zu treffen
const CLICK_TOLERANCE = 0.6; // Prozent Bewegung, unter der ein Ziehen als Klick gilt
const HANDLE_CLASS =
  "absolute h-4 w-4 rounded-full border-2 border-ink bg-soul-orange shadow-[0_0_0_1px_rgba(0,0,0,0.4)] touch-none";

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function TablePlanEditor({
  imageUrl,
  tables,
  selectedIndex,
  onSelect,
  onChange,
  onCreate,
  onDelete
}: {
  imageUrl: string;
  tables: EditorTable[];
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
  /** Geometrie eines Tisches ändern (Verschieben/Größe). */
  onChange: (index: number, geometry: Pick<EditorTable, "x" | "y" | "w" | "h">) => void;
  /** Neuen Tisch mit dieser Geometrie anlegen; gibt dessen Index zurück. */
  onCreate: (geometry: Pick<EditorTable, "x" | "y" | "w" | "h">) => number;
  onDelete: (index: number) => void;
}) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  // Geometrie während des Ziehens lokal halten und erst beim Loslassen nach
  // oben melden — sonst rendert das ganze Event-Formular bei jeder Mausbewegung.
  const [live, setLive] = useState<Record<number, Pick<EditorTable, "x" | "y" | "w" | "h">>>({});
  const movedRef = useRef(false);

  useEffect(() => {
    if (!drag) setLive({});
  }, [drag]);

  function toPercent(e: PointerEvent) {
    const rect = surfaceRef.current!.getBoundingClientRect();
    return {
      x: clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100),
      y: clamp(((e.clientY - rect.top) / rect.height) * 100, 0, 100)
    };
  }

  function geometryOf(index: number) {
    return live[index] ?? tables[index];
  }

  /** Pointer an die Zeichenfläche binden, damit Ziehen auch außerhalb weiterläuft. */
  function capture(pointerId: number) {
    try {
      surfaceRef.current?.setPointerCapture(pointerId);
    } catch {
      // Ohne Capture funktioniert das Ziehen innerhalb der Fläche trotzdem.
    }
  }

  function startDrawing(e: PointerEvent<HTMLDivElement>) {
    if (e.button !== 0 || e.target !== surfaceRef.current) return;
    const p = toPercent(e);
    movedRef.current = false;
    capture(e.pointerId);
    setDrag({ kind: "draw", startX: p.x, startY: p.y, index: -1 });
    setLive({ [-1]: { x: p.x, y: p.y, w: 0, h: 0 } });
    onSelect(null);
  }

  function startMoving(e: PointerEvent<HTMLButtonElement>, index: number) {
    if (e.button !== 0) return;
    e.stopPropagation();
    const p = toPercent(e);
    const t = tables[index];
    movedRef.current = false;
    capture(e.pointerId);
    setDrag({ kind: "move", index, offsetX: p.x - t.x, offsetY: p.y - t.y });
    onSelect(index);
  }

  function startResizing(e: PointerEvent<HTMLSpanElement>, index: number, corner: Corner) {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    const t = tables[index];
    // Gegenüberliegende Ecke bleibt stehen.
    const anchorX = corner === "nw" || corner === "sw" ? t.x + t.w : t.x;
    const anchorY = corner === "nw" || corner === "ne" ? t.y + t.h : t.y;
    movedRef.current = true;
    capture(e.pointerId);
    setDrag({ kind: "resize", index, corner, anchorX, anchorY });
    onSelect(index);
  }

  function handleMove(e: PointerEvent<HTMLDivElement>) {
    if (!drag) return;
    const p = toPercent(e);

    if (drag.kind === "draw") {
      const x = Math.min(drag.startX, p.x);
      const y = Math.min(drag.startY, p.y);
      const w = Math.abs(p.x - drag.startX);
      const h = Math.abs(p.y - drag.startY);
      if (w > CLICK_TOLERANCE || h > CLICK_TOLERANCE) movedRef.current = true;
      setLive({ [-1]: { x, y, w, h } });
      return;
    }

    if (drag.kind === "move") {
      const t = tables[drag.index];
      const x = clamp(p.x - drag.offsetX, 0, 100 - t.w);
      const y = clamp(p.y - drag.offsetY, 0, 100 - t.h);
      if (Math.abs(x - t.x) > CLICK_TOLERANCE || Math.abs(y - t.y) > CLICK_TOLERANCE) {
        movedRef.current = true;
      }
      setLive({ [drag.index]: { x, y, w: t.w, h: t.h } });
      return;
    }

    const x = Math.min(drag.anchorX, p.x);
    const y = Math.min(drag.anchorY, p.y);
    const w = Math.max(MIN_SIZE, Math.abs(p.x - drag.anchorX));
    const h = Math.max(MIN_SIZE, Math.abs(p.y - drag.anchorY));
    setLive({
      [drag.index]: { x: clamp(x, 0, 100 - w), y: clamp(y, 0, 100 - h), w, h }
    });
  }

  function handleUp(e: PointerEvent<HTMLDivElement>) {
    if (!drag) return;
    try {
      surfaceRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      // Capture kann schon weg sein (z.B. Tab-Wechsel) — unkritisch.
    }

    if (drag.kind === "draw") {
      const g = live[-1];
      if (g && movedRef.current && g.w >= MIN_SIZE && g.h >= MIN_SIZE) {
        const index = onCreate({
          x: round1(g.x),
          y: round1(g.y),
          w: round1(g.w),
          h: round1(g.h)
        });
        onSelect(index);
      }
    } else {
      const g = live[drag.index];
      if (g && movedRef.current) {
        onChange(drag.index, {
          x: round1(g.x),
          y: round1(g.y),
          w: round1(g.w),
          h: round1(g.h)
        });
      }
    }
    setDrag(null);
  }

  function handleKey(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const t = tables[index];
    const step = e.shiftKey ? 2 : 0.5;
    let next: Pick<EditorTable, "x" | "y" | "w" | "h"> | null = null;
    switch (e.key) {
      case "ArrowLeft":
        next = { ...t, x: clamp(t.x - step, 0, 100 - t.w) };
        break;
      case "ArrowRight":
        next = { ...t, x: clamp(t.x + step, 0, 100 - t.w) };
        break;
      case "ArrowUp":
        next = { ...t, y: clamp(t.y - step, 0, 100 - t.h) };
        break;
      case "ArrowDown":
        next = { ...t, y: clamp(t.y + step, 0, 100 - t.h) };
        break;
      case "Delete":
      case "Backspace":
        e.preventDefault();
        onDelete(index);
        return;
      default:
        return;
    }
    e.preventDefault();
    onChange(index, { x: round1(next.x), y: round1(next.y), w: t.w, h: t.h });
  }

  const drawing = drag?.kind === "draw" ? live[-1] : null;

  return (
    <div>
      <div
        ref={surfaceRef}
        onPointerDown={startDrawing}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerCancel={handleUp}
        className="relative w-full cursor-crosshair select-none overflow-hidden rounded-xl border border-paper/15 bg-neutral-900 touch-none"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="Grundriss"
          draggable={false}
          className="pointer-events-none block w-full"
        />

        {tables.map((t, i) => {
          const g = geometryOf(i);
          const selected = selectedIndex === i;
          return (
            <button
              key={i}
              type="button"
              onPointerDown={(e) => startMoving(e, i)}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(i);
              }}
              onKeyDown={(e) => handleKey(e, i)}
              aria-label={`Tisch ${t.id || i + 1}${t.isReserved ? ", vergeben" : ""}`}
              aria-pressed={selected}
              className={`absolute flex items-start justify-start rounded border-2 px-1 text-[11px] font-bold leading-none text-paper touch-none ${
                drag?.kind === "move" && drag.index === i ? "cursor-grabbing" : "cursor-grab"
              } ${
                t.isReserved
                  ? "border-paper/30 bg-ink/70 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(245,243,238,0.18)_4px,rgba(245,243,238,0.18)_6px)]"
                  : "border-soul-orange bg-soul-orange/20"
              } ${selected ? "z-10 ring-2 ring-soul-orange ring-offset-2 ring-offset-ink" : ""}`}
              style={{ left: `${g.x}%`, top: `${g.y}%`, width: `${g.w}%`, height: `${g.h}%` }}
            >
              {t.id}
              {selected &&
                (["nw", "ne", "sw", "se"] as Corner[]).map((corner) => (
                  <span
                    key={corner}
                    role="presentation"
                    onPointerDown={(e) => startResizing(e, i, corner)}
                    className={`${HANDLE_CLASS} ${
                      corner === "nw"
                        ? "-left-2 -top-2 cursor-nwse-resize"
                        : corner === "ne"
                          ? "-right-2 -top-2 cursor-nesw-resize"
                          : corner === "sw"
                            ? "-bottom-2 -left-2 cursor-nesw-resize"
                            : "-bottom-2 -right-2 cursor-nwse-resize"
                    }`}
                  />
                ))}
            </button>
          );
        })}

        {drawing && drawing.w > 0 && (
          <div
            className="pointer-events-none absolute rounded border-2 border-dashed border-soul-orange bg-soul-orange/10"
            style={{
              left: `${drawing.x}%`,
              top: `${drawing.y}%`,
              width: `${drawing.w}%`,
              height: `${drawing.h}%`
            }}
          />
        )}
      </div>
      <p className="mt-2 text-[11px] text-paper/40">
        Auf dem Plan ein Rechteck über jeden Tisch ziehen. Tische lassen sich verschieben, an
        den Ecken vergrößern und mit den Pfeiltasten feinjustieren (Entf löscht). Nummer,
        Personen und Mindestverzehr stehen in der Liste darunter.
      </p>
    </div>
  );
}
