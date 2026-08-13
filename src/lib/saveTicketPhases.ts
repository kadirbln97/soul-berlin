import { prisma } from "./prisma";

export type TicketPhaseInput = {
  id?: string | null;
  label: string;
  priceCents: number;
  quantity?: number | null;
  untilTime?: string | null;
  isSoldOut?: boolean;
};

/**
 * Gleicht die Verkaufsphasen eines Events mit der Eingabe aus dem Admin ab.
 *
 * Anders als bei den Gästelisten-Staffeln wird hier bewusst NICHT alles
 * gelöscht und neu angelegt: an einer Phase hängen bereits verkaufte Tickets.
 * Ein Neuanlegen würde deren Zuordnung kappen, das Restkontingent
 * zurückspringen lassen und im schlimmsten Fall Tickets über das Kontingent
 * hinaus verkaufen. Deshalb: bestehende Phasen aktualisieren, wirklich
 * entfernte löschen (die Tickets bleiben dank onDelete: SetNull erhalten),
 * neue anlegen.
 */
export async function saveTicketPhases(eventId: string, phases: TicketPhaseInput[]) {
  const existing = await prisma.ticketPhase.findMany({
    where: { eventId },
    select: { id: true }
  });
  const existingIds = new Set(existing.map((p) => p.id));

  const keptIds = phases
    .map((p) => p.id)
    .filter((id): id is string => Boolean(id) && existingIds.has(id as string));

  const removedIds = existing.map((p) => p.id).filter((id) => !keptIds.includes(id));

  await prisma.$transaction([
    ...(removedIds.length > 0
      ? [prisma.ticketPhase.deleteMany({ where: { id: { in: removedIds } } })]
      : []),
    ...phases.map((phase, index) => {
      const data = {
        label: phase.label,
        priceCents: phase.priceCents,
        quantity: phase.quantity ?? null,
        untilTime: phase.untilTime ? new Date(phase.untilTime) : null,
        isSoldOut: phase.isSoldOut ?? false,
        order: index
      };

      return phase.id && existingIds.has(phase.id)
        ? prisma.ticketPhase.update({ where: { id: phase.id }, data })
        : prisma.ticketPhase.create({ data: { ...data, eventId } });
    })
  ]);
}
