import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/authGuard";
import { verifyTicketToken } from "@/lib/ticketToken";
import { validateTokenSchema } from "@/lib/validation";
import { formatEventDate } from "@/lib/format";

/**
 * Wird vom Scanner (Handy-Browser) nach jedem QR-Scan aufgerufen.
 * Nur für eingeloggte Admins/Türsteher erreichbar.
 */
export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = validateTokenSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ result: "INVALID", message: "QR-Code konnte nicht gelesen werden." });
  }

  const { valid, ticketId } = verifyTicketToken(parsed.data.token);

  if (!valid || !ticketId) {
    return NextResponse.json({ result: "INVALID", message: "Ungültiger oder gefälschter QR-Code." });
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { event: true }
  });

  if (!ticket) {
    return NextResponse.json({ result: "INVALID", message: "Ticket nicht gefunden." });
  }

  if (ticket.status === "REFUNDED" || ticket.status === "CANCELLED") {
    return NextResponse.json({
      result: "REFUNDED",
      message: "Dieses Ticket wurde storniert/erstattet — kein Einlass.",
      guestName: ticket.name,
      eventTitle: ticket.event.title
    });
  }

  if (ticket.status === "CHECKED_IN") {
    return NextResponse.json({
      result: "ALREADY_USED",
      message: `Bereits eingecheckt am ${
        ticket.checkedInAt ? formatEventDate(ticket.checkedInAt) : ""
      }.`,
      guestName: ticket.name,
      eventTitle: ticket.event.title
    });
  }

  await prisma.ticket.update({
    where: { id: ticket.id },
    data: {
      status: "CHECKED_IN",
      checkedInAt: new Date(),
      checkedInBy: session.email
    }
  });

  return NextResponse.json({
    result: "VALID",
    message: "Willkommen! Einlass gewährt.",
    guestName: ticket.name,
    eventTitle: ticket.event.title
  });
}
