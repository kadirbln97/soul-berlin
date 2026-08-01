import { prisma } from "./prisma";

/**
 * Alle im Admin-Bereich (/admin/homepage) änderbaren Inhalte der Startseite.
 *
 * Der Standardwert ist gleichzeitig das, was ohne jede Anpassung angezeigt
 * wird — die Seite funktioniert also auch mit komplett leerer SiteContent-
 * Tabelle. Neue Felder brauchen nur hier einen Eintrag (kein DB-Umbau).
 */
export type SiteContentField = {
  key: string;
  label: string;
  /** "text" = einzeilig, "textarea" = mehrzeilig, "image" = Bild-Upload */
  type: "text" | "textarea" | "image";
  default: string;
  help?: string;
  /** Überschrift der Gruppe, in der das Feld im Admin angezeigt wird. */
  group: string;
};

export const SITE_CONTENT_FIELDS: SiteContentField[] = [
  // --- Kopfbereich (Hero) ---
  {
    key: "hero_image",
    label: "Hintergrundbild",
    type: "image",
    default: "/media/photos/hero-dancefloor.webp",
    help: "Großes Foto ganz oben. Querformat, mind. 1600px breit.",
    group: "Kopfbereich"
  },
  {
    key: "hero_headline_1",
    label: "Überschrift, Zeile 1",
    type: "text",
    default: "Good people.",
    group: "Kopfbereich"
  },
  {
    key: "hero_headline_2",
    label: "Überschrift, Zeile 2 (orange)",
    type: "text",
    default: "Good music.",
    group: "Kopfbereich"
  },
  {
    key: "hero_tagline",
    label: "Kleiner Text darunter",
    type: "text",
    default: "House Music Culture · Berlin",
    group: "Kopfbereich"
  },
  {
    key: "hero_cta_prefix",
    label: "Button-Text vor dem Eventnamen",
    type: "text",
    default: "Nächstes Event:",
    help: 'Ergibt z.B. "Nächstes Event: SØUL @THE DOOR →". Leer lassen, um nur den Eventnamen zu zeigen.',
    group: "Kopfbereich"
  },

  // --- Event-Bereich ---
  {
    key: "events_heading",
    label: "Überschrift",
    type: "text",
    default: "Upcoming Events",
    group: "Event-Bereich"
  },
  {
    key: "events_link_label",
    label: "Link-Text oben rechts",
    type: "text",
    default: "Alle ansehen →",
    group: "Event-Bereich"
  },
  {
    key: "events_empty_text",
    label: "Text, wenn keine Events online sind",
    type: "textarea",
    default: "Aktuell sind keine Events veröffentlicht — schau bald wieder vorbei.",
    group: "Event-Bereich"
  },

  // --- Galerie ---
  {
    key: "gallery_heading",
    label: "Überschrift",
    type: "text",
    default: "SØUL in Action",
    group: "Galerie"
  },
  {
    key: "gallery_subtext",
    label: "Text darunter",
    type: "textarea",
    default: "Impressionen von den letzten Events — Fotos & kurze Clips.",
    group: "Galerie"
  }
];

export type SiteContent = Record<string, string>;

/** Baut das Standard-Objekt aus den Feld-Definitionen. */
export function getDefaultSiteContent(): SiteContent {
  return Object.fromEntries(SITE_CONTENT_FIELDS.map((f) => [f.key, f.default]));
}

/**
 * Liest die gespeicherten Werte und legt sie über die Standardwerte. Fällt bei
 * einem Datenbankfehler bewusst auf die Standardwerte zurück, damit die
 * öffentliche Startseite niemals wegen dieser Zusatzfunktion ausfällt.
 */
export async function getSiteContent(): Promise<SiteContent> {
  const defaults = getDefaultSiteContent();
  try {
    const rows = await prisma.siteContent.findMany();
    const stored = Object.fromEntries(
      rows.filter((r) => r.value.trim() !== "").map((r) => [r.key, r.value])
    );
    return { ...defaults, ...stored };
  } catch {
    return defaults;
  }
}
