import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/authGuard";

/**
 * Liefert Check-in-Statistiken für ein Event: Gesamtzahl + wie viele bereits
 * eingecheckt sind, aufgeschlüsselt nach Preisstaffel-Kategorie (Early Bird,
 * Regular, ...). Wird vom Scanner für die Live-Statusanzeige gepollt.
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const event = await prisma.event.findUnique({ where: { id: params.id } });
  if (!event) {
    return NextResponse.json({ error: "Event nicht gefunden" }, { status: 404 });
  }

  // Nur gültige/eingecheckte Tickets zählen — stornierte/erstattete raus.
  const tickets = await prisma.ticket.findMany({
    where: { eventId: event.id, status: { in: ["VALID", "CHECKED_IN"] } },
    select: { status: true, tierLabel: true }
  });

  const total = tickets.length;
  const checkedIn = tickets.filter((t) => t.status === "CHECKED_IN").length;

  const byTierMap = new Map<string, { label: string; total: number; checkedIn: number }>();
  for (const t of tickets) {
    const key = t.tierLabel ?? "__none__";
    const label = t.tierLabel ?? "Ohne Kategorie";
    if (!byTierMap.has(key)) {
      byTierMap.set(key, { label, total: 0, checkedIn: 0 });
    }
    const entry = byTierMap.get(key)!;
    entry.total += 1;
    if (t.status === "CHECKED_IN") entry.checkedIn += 1;
  }

  return NextResponse.json({
    eventId: event.id,
    eventTitle: event.title,
    total,
    checkedIn,
    byTier: Array.from(byTierMap.values()).sort((a, b) => a.label.localeCompare(b.label, "de"))
  });
}
