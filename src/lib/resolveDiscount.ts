import { prisma } from "./prisma";
import type { DiscountRule, DiscountType } from "./discount";

export type ResolvedDiscount = {
  id: string;
  rule: DiscountRule;
  /** true, wenn der Rabatt ohne Code für alle gilt. */
  automatic: boolean;
};

type DiscountRow = {
  id: string;
  code: string | null;
  type: string;
  value: number;
  label: string | null;
  active: boolean;
  maxUses: number | null;
  usedCount: number;
};

function isUsable(d: DiscountRow) {
  if (!d.active) return false;
  if (d.maxUses !== null && d.usedCount >= d.maxUses) return false;
  return true;
}

function toResolved(d: DiscountRow): ResolvedDiscount {
  return {
    id: d.id,
    automatic: !d.code,
    rule: {
      type: d.type as DiscountType,
      value: d.value,
      code: d.code,
      label: d.label
    }
  };
}

/**
 * Ermittelt den anzuwendenden Rabatt für ein Event.
 *
 * Ein eingegebener Gutscheincode hat Vorrang vor einem automatischen Rabatt —
 * beide werden nie kombiniert, damit der Preis nachvollziehbar bleibt.
 * Wird ein Code eingegeben, der nicht passt, wird das über `codeInvalid`
 * gemeldet, statt still auf den Automatik-Rabatt zurückzufallen.
 */
export async function resolveDiscount(
  eventId: string,
  enteredCode?: string | null
): Promise<{ discount: ResolvedDiscount | null; codeInvalid: boolean }> {
  let rows: DiscountRow[] = [];
  try {
    rows = await prisma.discount.findMany({ where: { eventId } });
  } catch {
    // Tabelle noch nicht vorhanden o.Ä. — dann gibt es eben keine Rabatte.
    return { discount: null, codeInvalid: false };
  }

  const usable = rows.filter(isUsable);
  const trimmed = (enteredCode ?? "").trim();

  if (trimmed) {
    const match = usable.find(
      (d) => d.code && d.code.toLowerCase() === trimmed.toLowerCase()
    );
    if (!match) return { discount: null, codeInvalid: true };
    return { discount: toResolved(match), codeInvalid: false };
  }

  const automatic = usable.find((d) => !d.code);
  return { discount: automatic ? toResolved(automatic) : null, codeInvalid: false };
}
