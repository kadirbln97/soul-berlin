"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import type { Locale } from "@/lib/i18n";

/**
 * Aufklappmenü für die Handy-Ansicht.
 *
 * Auf schmalen Bildschirmen war die Navigation vorher gequetscht (Instagram
 * wurde sogar ganz ausgeblendet). Ab sm greift weiterhin die normale
 * Leiste — dieses Menü ist bewusst nur mobil sichtbar.
 */
export function MobileMenu({
  locale,
  labels,
  instagramUrl
}: {
  locale: Locale;
  labels: { home: string; events: string; instagram: string; menu: string; close: string };
  /** Aus dem Baukasten; leer = Eintrag wird ausgeblendet. */
  instagramUrl?: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Beim Seitenwechsel schließen — sonst bliebe das Menü nach dem Antippen
  // eines Links offen über der neuen Seite stehen.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Escape schließt; solange offen, bleibt die Seite dahinter stehen.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  const linkClass =
    "block rounded-xl px-4 py-3 text-base font-semibold text-paper transition hover:bg-paper/5 hover:text-soul-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soul-orange";

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? labels.close : labels.menu}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-paper/20 text-paper transition hover:border-soul-orange hover:text-soul-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soul-orange"
      >
        {/* Zwei Striche, die sich beim Öffnen zum X drehen — reine CSS-Bewegung,
            damit kein Icon-Paket nötig ist. */}
        <span className="relative block h-4 w-5" aria-hidden="true">
          <span
            className={`absolute left-0 block h-[2px] w-5 bg-current transition-transform duration-200 ${
              open ? "top-[7px] rotate-45" : "top-0"
            }`}
          />
          <span
            className={`absolute left-0 block h-[2px] w-5 bg-current transition-opacity duration-200 ${
              open ? "opacity-0" : "top-[7px] opacity-100"
            }`}
          />
          <span
            className={`absolute left-0 block h-[2px] w-5 bg-current transition-transform duration-200 ${
              open ? "top-[7px] -rotate-45" : "top-[14px]"
            }`}
          />
        </span>
      </button>

      {/* Panel und Abdunkelung bleiben immer im DOM und werden über data-open
          umgeschaltet. Nur so lässt sich auch das Schließen animieren — ein
          entferntes Element kann nicht mehr ausblenden. Ohne Unterstützung für
          `display … allow-discrete` erscheint/verschwindet es einfach hart. */}
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        data-open={open}
        onClick={() => setOpen(false)}
        className="mobile-scrim absolute inset-x-0 top-full z-30 h-screen cursor-default bg-ink/60 backdrop-blur-sm"
      />
      <div
        id="mobile-menu"
        data-open={open}
        className="mobile-panel absolute inset-x-0 top-full z-40 border-b border-paper/10 bg-ink px-4 pb-5 pt-3 shadow-2xl shadow-black/60"
      >
        <nav className="flex flex-col gap-1">
          <Link href="/" className={linkClass}>
            {labels.home}
          </Link>
          <Link href="/events" className={linkClass}>
            {labels.events}
          </Link>
          {instagramUrl && (
            <a
              href={instagramUrl}
              target="_blank"
              rel="noreferrer noopener"
              className={linkClass}
            >
              {labels.instagram}
            </a>
          )}
        </nav>
        <div className="mt-4 border-t border-paper/10 pt-4">
          <LanguageSwitcher current={locale} />
        </div>
      </div>
    </div>
  );
}
