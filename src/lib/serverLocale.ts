import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, getDict, type Locale } from "./i18n";

/**
 * Ermittelt die Sprache für Server-Komponenten: zuerst die bewusste Auswahl
 * aus dem Cookie, sonst die Browsersprache, sonst die Standardsprache.
 */
export function getLocale(): Locale {
  const fromCookie = cookies().get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;

  const accept = headers().get("accept-language") ?? "";
  // Nur die erste, höchstpriorisierte Sprache betrachten.
  if (/^de\b/i.test(accept.split(",")[0]?.trim() ?? "")) return "de";

  return DEFAULT_LOCALE;
}

/** Kurzform: Sprache + passendes Wörterbuch in einem Aufruf. */
export function getTranslations() {
  const locale = getLocale();
  return { locale, t: getDict(locale) };
}

/**
 * Wählt zwischen deutschem Originalfeld und optionaler englischer Fassung.
 * Ist das englische Feld leer, wird bewusst der deutsche Text angezeigt,
 * statt eine Lücke zu hinterlassen.
 */
export function pickText(locale: Locale, base: string, english?: string | null): string {
  if (locale === "en" && english && english.trim()) return english;
  return base;
}
