// Zentrale "Enum"-Werte (als Strings, weil SQLite echte Enums nicht unterstützt).

// "BOTH" bietet Ticketkauf UND Gästeliste parallel an — der Gast wählt auf
// der Event-Seite selbst, welche Option er nutzen möchte.
// "EXTERNAL" heißt: der Verkauf läuft komplett über einen Fremdanbieter
// (z.B. Eventbrite). Auf der Seite steht dann nur der Knopf dorthin — weder
// Gästeliste noch eigener Ticketkauf. Der Link dafür steht am Event unter
// externalTicketUrl; ohne Link ergibt dieser Modus keinen Sinn und wird
// beim Speichern abgelehnt.
export const TICKET_MODES = ["PAID", "GUESTLIST", "BOTH", "EXTERNAL"] as const;
export type TicketMode = (typeof TICKET_MODES)[number];

export const EVENT_STATUS = ["DRAFT", "PUBLISHED"] as const;
export type EventStatus = (typeof EVENT_STATUS)[number];

export const TICKET_STATUS = [
  "VALID",
  "CHECKED_IN",
  "REFUNDED",
  "CANCELLED"
] as const;
export type TicketStatus = (typeof TICKET_STATUS)[number];

export const CURRENCY = "eur";
