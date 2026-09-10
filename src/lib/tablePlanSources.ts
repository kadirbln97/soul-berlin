import { prisma } from "./prisma";
import { tablePlanSchema } from "./tablePlan";

/**
 * Events, deren Tischplan sich in ein anderes Event übernehmen lässt —
 * die jüngsten zuerst. Gleiche Location, gleicher Plan: statt alles neu zu
 * zeichnen, einmal auswählen.
 */
export async function getTablePlanSources(excludeEventId?: string) {
  const events = await prisma.event.findMany({
    where: excludeEventId ? { id: { not: excludeEventId } } : undefined,
    orderBy: { dateStart: "desc" },
    take: 60,
    select: { id: true, title: true, dateStart: true, tablePlan: true }
  });

  const fmt = new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Berlin"
  });

  return events
    .filter((e) => tablePlanSchema.safeParse(e.tablePlan).success)
    .slice(0, 20)
    .map((e) => ({ id: e.id, title: e.title, dateLabel: fmt.format(e.dateStart) }));
}
