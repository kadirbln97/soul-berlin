import { prisma } from "./prisma";
import { countActiveTickets } from "./createTicket";
import { loadResolvedPhases } from "./loadTicketPhases";

export async function getUpcomingPublishedEvents(limit?: number) {
  const events = await prisma.event.findMany({
    where: { status: "PUBLISHED", dateStart: { gte: new Date(new Date().toDateString()) } },
    orderBy: { dateStart: "asc" },
    take: limit,
    include: { guestlistTiers: { orderBy: { untilTime: "asc" } } }
  });

  return Promise.all(
    events.map(async (event) => {
      const [activeCount, phases] = await Promise.all([
        event.capacity ? countActiveTickets(event.id) : Promise.resolve(0),
        loadResolvedPhases(event.id)
      ]);

      const activePhase = phases.find((p) => p.status === "ACTIVE") ?? null;
      // Über die Phasen ausverkauft zählt genauso als ausverkauft wie ein
      // erreichtes Kapazitätslimit — sonst zeigt die Karte weiter einen Preis
      // an, obwohl online nichts mehr zu holen ist.
      const phasesSoldOut = phases.length > 0 && activePhase === null;

      return {
        ...event,
        // Karte zeigt den Preis, der beim Klick tatsächlich gilt.
        priceCents: activePhase ? activePhase.priceCents : event.priceCents,
        isSoldOut:
          phasesSoldOut || (event.capacity ? activeCount >= event.capacity : false)
      };
    })
  );
}

export async function getPastPublishedEvents(limit?: number) {
  return prisma.event.findMany({
    where: { status: "PUBLISHED", dateStart: { lt: new Date(new Date().toDateString()) } },
    orderBy: { dateStart: "desc" },
    take: limit
  });
}
