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
  status: z.enum(EVENT_STATUS)
});

export const validateTokenSchema = z.object({
  token: z.string().min(1)
});
