import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/authGuard";
import { getStripe } from "@/lib/stripe";

/**
 * Storniert ein Ticket. Bei bezahlten Tickets wird zusätzlich eine echte
 * Stripe-Rückerstattung ausgelöst. Der QR-Code des Tickets wird danach am
 * Einlass automatisch als "REFUNDED" abgelehnt.
 */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const ticket = await prisma.ticket.findUnique({ where: { id: params.id } });
  if (!ticket) {
    return NextResponse.json({ error: "Ticket nicht gefunden" }, { status: 404 });
  }

  if (ticket.status === "REFUNDED" || ticket.status === "CANCELLED") {
    return NextResponse.json({ error: "Ticket ist bereits storniert" }, { status: 409 });
  }

  if (ticket.stripePaymentIntentId) {
    try {
      await getStripe().refunds.create({
        payment_intent: ticket.stripePaymentIntentId
      });
    } catch (err) {
      console.error(`[refund] Stripe-Rückerstattung fehlgeschlagen für Ticket ${ticket.id}:`, err);
      return NextResponse.json(
        { error: "Stripe-Rückerstattung fehlgeschlagen. Ticket wurde NICHT storniert." },
        { status: 502 }
      );
    }
  }

  const updated = await prisma.ticket.update({
    where: { id: ticket.id },
    data: { status: "REFUNDED" }
  });

  return NextResponse.json({ ok: true, ticket: updated });
}
