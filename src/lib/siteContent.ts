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
  /**
   * true = es gibt zusätzlich eine englische Fassung unter "<key>_en".
   * Bleibt sie leer, wird auf der englischen Seite der deutsche Text gezeigt.
   */
  translatable?: boolean;
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
    translatable: true,
    label: "Überschrift, Zeile 1",
    type: "text",
    default: "Good people.",
    group: "Kopfbereich"
  },
  {
    key: "hero_headline_2",
    translatable: true,
    label: "Überschrift, Zeile 2 (orange)",
    type: "text",
    default: "Good music.",
    group: "Kopfbereich"
  },
  {
    key: "hero_tagline",
    translatable: true,
    label: "Kleiner Text darunter",
    type: "text",
    default: "House Music Culture · Berlin",
    group: "Kopfbereich"
  },
  {
    key: "hero_cta_prefix",
    translatable: true,
    label: "Button-Text vor dem Eventnamen",
    type: "text",
    default: "Nächstes Event:",
    help: 'Ergibt z.B. "Nächstes Event: SØUL @THE DOOR →". Leer lassen, um nur den Eventnamen zu zeigen.',
    group: "Kopfbereich"
  },

  // --- Event-Bereich ---
  {
    key: "events_heading",
    translatable: true,
    label: "Überschrift",
    type: "text",
    default: "Upcoming Events",
    group: "Event-Bereich"
  },
  {
    key: "events_link_label",
    translatable: true,
    label: "Link-Text oben rechts",
    type: "text",
    default: "Alle ansehen →",
    group: "Event-Bereich"
  },
  {
    key: "events_empty_text",
    translatable: true,
    label: "Text, wenn keine Events online sind",
    type: "textarea",
    default: "Aktuell sind keine Events veröffentlicht — schau bald wieder vorbei.",
    group: "Event-Bereich"
  },

  // --- Galerie ---
  {
    key: "gallery_heading",
    translatable: true,
    label: "Überschrift",
    type: "text",
    default: "SØUL in Action",
    group: "Galerie"
  },
  {
    key: "gallery_subtext",
    translatable: true,
    label: "Text darunter",
    type: "textarea",
    default: "Impressionen von den letzten Events — Fotos & kurze Clips.",
    group: "Galerie"
  },

  // --- Kontakt ---
  {
    key: "contact_email",
    label: "Empfänger für Kontaktformular",
    type: "text",
    default: "",
    help:
      "An diese Adresse gehen Nachrichten aus dem Kontaktformular. Leer lassen, " +
      "um die Admin-Login-Adresse zu verwenden.",
    group: "Kontakt"
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
export async function getSiteContent(locale: string = "de"): Promise<SiteContent> {
  const defaults = getDefaultSiteContent();
  try {
    const rows = await prisma.siteContent.findMany();
    const stored: Record<string, string> = {};
    for (const row of rows) {
      if (row.value.trim() !== "") stored[row.key] = row.value;
    }

    const merged: SiteContent = { ...defaults, ...stored };

    // Auf Englisch die gepflegte englische Fassung bevorzugen; fehlt sie,
    // bleibt bewusst der deutsche Text stehen statt einer Lücke.
    if (locale === "en") {
      for (const field of SITE_CONTENT_FIELDS) {
        if (!field.translatable) continue;
        const english = stored[`${field.key}_en`];
        if (english) merged[field.key] = english;
      }
    }

    return merged;
  } catch {
    return defaults;
  }
}

/**
 * Alle gespeicherten Werte inkl. der "_en"-Varianten — für den Admin-Baukasten,
 * der beide Sprachen nebeneinander zum Bearbeiten anzeigt.
 */
export async function getSiteContentRaw(): Promise<SiteContent> {
  const defaults = getDefaultSiteContent();
  try {
    const rows = await prisma.siteContent.findMany();
    const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return { ...defaults, ...stored };
  } catch {
    return defaults;
  }
}

/**
 * Empfängeradresse für das Kontaktformular: bevorzugt die im Admin-Bereich
 * eingetragene Adresse, sonst CONTACT_EMAIL, sonst als letzter Rückfall die
 * Admin-Login-Adresse. Gibt null zurück, wenn nirgends etwas gesetzt ist.
 */
export async function getContactRecipient(): Promise<string | null> {
  let fromAdminPanel = "";
  try {
    const row = await prisma.siteContent.findUnique({ where: { key: "contact_email" } });
    fromAdminPanel = row?.value.trim() ?? "";
  } catch {
    // Datenbank nicht erreichbar — dann greifen unten die Umgebungsvariablen.
  }

  return (
    fromAdminPanel ||
    process.env.CONTACT_EMAIL?.trim() ||
    process.env.ADMIN_EMAIL?.trim() ||
    null
  );
}
