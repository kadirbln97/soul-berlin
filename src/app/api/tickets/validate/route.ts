import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/authGuard";
import { verifyTicketToken } from "@/lib/ticketToken";
import { validateTokenSchema } from "@/lib/validation";
import { formatEventDate } from "@/lib/format";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

/**
 * Wird vom Scanner (Handy-Browser) nach jedem QR-Scan aufgerufen.
 * Nur für eingeloggte Admins/Türsteher erreichbar.
 */
export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  // Grober Schutz gegen automatisiertes Durchprobieren von Ticket-IDs,
  // selbst durch einen eingeloggten Account: max. 120 Scans/Minute.
  const ip = getClientIp(req);
  const rl = checkRateLimit(`validate:${ip}`, 120, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ result: "INVALID", message: "Zu viele Anfragen — kurz warten." });
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

  // Automatische Erkennung, auf welchem Weg das Ticket entstanden ist: eine
  // Stripe-Session-ID heißt "online per Ticketkauf bezahlt", sonst kommt es
  // von der Gästeliste (ggf. mit an der Tür fälligem Staffelpreis).
  const ticketType = ticket.stripeSessionId ? "PAID_ONLINE" : "GUESTLIST";

  if (ticket.status === "REFUNDED" || ticket.status === "CANCELLED") {
    return NextResponse.json({
      result: "REFUNDED",
      message: "Dieses Ticket wurde storniert/erstattet — kein Einlass.",
      guestName: ticket.name,
      eventTitle: ticket.event.title,
      tierLabel: ticket.tierLabel,
      ticketType,
      amountCents: ticket.amountCents,
      currency: ticket.currency
    });
  }

  if (ticket.status === "CHECKED_IN") {
    return NextResponse.json({
      result: "ALREADY_USED",
      message: `Bereits eingecheckt am ${
        ticket.checkedInAt ? formatEventDate(ticket.checkedInAt) : ""
      }.`,
      guestName: ticket.name,
      eventTitle: ticket.event.title,
      tierLabel: ticket.tierLabel,
      ticketType,
      amountCents: ticket.amountCents,
      currency: ticket.currency
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
    eventTitle: ticket.event.title,
    tierLabel: ticket.tierLabel,
    ticketType,
    amountCents: ticket.amountCents,
    currency: ticket.currency
  });
}
