/**
 * Strukturierte Daten (schema.org) für Google.
 *
 * Zweck: Google versteht aus reinem Text nicht zuverlässig, dass eine Seite
 * eine Veranstaltung mit Datum, Ort und Preis beschreibt. Mit dieser
 * Auszeichnung kann ein Event in der Suche als Veranstaltung erscheinen —
 * mit Datum und Ort direkt im Ergebnis, statt nur als blauer Link.
 *
 * Wichtig: hier wird ausschließlich ausgezeichnet, was auf der Seite auch
 * wirklich steht. Erfundene oder geschönte Angaben (etwa ein Preis, den es
 * nicht gibt) verstoßen gegen Googles Richtlinien und können dazu führen,
 * dass die Auszeichnung für die ganze Domain ignoriert wird.
 */

const ORGANISATION_NAME = "SØUL Berlin";
const INSTAGRAM_URL = "https://www.instagram.com/soulberliin/";

/** Zerlegt "Straße 1, 10117 Berlin" in die von Google erwarteten Bestandteile. */
function parseAdresse(adresse: string | null, ort: string) {
  if (!adresse || adresse.trim() === "") {
    return { "@type": "Place" as const, name: ort };
  }

  // Letzter Teil nach dem Komma sieht oft aus wie "10117 Berlin".
  const teile = adresse.split(",").map((t) => t.trim()).filter(Boolean);
  const letzter = teile[teile.length - 1] ?? "";
  const plzStadt = letzter.match(/^(\d{5})\s+(.+)$/);

  if (plzStadt && teile.length > 1) {
    return {
      "@type": "Place" as const,
      name: ort,
      address: {
        "@type": "PostalAddress",
        streetAddress: teile.slice(0, -1).join(", "),
        postalCode: plzStadt[1],
        addressLocality: plzStadt[2],
        addressCountry: "DE"
      }
    };
  }

  // Kein erkennbares Muster: die Angabe unverändert übernehmen, statt
  // Bestandteile zu raten.
  return {
    "@type": "Place" as const,
    name: ort,
    address: { "@type": "PostalAddress", streetAddress: adresse, addressCountry: "DE" }
  };
}

export type EventJsonLdInput = {
  title: string;
  description: string;
  slug: string;
  venue: string;
  address: string | null;
  dateStart: Date;
  dateEnd: Date | null;
  imageUrl: string | null;
  currency: string;
  /** Aktuell gültiger Preis in Cent — null bedeutet kostenlos. */
  priceCents: number | null;
  isSoldOut: boolean;
  /**
   * Läuft der Verkauf über einen Fremdanbieter, kennen wir den Preis nicht.
   * Dann wird bewusst keiner ausgezeichnet und als Kaufadresse der externe
   * Shop angegeben — eine erfundene 0 wäre eine Falschangabe gegenüber Google
   * und den Gästen.
   */
  externalTicketUrl?: string | null;
  /** Absolute Basisadresse der Seite (z.B. https://soulberlin.de). */
  appUrl: string;
};

export function buildEventJsonLd(e: EventJsonLdInput) {
  const url = `${e.appUrl}/events/${e.slug}`;

  const verfuegbarkeit = e.isSoldOut
    ? "https://schema.org/SoldOut"
    : "https://schema.org/InStock";

  const externerShop = e.externalTicketUrl?.trim() || null;

  const angebot = externerShop
    ? {
        // Preis unbekannt (steht beim Fremdanbieter): Adresse dorthin, aber
        // keine Preisangabe. Lieber unvollständig als falsch.
        "@type": "Offer",
        url: externerShop,
        availability: verfuegbarkeit
      }
    : {
        // Eigener Verkauf bzw. Gästeliste — Preis kennen wir. null heißt
        // kostenlos, das ist ebenfalls ein Angebot mit Preis 0.
        "@type": "Offer",
        url,
        price: e.priceCents !== null ? (e.priceCents / 100).toFixed(2) : "0",
        priceCurrency: e.currency.toUpperCase(),
        availability: verfuegbarkeit
      };

  return {
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    name: e.title,
    // Kurz halten: Google schneidet lange Beschreibungen ohnehin ab.
    description: e.description.replace(/\s+/g, " ").trim().slice(0, 300),
    startDate: e.dateStart.toISOString(),
    ...(e.dateEnd ? { endDate: e.dateEnd.toISOString() } : {}),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: parseAdresse(e.address, e.venue),
    ...(e.imageUrl ? { image: [e.imageUrl] } : {}),
    url,
    offers: angebot,
    organizer: {
      "@type": "Organization",
      name: ORGANISATION_NAME,
      url: e.appUrl
    },
    // Ohne konkretes Line-up bewusst die Reihe selbst als Act — besser als
    // eine erfundene Künstlerangabe.
    performer: { "@type": "MusicGroup", name: ORGANISATION_NAME }
  };
}

/**
 * Auszeichnung der Marke selbst. Hilft Google, "SØUL Berlin" als
 * eigenständige Organisation zu erkennen statt nur als zwei allgemeine
 * Wörter — genau das Problem bei einem generischen Namen wie diesem.
 */
export function buildOrganizationJsonLd(appUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: ORGANISATION_NAME,
    alternateName: "SOUL Berlin",
    url: appUrl,
    logo: `${appUrl}/logo.png`,
    image: `${appUrl}/opengraph-image.jpg`,
    description:
      "SØUL Berlin ist House Music Culture: Events, Gästeliste und Tickets in Berlin.",
    areaServed: { "@type": "City", name: "Berlin" },
    sameAs: [INSTAGRAM_URL]
  };
}
