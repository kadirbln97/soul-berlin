import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { createTicketAndSendEmail } from "@/lib/createTicket";
import type Stripe from "stripe";

// Stripe braucht den rohen, unveränderten Body für die Signaturprüfung —
// Next.js darf ihn hier nicht vorher parsen.
export const runtime = "nodejs";

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook nicht konfiguriert" }, { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[stripe webhook] Signaturprüfung fehlgeschlagen:", err);
    return NextResponse.json({ error: "Ungültige Signatur" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const eventId = session.metadata?.eventId;
    const name = session.metadata?.name;
    const email = session.metadata?.email;
    const phone = session.metadata?.phone;

    if (!eventId || !name || !email) {
      console.error("[stripe webhook] Checkout-Session ohne erwartete Metadaten:", session.id);
      return NextResponse.json({ received: true });
    }

    // Idempotenz: Stripe kann Webhooks mehrfach zustellen.
    const existing = await prisma.ticket.findUnique({
      where: { stripeSessionId: session.id }
    });
    if (existing) {
      return NextResponse.json({ received: true });
    }

    const dbEvent = await prisma.event.findUnique({ where: { id: eventId } });
    if (!dbEvent) {
      console.error("[stripe webhook] Event nicht gefunden für Session:", session.id);
      return NextResponse.json({ received: true });
    }

    await createTicketAndSendEmail({
      event: dbEvent,
      name,
      email,
      phone: phone || null,
      amountCents: session.amount_total ?? dbEvent.priceCents,
      stripeSessionId: session.id,
      stripePaymentIntentId:
        typeof session.payment_intent === "string" ? session.payment_intent : null
    });
  }

  return NextResponse.json({ received: true });
}
