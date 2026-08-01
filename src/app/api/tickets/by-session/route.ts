import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Wird von der Success-Seite nach Stripe-Checkout gepollt, bis der Webhook
// das Ticket angelegt hat (meist < 2 Sekunden).
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "session_id fehlt" }, { status: 400 });
  }

  // Zu einer Bestellung können mehrere Tickets gehören (Mehrfachkauf), daher
  // findFirst statt findUnique. Die Anzahl wird mitgegeben, damit die
  // Success-Seite bei mehreren Tickets darauf hinweisen kann.
  const [ticket, ticketCount] = await Promise.all([
    prisma.ticket.findFirst({
      where: { stripeSessionId: sessionId },
      orderBy: { createdAt: "asc" },
      include: { event: true }
    }),
    prisma.ticket.count({ where: { stripeSessionId: sessionId } })
  ]);

  if (!ticket) {
    return NextResponse.json({ ready: false });
  }

  return NextResponse.json({
    ready: true,
    ticketCount,
    ticket: {
      id: ticket.id,
      name: ticket.name,
      email: ticket.email,
      eventTitle: ticket.event.title,
      eventSlug: ticket.event.slug,
      eventDateStart: ticket.event.dateStart,
      eventVenue: ticket.event.venue
    }
  });
}
