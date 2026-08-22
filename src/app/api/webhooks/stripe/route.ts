import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { createTicketAndSendEmail } from "@/lib/createTicket";
import { bestandskundeErfassen } from "@/lib/newsletter";
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

    // Idempotenz: Stripe kann Webhooks mehrfach zustellen. Da zu einer
    // Bestellung mehrere Tickets gehören können, wird auf Vorhandensein
    // geprüft statt auf einen eindeutigen Datensatz.
    const existing = await prisma.ticket.count({
      where: { stripeSessionId: session.id }
    });
    if (existing > 0) {
      return NextResponse.json({ received: true });
    }

    const dbEvent = await prisma.event.findUnique({ where: { id: eventId } });
    if (!dbEvent) {
      console.error("[stripe webhook] Event nicht gefunden für Session:", session.id);
      return NextResponse.json({ received: true });
    }

    // Der von Stripe kassierte Gesamtbetrag enthält die Servicegebühr. Für die
    // Auswertung wird beides getrennt gespeichert: amountCents = reiner
    // Ticketpreis, feeCents = Gebühr. Die Gebühr kommt aus den Metadaten der
    // Session, damit auch spätere Änderungen an der Formel alte Käufe nicht
    // rückwirkend verfälschen.
    const feeCents = Number(session.metadata?.feeCents ?? 0) || 0;
    const quantity = Math.max(1, Number(session.metadata?.quantity ?? 1) || 1);
    const discountCents = Number(session.metadata?.discountCents ?? 0) || 0;
    const discountId = session.metadata?.discountId || null;
    const discountCode = session.metadata?.discountCode || null;

    const totalCents = session.amount_total ?? null;
    const ticketsTotalCents =
      totalCents !== null
        ? Math.max(0, totalCents - feeCents)
        : (dbEvent.priceCents ?? 0) * quantity;

    // Beträge gleichmäßig auf die einzelnen Tickets verteilen; der Rest landet
    // auf dem ersten Ticket, damit die Summe exakt dem Gezahlten entspricht.
    const perTicket = (total: number, index: number) => {
      const base = Math.floor(total / quantity);
      return index === 0 ? base + (total - base * quantity) : base;
    };

    for (let i = 0; i < quantity; i++) {
      await createTicketAndSendEmail({
        event: dbEvent,
        name,
        email,
        phone: phone || null,
        amountCents: perTicket(ticketsTotalCents, i),
        feeCents: perTicket(feeCents, i),
        discountCents: discountCents > 0 ? perTicket(discountCents, i) : null,
        discountCode,
        // Phase und ihr Name kommen aus den Metadaten der Checkout-Session,
        // die serverseitig gesetzt wurden. tierLabel bleibt als Snapshot
        // erhalten, falls die Phase später umbenannt oder gelöscht wird.
        phaseId: session.metadata?.phaseId || null,
        tierLabel: session.metadata?.phaseLabel || null,
        locale: session.metadata?.locale || undefined,
        stripeSessionId: session.id,
        stripePaymentIntentId:
          typeof session.payment_intent === "string" ? session.payment_intent : null
      });
    }

    // Bestandskunde nach § 7 Abs. 3 UWG: Die Adresse stammt aus einem
    // tatsächlich abgeschlossenen Kauf — deshalb hier im Webhook und nicht
    // schon beim Checkout-Start, wo noch nichts bezahlt ist. Der nötige
    // Widerspruchshinweis stand beim Kauf im Formular und steht in jeder Mail.
    try {
      await bestandskundeErfassen({ email, name });
    } catch (err) {
      // Darf den Ticketkauf unter keinen Umständen scheitern lassen.
      console.error("[stripe webhook] Newsletter-Eintrag fehlgeschlagen:", err);
    }

    if (discountId) {
      await prisma.discount
        .update({ where: { id: discountId }, data: { usedCount: { increment: 1 } } })
        .catch((err: unknown) => {
          // Zählerfehler darf den Kauf nicht scheitern lassen.
          console.error("[stripe webhook] Rabatt-Zähler konnte nicht erhöht werden:", err);
        });
    }
  }

  return NextResponse.json({ received: true });
}
