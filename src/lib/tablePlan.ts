import { z } from "zod";

/**
 * Klickbarer Tischplan mit WhatsApp-Reservierung (pro Event optional, siehe
 * Event.tablePlan in prisma/schema.prisma).
 *
 * Jeder Tisch trägt seine Klickfläche als Prozentwerte relativ zum
 * Grundriss-Bild (0–100). Prozent statt Pixel, damit die Fläche bei jeder
 * Bildschirmgröße an der richtigen Stelle sitzt — das Bild wird ja responsiv
 * skaliert, feste Pixelwerte würden bei jeder anderen Breite daneben liegen.
 */
export type TablePlanTable = {
  /** Anzeigename, i.d.R. die Tischnummer als Text ("1", "12", "VIP"). */
  id: string;
  capacity: number;
  minSpendCents: number;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type TablePlan = {
  imageUrl: string;
  /** E.164 ohne führendes "+", z.B. "4915772524610" — Format von wa.me. */
  whatsappNumber: string;
  tables: TablePlanTable[];
};

export const tablePlanTableSchema = z.object({
  id: z.string().trim().min(1, "Bitte eine Tischnummer angeben").max(20),
  capacity: z.coerce.number().int().min(1).max(50),
  minSpendCents: z.coerce.number().int().min(0).max(1_000_000),
  x: z.coerce.number().min(0).max(100),
  y: z.coerce.number().min(0).max(100),
  w: z.coerce.number().min(1).max(100),
  h: z.coerce.number().min(1).max(100)
});

export const tablePlanSchema = z.object({
  imageUrl: z.string().trim().min(1, "Bitte einen Grundriss hochladen"),
  whatsappNumber: z
    .string()
    .trim()
    .regex(
      /^[1-9]\d{6,14}$/,
      "Bitte als Ländervorwahl + Nummer ohne Plus oder führende Null angeben, z.B. 4915772524610"
    ),
  tables: z.array(tablePlanTableSchema).min(1, "Bitte mindestens einen Tisch anlegen").max(60)
});

function formatEuro(cents: number) {
  return (cents / 100).toLocaleString("de-DE", {
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  });
}

/**
 * Baut den fertigen wa.me-Link inkl. vorausgefüllter Reservierungsnachricht.
 * Der Gast landet direkt im Chat mit allen Angaben, die für die Reservierung
 * nötig sind — Kadir muss nur noch bestätigen statt erst nachzufragen.
 */
export function buildReservationWhatsAppUrl(params: {
  whatsappNumber: string;
  tableId: string;
  minSpendCents: number;
  eventTitle: string;
  eventDateLabel: string;
  firstName: string;
  lastName: string;
  partySize: number;
}) {
  const name = `${params.firstName} ${params.lastName}`.trim();
  const lines = [
    `Hallo! Ich möchte gerne Tisch ${params.tableId} reservieren.`,
    `Event: ${params.eventTitle} (${params.eventDateLabel})`,
    `Name: ${name}`,
    `Personen: ${params.partySize}`,
    `Mindestverzehr: ${formatEuro(params.minSpendCents)} €`
  ];
  const text = encodeURIComponent(lines.join("\n"));
  return `https://wa.me/${params.whatsappNumber}?text=${text}`;
}

export { formatEuro as formatTablePlanEuro };
