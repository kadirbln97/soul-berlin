import { z } from "zod";
import { TICKET_MODES, EVENT_STATUS } from "./constants";
import { MAX_TICKET_PHASES } from "./ticketPhases";

export const MAX_TICKETS_PER_ORDER = 5;

export const signupSchema = z.object({
  eventId: z.string().min(1),
  name: z.string().trim().min(2, "Bitte vollständigen Namen angeben").max(100),
  email: z.string().trim().email("Bitte gültige E-Mail angeben"),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  // Anzahl Tickets pro Bestellung (nur beim Ticketkauf relevant).
  quantity: z.coerce.number().int().min(1).max(MAX_TICKETS_PER_ORDER).optional(),
  // Optional eingegebener Gutscheincode.
  discountCode: z.string().trim().max(40).optional().or(z.literal("")),
  // Freiwillige Einwilligung in Event-Ankündigungen (nur Gästeliste).
  // Fehlt das Feld, gilt bewusst false — keine Einwilligung durch Schweigen.
  newsletter: z.boolean().optional()
});

export const discountSchema = z
  .object({
    // Leer lassen = Rabatt gilt automatisch für alle, ohne Code.
    code: z.string().trim().max(40).optional().or(z.literal("")),
    type: z.enum(["PERCENT", "FIXED", "BOGO"]),
    // Prozent (1–100) bzw. Betrag in Euro — wird im Backend in Cent umgerechnet.
    value: z.coerce.number().min(0).max(100_000),
    label: z.string().trim().max(60).optional().or(z.literal("")),
    active: z.boolean().optional(),
    maxUses: z.coerce.number().int().min(1).max(100_000).optional().nullable()
  })
  .refine((d) => d.type !== "PERCENT" || (d.value >= 1 && d.value <= 100), {
    message: "Prozentwert muss zwischen 1 und 100 liegen",
    path: ["value"]
  })
  .refine((d) => d.type !== "FIXED" || d.value > 0, {
    message: "Bitte einen Rabattbetrag größer als 0 angeben",
    path: ["value"]
  });

export const manualGuestsSchema = z.object({
  // Ein Name pro Zeile — so lassen sich Promoter-Listen direkt einfügen.
  names: z.string().trim().min(1, "Bitte mindestens einen Namen eingeben").max(20_000),
  promoterName: z.string().trim().max(80).optional().or(z.literal("")),
  tierLabel: z.string().trim().max(60).optional().or(z.literal(""))
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1)
});

export const guestlistTierSchema = z.object({
  untilTime: z.string().min(1),
  // Obergrenze 5.000 € — verhindert Tippfehler mit absurden Beträgen.
  priceCents: z.coerce.number().int().min(0).max(500_000),
  // Optionaler Name der Staffel (z.B. "Early Bird") für die Check-in-Statistik.
  label: z.string().trim().max(60).optional().nullable()
});

/**
 * Eine Verkaufsphase für bezahlte Online-Tickets. Die id wird bei bestehenden
 * Phasen mitgeschickt, damit sie beim Speichern aktualisiert statt neu
 * angelegt werden — sonst verlören die bereits verkauften Tickets ihre
 * Zuordnung und das Restkontingent würde zurückspringen.
 */
export const ticketPhaseSchema = z.object({
  id: z.string().trim().max(40).optional().nullable(),
  label: z.string().trim().min(1, "Bitte der Phase einen Namen geben").max(60),
  priceCents: z.coerce.number().int().min(0).max(500_000),
  // Null = unbegrenztes Kontingent (Phase endet dann über Zeit oder von Hand).
  quantity: z.coerce.number().int().min(1).max(20_000).optional().nullable(),
  // Leer = kein Zeitlimit.
  untilTime: z.string().optional().nullable(),
  // Manuell vorzeitig auf ausverkauft setzen.
  isSoldOut: z.boolean().optional()
});

/**
 * Adresse eines externen Ticketshops.
 *
 * Bewusst nicht nur z.string().url(): dessen Prüfung lässt auch
 * "javascript:..." durch, weil das eine formal gültige URL ist. Ein solcher
 * Wert würde später in ein href geschrieben und beim Klick Code im Browser
 * des Gasts ausführen. Deshalb hier ausdrücklich nur http und https.
 */
