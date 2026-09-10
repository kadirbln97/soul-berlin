"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Schwebender Ticket-Knopf.
 *
 * Liegt auf jeder Seite außer der Event-Detailseite (dort steht der
 * Eventbrite-Knopf bereits fest im Kaufpanel) und dem Admin-Bereich. Der Gast
 * kann ihn in jede der vier Ecken ziehen und mit dem × für den Besuch
 * ausblenden.
 *
 * Merken bewusst zweigeteilt:
 * - Die gewählte Ecke steht in localStorage, überlebt also den Besuch. Wer den
 *   Knopf einmal nach links geschoben hat, will ihn beim nächsten Mal nicht
 *   wieder rechts haben.
 * - Das Ausblenden steht in sessionStorage. So ist der Knopf sofort weg, wenn
 *   er stört, kommt beim nächsten Besuch aber zurück — sonst würde ein
 *   einziger Fehlklick den Ticketweg für dieses Gerät dauerhaft zumachen.
 */

type Corner = "tl" | "tr" | "bl" | "br";

const CORNER_KEY = "soul_ticket_fab_corner";
const DISMISS_KEY = "soul_ticket_fab_dismissed";

// Ab dieser Strecke gilt die Geste als Ziehen und nicht mehr als Klick —
// sonst öffnet jedes leichte Wackeln beim Antippen den Ticketshop.
const DRAG_THRESHOLD_PX = 6;

const CORNER_CLASSES: Record<Corner, string> = {
  // top-24 statt top-4: darüber liegt die Kopfzeile mit Logo und Navigation.
  tl: "left-4 top-24",
  tr: "right-4 top-24",
  bl: "left-4 bottom-6",
  br: "right-4 bottom-6"
};

function isCorner(value: unknown): value is Corner {
  return value === "tl" || value === "tr" || value === "bl" || value === "br";
}

export function TicketFab({
  url,
  label,
  title,
  closeLabel,
  moveLabel
}: {
  url: string;
  label: string;
  title: string;
  closeLabel: string;
  moveLabel: string;
}) {
  const pathname = usePathname();
  const wrapperRef = useRef<HTMLElement>(null);
  const movedRef = useRef(false);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [corner, setCorner] = useState<Corner>("br");
  const [offset, setOffset] = useState<{ x: number; y: number } | null>(null);

  // Erst nach dem Mounten rendern: localStorage gibt es beim Serverrendern
  // nicht, und ein Knopf, der erst rechts steht und dann nach links springt,
  // wäre schlechter als einer, der einen Wimpernschlag später erscheint.
  useEffect(() => {
    setMounted(true);
    try {
      const saved = window.localStorage.getItem(CORNER_KEY);
      if (isCorner(saved)) setCorner(saved);
      if (window.sessionStorage.getItem(DISMISS_KEY) === "1") setDismissed(true);
    } catch {
      // Speicher gesperrt (privater Modus, strenge Browsereinstellungen):
      // dann eben ohne Merken — der Knopf funktioniert trotzdem.
    }
  }, []);

  function handlePointerDown(e: React.PointerEvent<HTMLElement>) {
    // Nur mit der Hauptmaustaste bzw. Finger ziehen.
    if (e.button !== 0) return;
    startRef.current = { x: e.clientX, y: e.clientY };
    movedRef.current = false;
    wrapperRef.current?.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLElement>) {
    const start = startRef.current;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (!movedRef.current && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
    movedRef.current = true;
    setOffset({ x: dx, y: dy });
  }

  function handlePointerUp(e: React.PointerEvent<HTMLElement>) {
    const start = startRef.current;
    startRef.current = null;
    wrapperRef.current?.releasePointerCapture(e.pointerId);

    if (!start || !movedRef.current) {
      setOffset(null);
      return;
    }

    // Einrasten: die Ecke ergibt sich aus der Mitte des Knopfes im Verhältnis
    // zur Bildschirmmitte. Der Knopf landet dadurch immer sauber am Rand,
    // statt irgendwo im Text zu kleben.
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (rect) {
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const next: Corner = `${centerY < window.innerHeight / 2 ? "t" : "b"}${
        centerX < window.innerWidth / 2 ? "l" : "r"
      }` as Corner;
      setCorner(next);
      try {
        window.localStorage.setItem(CORNER_KEY, next);
      } catch {
        // siehe oben
      }
    }
    setOffset(null);
  }

  function dismiss() {
    setDismissed(true);
    try {
      window.sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // siehe oben
    }
  }

  // Auf der Event-Detailseite steht der Ticketknopf schon im Kaufpanel, im
  // Adminbereich hat er nichts verloren.
  const hiddenHere =
    pathname.startsWith("/admin") || /^\/events\/[^/]+/.test(pathname);

  if (!mounted || dismissed || hiddenHere) return null;

  const dragging = offset !== null;

  return (
    // aside + aria-label: eigene Landmark, damit der Knopf für Screenreader
    // nicht als "Inhalt außerhalb jeder Region" herumschwebt.
    <aside
      aria-label={title}
      ref={wrapperRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={
        offset
          ? { transform: `translate3d(${offset.x}px, ${offset.y}px, 0)` }
          : undefined
      }
      // touch-none: ohne das scrollt das Handy beim Ziehen die Seite mit.
      // z-30 bewusst unter der Kopfzeile (z-40): sonst läge der Knopf über dem
      // ausgeklappten Handy-Menü.
      className={`fixed z-30 flex touch-none items-center gap-1 ${CORNER_CLASSES[corner]} ${
        dragging ? "cursor-grabbing" : "transition-[top,bottom,left,right] duration-200 motion-reduce:transition-none"
      }`}
    >
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title={title}
        onClick={(e) => {
          // Nach einer Ziehbewegung nicht auch noch den Shop öffnen.
          if (movedRef.current) e.preventDefault();
        }}
        className="flex cursor-grab items-center gap-2 rounded-full bg-soul-orange px-4 py-2.5 text-sm font-semibold text-ink shadow-lg shadow-black/40 transition hover:bg-soul-orangeLight active:cursor-grabbing"
      >
        <span aria-hidden="true">🎫</span>
        {label}
      </a>
      <button
        type="button"
        onClick={dismiss}
        aria-label={closeLabel}
        title={closeLabel}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-ink/85 text-sm text-paper/70 shadow-lg shadow-black/40 transition hover:bg-ink hover:text-paper"
      >
        <span aria-hidden="true">×</span>
      </button>
      <span className="sr-only">{moveLabel}</span>
    </aside>
  );
}
