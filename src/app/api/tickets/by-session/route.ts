import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

// Wird von der Success-Seite nach Stripe-Checkout gepollt, bis der Webhook
// das Ticket angelegt hat (meist < 2 Sekunden).
export async function GET(req: Request) {
  // Diese Route ist öffentlich (die Success-Seite fragt sie direkt nach dem
  // Kauf ab) und gibt Name + E-Mail zur Bestellung zurück. Die Session-ID von
  // Stripe ist zwar praktisch nicht erratbar, ein Limit verhindert aber
  // systematisches Durchprobieren. Großzügig genug für das Polling (alle 1,5s
  // über maximal ~25 Sekunden).
  const ip = getClientIp(req);
  const rl = checkRateLimit(`ticket-by-session:${ip}`, 60, 10 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ ready: false }, { status: 429 });
  }

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