const externalUrlSchema = z
  .string()
  .trim()
  .max(500)
  .refine(
    (wert) => {
      if (wert === "") return true;
      try {
        const u = new URL(wert);
        return u.protocol === "http:" || u.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "Bitte eine vollständige Adresse angeben, die mit https:// beginnt." }
  );

export const eventSchema = z.object({
  title: z.string().trim().min(2).max(120),
  subtitle: z.string().trim().max(160).optional().or(z.literal("")),
  description: z.string().trim().min(1).max(5000),
  // Optionale englische Fassung — leer lassen heißt: deutscher Text wird auch
  // auf der englischen Seite angezeigt.
  titleEn: z.string().trim().max(120).optional().or(z.literal("")),
  subtitleEn: z.string().trim().max(160).optional().or(z.literal("")),
  descriptionEn: z.string().trim().max(5000).optional().or(z.literal("")),
  venue: z.string().trim().min(1).max(160),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  imageUrl: z.string().trim().max(500).optional().or(z.literal("")),
  // Kennzeichnung KI-generierter Bilder (Art. 50 KI-VO, seit 02.08.2026).
  imageIsAi: z.boolean().optional(),
  dateStart: z.string().min(1),
  dateEnd: z.string().optional().or(z.literal("")),
  ticketMode: z.enum(TICKET_MODES),
  // Obergrenze 5.000 € pro Ticket / 20.000 Plätze — verhindert Tippfehler mit
  // absurden Beträgen und dient als grobe Plausibilitätsprüfung.
  priceCents: z.coerce.number().int().min(0).max(500_000).optional(),
  capacity: z.coerce.number().int().min(1).max(20_000).optional(),
  // Optionaler Verkaufsschluss (Gästeliste/Tickets) — wird auf der
  // Event-Seite als Countdown angezeigt und von den Anmelde-APIs durchgesetzt.
  ticketSalesEndAt: z.string().optional().or(z.literal("")),
  status: z.enum(EVENT_STATUS),
  // Bis zu 3 zeitbasierte Preis-Staffeln für die Gästeliste (informativ,
  // Zahlung an der Abendkasse — nur relevant bei ticketMode = GUESTLIST).
  guestlistTiers: z.array(guestlistTierSchema).max(3).optional(),
  // Verkaufsphasen für bezahlte Online-Tickets (nur bei ticketMode PAID/BOTH).
  ticketPhases: z.array(ticketPhaseSchema).max(MAX_TICKET_PHASES).optional(),
  // Optionaler Link zu einem externen Ticketshop (Eventbrite o.Ä.).
  externalTicketUrl: externalUrlSchema.optional().or(z.literal("")),
  externalTicketLabel: z.string().trim().max(40).optional().or(z.literal(""))
})
  .refine(
    // Ohne Link hätte "nur extern" keine einzige Kaufmöglichkeit — die
    // Event-Seite wäre dann eine Sackgasse.
    (d) => d.ticketMode !== "EXTERNAL" || Boolean(d.externalTicketUrl?.trim()),
    {
      message:
        "Bei „Nur externer Anbieter“ muss ein Link zum Ticketshop angegeben werden.",
      path: ["externalTicketUrl"]
    }
  );

export const galleryItemSchema = z.object({
  type: z.enum(["PHOTO", "VIDEO"]),
  url: z.string().trim().min(1),
  posterUrl: z.string().trim().optional().or(z.literal("")),
  label: z.string().trim().max(120).optional().or(z.literal("")),
  // Kennzeichnung KI-generierter Medien (Art. 50 KI-VO).
  isAi: z.boolean().optional()
});

/** Nachträgliches Umschalten der KI-Kennzeichnung einer Galerie-Kachel. */
export const galleryUpdateSchema = z.object({
  isAi: z.boolean()
});

export const galleryReorderSchema = z.object({
  // Vollständige Liste aller Galerie-IDs in der gewünschten neuen Reihenfolge.
  ids: z.array(z.string().min(1)).min(1)
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Bitte vollständigen Namen angeben").max(100),
  email: z.string().trim().email("Bitte gültige E-Mail angeben"),
  // Grobe Themen-Einordnung fürs Admin-Postfach.
  topic: z.enum(["general", "bug", "feature", "refund"]).default("general"),
  message: z.string().trim().min(10, "Bitte etwas ausführlicher beschreiben").max(2000),
  // Nur bei topic = "refund" relevant: hilft, das Ticket schnell zu finden.
  ticketRef: z.string().trim().max(200).optional().or(z.literal("")),
  eventName: z.string().trim().max(200).optional().or(z.literal(""))
});

export const validateTokenSchema = z.object({
  token: z.string().min(1)
});

// Batch von offline gescannten Tickets, die nach Rückkehr der Internetverbindung
// mit dem Server abgeglichen werden (siehe scanner/page.tsx Offline-Modus).
export const offlineSyncSchema = z.object({
  scans: z
    .array(
      z.object({
        ticketId: z.string().min(1),
        scannedAt: z.string().min(1)
      })
    )
    .min(1)
    .max(500)
});
