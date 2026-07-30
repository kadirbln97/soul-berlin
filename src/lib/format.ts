export function formatEventDate(date: Date | string): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(d);
}

export function formatShortDate(date: Date | string): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit"
  }).format(d);
}

export function formatPrice(cents: number, currency = "eur"): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: currency.toUpperCase()
  }).format(cents / 100);
}
