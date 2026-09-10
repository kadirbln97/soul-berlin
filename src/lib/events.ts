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

/**
 * Ticketshop-Link des nächsten anstehenden Events — für den schwebenden
 * Ticket-Knopf, der auf jeder Seite außer der Event-Detailseite liegt.
 *
 * Bewusst eine eigene, schmale Abfrage statt getUpcomingPublishedEvents():
 * die läuft für jedes Event zusätzlich über Phasen und Ticketzählungen, und
 * das Layout rendert auf wirklich jeder Seite. Hier reichen vier Felder.
 */
export async function getNextExternalTicketLink() {
  // Läuft im Root-Layout, also auf jeder Seite. Ein Datenbankfehler darf hier
  // nicht die ganze Seite reißen — dann fehlt eben der Ticket-Knopf.
  try {
    const event = await prisma.event.findFirst({
      where: {
        status: "PUBLISHED",
        dateStart: { gte: new Date(new Date().toDateString()) },
        externalTicketUrl: { not: null },
        NOT: { externalTicketUrl: "" }
      },
      orderBy: { dateStart: "asc" },
      select: { id: true, title: true, externalTicketUrl: true }
    });

    const url = event?.externalTicketUrl?.trim();
    if (!event || !url) return null;

    return { eventId: event.id, title: event.title, url };
  } catch (err) {
    console.error("[getNextExternalTicketLink] Datenbank nicht erreichbar:", err);
    return null;
  }
}

export async function getPastPublishedEvents(limit?: number) {
  return prisma.event.findMany({
    where: { status: "PUBLISHED", dateStart: { lt: new Date(new Date().toDateString()) } },
    orderBy: { dateStart: "desc" },
    take: limit
  });
}
