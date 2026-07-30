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

  const ticket = await prisma.ticket.findUnique({
    where: { stripeSessionId: sessionId },
    include: { event: true }
  });

  if (!ticket) {
    return NextResponse.json({ ready: false });
  }

  return NextResponse.json({
    ready: true,
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
