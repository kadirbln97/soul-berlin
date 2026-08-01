"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LOCALE_COOKIE, LOCALES, type Locale } from "@/lib/i18n";

/**
 * Sprachumschalter im Header. Speichert die Wahl in einem Cookie und lädt die
 * Seite serverseitig neu — dadurch ist sofort die komplette Seite (inkl. der
 * vom Server gerenderten Texte) in der neuen Sprache.
 */
export function LanguageSwitcher({ current }: { current: Locale }) {
  const router = useRouter();
  const [pending, setPending] = useState<Locale | null>(null);

  function switchTo(locale: Locale) {
    if (locale === current) return;
    setPending(locale);
    // Ein Jahr gültig, für die ganze Seite.
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    router.refresh();
  }

  return (
    <div
      className="flex items-center rounded-full border border-paper/15 p-0.5"
      role="group"
      aria-label="Sprache wählen / Choose language"
    >
      {LOCALES.map((locale) => {
        const active = locale === current;
        return (
          <button
            key={locale}
            type="button"
            onClick={() => switchTo(locale)}
            aria-pressed={active}
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest transition ${
              active
                ? "bg-soul-orange text-ink"
                : "text-paper/50 hover:text-paper"
            } ${pending === locale ? "opacity-60" : ""}`}
          >
            {locale}
          </button>
        );
      })}
    </div>
  );
}
