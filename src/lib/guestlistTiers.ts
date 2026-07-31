export type GuestlistTierLike = {
  untilTime: Date | string;
  priceCents: number;
  label?: string | null;
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

/**
 * Wie getCurrentGuestlistPrice, gibt aber die ganze aktuell gültige Staffel
 * zurück (für die Check-in-Statistik pro Kategorie im Scanner). Fällt auf
 * einen generischen Namen ("Staffel 1", "Staffel 2", ...) zurück, wenn die
 * Staffel keinen eigenen Namen (label) hat.
 */
export function getCurrentGuestlistTier<T extends GuestlistTierLike>(
  tiers: T[],
  now: Date = new Date()
): (T & { resolvedLabel: string }) | null {
  if (!tiers || tiers.length === 0) return null;

  const sorted = [...tiers].sort(
    (a, b) => new Date(a.untilTime).getTime() - new Date(b.untilTime).getTime()
  );

  const withLabel = (tier: T, index: number) => ({
    ...tier,
    resolvedLabel: tier.label && tier.label.trim() ? tier.label.trim() : `Staffel ${index + 1}`
  });

  for (let i = 0; i < sorted.length; i++) {
    if (now.getTime() < new Date(sorted[i].untilTime).getTime()) {
      return withLabel(sorted[i], i);
    }
  }

  // Nach der letzten Staffel: letzte Staffel bleibt als Endpreis-Kategorie gültig.
  return withLabel(sorted[sorted.length - 1], sorted.length - 1);
}
