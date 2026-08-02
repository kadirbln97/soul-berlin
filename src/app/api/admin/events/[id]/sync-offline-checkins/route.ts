import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/authGuard";
import { offlineSyncSchema } from "@/lib/validation";

/**
 * Nimmt einen Batch von Tickets entgegen, die der Scanner offline (ohne
 * Internetverbindung) als eingecheckt markiert hat, und schreibt sie jetzt
 * in die Datenbank. Läuft automatisch, sobald das Gerät wieder online ist.
 *
 * Wichtig: Wenn ein Ticket zwischenzeitlich schon von einem anderen Gerät
 * eingecheckt wurde (z.B. zwei Scanner-Handys gleichzeitig im Einsatz),
 * wird der ursprüngliche Check-in nicht überschrieben — das Ticket wird als
 * "ALREADY_USED" zurückgemeldet, damit die Tür-Crew das im Zweifel manuell
 * prüfen kann.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) {
    return NextResponse.json({ error: "Event nicht gefunden" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = offlineSyncSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" },
      { status: 400 }
    );
  }

  const results: Array<{
    ticketId: string;
    result: "SYNCED" | "ALREADY_USED" | "REFUNDED" | "NOT_FOUND";
    guestName?: string;
  }> = [];

  for (const scan of parsed.data.scans) {
    const ticket = await prisma.ticket.findFirst({
      where: { id: scan.ticketId, eventId: event.id }
    });

    if (!ticket) {
      results.push({ ticketId: scan.ticketId, result: "NOT_FOUND" });
      continue;
    }

    if (ticket.status === "REFUNDED" || ticket.status === "CANCELLED") {
      results.push({ ticketId: scan.ticketId, result: "REFUNDED", guestName: ticket.name });
      continue;
    }

    if (ticket.status === "CHECKED_IN") {
      results.push({ ticketId: scan.ticketId, result: "ALREADY_USED", guestName: ticket.name });
      continue;
    }

    const scannedAt = new Date(scan.scannedAt);
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: "CHECKED_IN",
        checkedInAt: isNaN(scannedAt.getTime()) ? new Date() : scannedAt,
        checkedInBy: `${session.email} (offline)`
      }
    });

    results.push({ ticketId: scan.ticketId, result: "SYNCED", guestName: ticket.name });
  }

  return NextResponse.json({ ok: true, results });
}
