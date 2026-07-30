import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { signupSchema } from "@/lib/validation";
import { countActiveTickets } from "@/lib/createTicket";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(req: Request) {
  // Schutz vor Checkout-Session-Spam: max. 10 Versuche pro 10 Minuten pro IP.
  const ip = getClientIp(req);
  const rl = checkRateLimit(`checkout:${ip}`, 10, 10 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Zu viele Versuche. Bitte in ein paar Minuten erneut versuchen." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" },
      { status: 400 }
    );
  }

  const { eventId, name, email, phone } = parsed.data;

  const event = await prisma.event.findUnique({ where: { id: eventId } });

  if (!event || event.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Event nicht gefunden" }, { status: 404 });
  }

  if (event.ticketMode !== "PAID" || !event.priceCents) {
    return NextResponse.json(
      { error: "Dieses Event läuft über die kostenlose Gästeliste, nicht über Ticketkauf." },
      { status: 400 }
    );
  }

  if (event.capacity) {
    const active = await countActiveTickets(event.id);
    if (active >= event.capacity) {
      return NextResponse.json({ error: "Dieses Event ist leider ausverkauft." }, { status: 409 });
    }
  }

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: event.currency,
          unit_amount: event.priceCents,
          product_data: {
            name: event.title,
            description: event.venue
          }
        }
      }
    ],
    metadata: {
      eventId: event.id,
      name,
      email: email.toLowerCase(),
      phone: phone ?? ""
    },
    success_url: `${appUrl}/events/${event.slug}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/events/${event.slug}`
  });

  if (!session.url) {
    return NextResponse.json({ error: "Stripe-Checkout konnte nicht erstellt werden." }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
