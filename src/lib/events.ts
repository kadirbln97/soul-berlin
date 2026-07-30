import { prisma } from "./prisma";
import { countActiveTickets } from "./createTicket";

export async function getUpcomingPublishedEvents(limit?: number) {
  const events = await prisma.event.findMany({
    where: { status: "PUBLISHED", dateStart: { gte: new Date(new Date().toDateString()) } },
    orderBy: { dateStart: "asc" },
    take: limit,
    include: { guestlistTiers: { orderBy: { untilTime: "asc" } } }
  });

  return Promise.all(
    events.map(async (event) => ({
      ...event,
      isSoldOut: event.capacity ? (await countActiveTickets(event.id)) >= event.capacity : false
    }))
  );
}

export async function getPastPublishedEvents(limit?: number) {
  return prisma.event.findMany({
    where: { status: "PUBLISHED", dateStart: { lt: new Date(new Date().toDateString()) } },
    orderBy: { dateStart: "desc" },
    take: limit
  });
}
