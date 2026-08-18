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

/**
 * Zerlegt eine frei eingetippte Adresse in die von Google erwarteten
 * Bestandteile. Deckt beide Schreibweisen ab, die im Admin vorkommen:
 *
 *   "Stralauer Platz 30-31, 10243 Berlin"   (mit Komma)
 *   "Stralauer Platz 30-31  10243 Berlin"   (nur Leerzeichen)
 *
 * Erkennungsmerkmal ist die fünfstellige Postleitzahl am Ende. Passt nichts,
 * wird die Angabe unverändert als Straße übernommen — lieber grob als geraten.
 */
function parseAdresse(adresse: string | null, ort: string) {
  const wert = adresse?.trim() ?? "";
  if (wert === "") {
    return { "@type": "Place" as const, name: ort };
  }

  // Alles vor der PLZ = Straße, dann PLZ, dann Stadt. Das Trennzeichen davor
  // darf Komma und/oder Leerraum sein.
  const treffer = wert.match(/^(.*?)[,\s]+(\d{5})[,\s]+(.+)$/);

  if (treffer) {
    const strasse = treffer[1].replace(/,\s*$/, "").trim();
    const stadt = treffer[3].replace(/^,\s*/, "").trim();

    if (strasse !== "" && stadt !== "") {
      return {
        "@type": "Place" as const,
        name: ort,
        address: {
          "@type": "PostalAddress",
          streetAddress: strasse,
          postalCode: treffer[2],
          addressLocality: stadt,
          addressCountry: "DE"
        }
      };
    }
  }

  return {
    "@type": "Place" as const,
    name: ort,
    address: { "@type": "PostalAddress", streetAddress: wert, addressCountry: "DE" }
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
