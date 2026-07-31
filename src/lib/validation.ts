import { z } from "zod";
import { TICKET_MODES, EVENT_STATUS } from "./constants";

export const signupSchema = z.object({
  eventId: z.string().min(1),
  name: z.string().trim().min(2, "Bitte vollständigen Namen angeben").max(100),
  email: z.string().trim().email("Bitte gültige E-Mail angeben"),
  phone: z.string().trim().max(30).optional().or(z.literal(""))
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

export const eventSchema = z.object({
  title: z.string().trim().min(2).max(120),
  subtitle: z.string().trim().max(160).optional().or(z.literal("")),
  description: z.string().trim().min(1).max(5000),
  venue: z.string().trim().min(1).max(160),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  imageUrl: z.string().trim().max(500).optional().or(z.literal("")),
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
  guestlistTiers: z.array(guestlistTierSchema).max(3).optional()
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
