import { prisma } from "./prisma";
import { resolveTicketPhases, type ResolvedPhase } from "./ticketPhases";

/**
 * Lädt die Verkaufsphasen eines Events samt der Zahl bereits verkaufter
 * Tickets je Phase und ordnet ihnen ihren Zustand zu.
 *
 * Bewusst eine gemeinsame Stelle für Event-Seite und Checkout: sonst könnten
 * Anzeige und tatsächlich kassierter Preis auseinanderlaufen.
 */
export async function loadResolvedPhases(eventId: string): Promise<ResolvedPhase[]> {
  const phases = await prisma.ticketPhase.findMany({
    where: { eventId },
    orderBy: { order: "asc" }
  });

  if (phases.length === 0) return [];

  // Stornierte/erstattete Tickets geben ihren Platz im Kontingent wieder frei.
  const grouped = await prisma.ticket.groupBy({
    by: ["phaseId"],
    where: {
      eventId,
      phaseId: { in: phases.map((p) => p.id) },
      status: { in: ["VALID", "CHECKED_IN"] }
    },
    _count: { _all: true }
  });

  const soldCounts: Record<string, number> = {};
  for (const row of grouped) {
    if (row.phaseId) soldCounts[row.phaseId] = row._count._all;
  }

  return resolveTicketPhases(phases, soldCounts);
}
