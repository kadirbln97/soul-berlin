export type GuestlistTierLike = {
  untilTime: Date | string;
  priceCents: number;
};

/**
 * Ermittelt den aktuell gültigen Gästeliste-Preis anhand der Zeit-Staffeln.
 * Staffeln sind aufsteigend nach untilTime sortiert (frühste zuerst). Die
 * erste Staffel, deren "gültig bis"-Zeitpunkt noch nicht erreicht ist, greift.
 * Ist die aktuelle Zeit später als alle Staffeln, gilt der Preis der letzten
 * (höchsten) Staffel als dauerhafter Abendkassenpreis.
 * Gibt null zurück, wenn keine Staffeln existieren (= weiterhin kostenlos).
 */
export function getCurrentGuestlistPrice(
  tiers: GuestlistTierLike[],
  now: Date = new Date()
): number | null {
  if (!tiers || tiers.length === 0) return null;

  const sorted = [...tiers].sort(
    (a, b) => new Date(a.untilTime).getTime() - new Date(b.untilTime).getTime()
  );

  for (const tier of sorted) {
    if (now.getTime() < new Date(tier.untilTime).getTime()) {
      return tier.priceCents;
    }
  }

  // Nach der letzten Staffel: letzter (höchster) Preis bleibt bestehen.
  return sorted[sorted.length - 1].priceCents;
}
