/** Höchstzahl an Verkaufsphasen pro Event — hält die Event-Seite übersichtlich. */
export const MAX_TICKET_PHASES = 5;

export type TicketPhaseLike = {
  id: string;
  label: string;
  priceCents: number;
  /** Kontingent der Phase; null = unbegrenzt. */
  quantity: number | null;
  /** Automatisches Ende der Phase; null = kein Zeitlimit. */
  untilTime: Date | string | null;
  /** Im Admin von Hand auf ausverkauft gesetzt. */
  isSoldOut: boolean;
  order: number;
};

/**
 * Warum eine Phase geschlossen ist — bestimmt, was auf der Event-Seite steht.
 * "SOLD_OUT" deckt sowohl das aufgebrauchte Kontingent als auch den manuellen
 * Schalter ab: für Gäste ist das dieselbe Aussage, nur der Grund im Admin
 * unterscheidet sich.
 */
export type PhaseStatus = "ACTIVE" | "SOLD_OUT" | "EXPIRED" | "UPCOMING";

export type ResolvedPhase<T extends TicketPhaseLike = TicketPhaseLike> = T & {
  status: PhaseStatus;
  /** Bereits verkaufte Tickets dieser Phase. */
  soldCount: number;
  /** Wie viele noch gehen; null bei unbegrenztem Kontingent. */
  remaining: number | null;
};

function isExpired(phase: TicketPhaseLike, now: Date) {
  return phase.untilTime !== null && now.getTime() >= new Date(phase.untilTime).getTime();
}

function isExhausted(phase: TicketPhaseLike, soldCount: number) {
  return phase.quantity !== null && soldCount >= phase.quantity;
}

/**
 * Ordnet jeder Phase ihren Zustand zu.
 *
 * Die Phasen laufen streng nacheinander: aktiv ist die erste Phase, die weder
 * ausverkauft (Kontingent oder manueller Schalter) noch zeitlich vorbei ist.
 * Alles danach ist "UPCOMING" — auch wenn dessen Zeitfenster theoretisch schon
 * offen wäre. Sonst könnten zwei Phasen gleichzeitig gelten und es wäre nicht
 * mehr eindeutig, welcher Preis kassiert wird.
 *
 * @param soldCounts Verkaufte Tickets je Phasen-Id.
 */
export function resolveTicketPhases<T extends TicketPhaseLike>(
  phases: T[],
  soldCounts: Record<string, number> = {},
  now: Date = new Date()
): ResolvedPhase<T>[] {
  const sorted = [...phases].sort((a, b) => a.order - b.order);
  let activeFound = false;

  return sorted.map((phase) => {
    const soldCount = soldCounts[phase.id] ?? 0;
    const remaining =
      phase.quantity === null ? null : Math.max(0, phase.quantity - soldCount);

    let status: PhaseStatus;
    if (phase.isSoldOut || isExhausted(phase, soldCount)) {
      status = "SOLD_OUT";
    } else if (isExpired(phase, now)) {
      status = "EXPIRED";
    } else if (!activeFound) {
      status = "ACTIVE";
      activeFound = true;
    } else {
      status = "UPCOMING";
    }

    return { ...phase, status, soldCount, remaining };
  });
}

/** Die Phase, zu deren Preis gerade verkauft wird — oder null, wenn keine offen ist. */
export function getActivePhase<T extends TicketPhaseLike>(
  phases: T[],
  soldCounts: Record<string, number> = {},
  now: Date = new Date()
): ResolvedPhase<T> | null {
  return resolveTicketPhases(phases, soldCounts, now).find((p) => p.status === "ACTIVE") ?? null;
}

/**
 * Sind alle Phasen durch? Nur dann ist das Event über die Phasen ausverkauft.
 * Bei Events ohne Phasen greift weiterhin die alte Kapazitätslogik, deshalb
 * hier bewusst false.
 */
export function allPhasesClosed(phases: TicketPhaseLike[], soldCounts: Record<string, number> = {}, now: Date = new Date()) {
  if (phases.length === 0) return false;
  return getActivePhase(phases, soldCounts, now) === null;
}

/**
 * Der Preis, zu dem gerade verkauft werden darf: Preis der aktiven Phase,
 * bei Events ohne Phasen der Einzelpreis des Events.
 *
 * Gibt bewusst null zurück, wenn Phasen existieren, aber keine mehr offen ist —
 * dann darf nichts verkauft werden. Ein Rückfall auf Event.priceCents wäre
 * hier gefährlich: der Checkout würde zum alten Preis weiterverkaufen, obwohl
 * das Event über die Phasen längst ausverkauft ist.
 */
export function getEffectivePriceCents(
  phases: TicketPhaseLike[],
  fallbackPriceCents: number | null,
  soldCounts: Record<string, number> = {},
  now: Date = new Date()
): number | null {
  if (phases.length === 0) return fallbackPriceCents;
  const active = getActivePhase(phases, soldCounts, now);
  return active ? active.priceCents : null;
}
