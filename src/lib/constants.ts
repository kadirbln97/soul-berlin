// Zentrale "Enum"-Werte (als Strings, weil SQLite echte Enums nicht unterstützt).

export const TICKET_MODES = ["PAID", "GUESTLIST"] as const;
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
