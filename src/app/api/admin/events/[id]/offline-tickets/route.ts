import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/authGuard";

/**
 * Liefert alle Tickets eines Events zum lokalen Vorab-Download für den
 * Offline-Scan-Modus (siehe src/components/Scanner.tsx / scanner/page.tsx).
 * Die Türsteher-App speichert diese Liste im Browser (localStorage), bevor
 * sie ohne Internetverbindung weiterscannen kann. Es wird bewusst kein
 * QR-Token übertragen — der Scanner extrahiert die Ticket-ID direkt aus dem
 * gescannten Code und gleicht sie gegen diese Liste ab.
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

  const tickets = await prisma.ticket.findMany({
    where: { eventId: event.id },
    select: {
      id: true,
      name: true,
      status: true,
      tierLabel: true,
      checkedInAt: true,
      amountCents: true,
      currency: true,
      stripeSessionId: true
    }
  });

  // stripeSessionId selbst wird nicht mit rausgegeben (nicht nötig fürs
  // Scannen) — nur, ob eines gesetzt ist, um online bezahlte Tickets von
  // Gästeliste-Einträgen zu unterscheiden (siehe /api/tickets/validate).
  const ticketsForOffline = tickets.map(({ stripeSessionId, ...t }) => ({
    ...t,
    ticketType: stripeSessionId ? "PAID_ONLINE" : "GUESTLIST"
  }));

  return NextResponse.json({
    eventId: event.id,
    eventTitle: event.title,
    fetchedAt: new Date().toISOString(),
    tickets: ticketsForOffline
  });
}
