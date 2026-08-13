import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { signupSchema } from "@/lib/validation";
import { countActiveTickets } from "@/lib/createTicket";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { calculatePriceBreakdown, describeDiscount } from "@/lib/discount";
import { resolveDiscount } from "@/lib/resolveDiscount";
import { loadResolvedPhases } from "@/lib/loadTicketPhases";
import { getLocale } from "@/lib/serverLocale";

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
  const quantity = parsed.data.quantity ?? 1;

  const event = await prisma.event.findUnique({ where: { id: eventId } });

  if (!event || event.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Event nicht gefunden" }, { status: 404 });
  }

  if ((event.ticketMode !== "PAID" && event.ticketMode !== "BOTH") || !event.priceCents) {
    return NextResponse.json(
      { error: "Dieses Event läuft über die kostenlose Gästeliste, nicht über Ticketkauf." },
      { status: 400 }
    );
  }

  if (event.ticketSalesEndAt && new Date() > event.ticketSalesEndAt) {
    return NextResponse.json(
      { error: "Der Ticketverkauf für dieses Event ist bereits geschlossen." },
      { status: 400 }
    );
  }

  if (event.capacity) {
    const active = await countActiveTickets(event.id);
    if (active + quantity > event.capacity) {
      const left = Math.max(0, event.capacity - active);
      return NextResponse.json(
        {
          error:
            left === 0
              ? "Dieses Event ist leider ausverkauft."
              : `Es sind nur noch ${left} Tickets verfügbar.`
        },
        { status: 409 }
      );
    }
  }

  // Verkaufsphasen: die aktive Phase bestimmt den Preis und ihr Restkontingent
  // die Stückzahl. Alles serverseitig — der Browser schickt nur die Menge, nie
  // einen Preis oder eine Phase.
  const phases = await loadResolvedPhases(event.id);
  const activePhase = phases.find((p) => p.status === "ACTIVE") ?? null;

  if (phases.length > 0 && !activePhase) {
    return NextResponse.json(
      { error: "Der Ticketverkauf für dieses Event ist abgeschlossen." },
      { status: 409 }
    );
  }

  if (activePhase && activePhase.remaining !== null && quantity > activePhase.remaining) {
    return NextResponse.json(
      {
        error:
          activePhase.remaining === 0
            ? "Diese Ticketphase ist leider ausverkauft."
            : `In der Phase „${activePhase.label}“ sind nur noch ${activePhase.remaining} Tickets verfügbar.`
      },
      { status: 409 }
    );
  }

  const unitPriceCents = activePhase ? activePhase.priceCents : event.priceCents;

  // Rabatt serverseitig auflösen — der vom Browser geschickte Preis wird
  // bewusst nie übernommen, sonst könnte man sich den Preis selbst setzen.
  const { discount, codeInvalid } = await resolveDiscount(event.id, parsed.data.discountCode);
  if (codeInvalid) {
    return NextResponse.json(
      { error: "Dieser Gutscheincode ist ungültig oder nicht mehr einlösbar." },
      { status: 400 }
    );
  }

  const breakdown = calculatePriceBreakdown(unitPriceCents, quantity, discount?.rule ?? null);

  if (breakdown.totalCents <= 0) {
    return NextResponse.json(
      { error: "Für diese Auswahl ist kein Betrag zu zahlen. Bitte kontaktiere uns direkt." },
      { status: 400 }
    );
  }

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const feeCents = breakdown.feeCents;
  // Preis je Ticket nach Rabatt — als eine Position mit quantity, damit der
  // Gast im Stripe-Checkout die Stückzahl sieht. Rundungsreste aus dem
  // Rabatt landen auf der ersten Position (siehe unten).
  const perTicketCents = Math.floor(breakdown.discountedSubtotalCents / quantity);
  const remainderCents = breakdown.discountedSubtotalCents - perTicketCents * quantity;

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    // payment_method_types bewusst weggelassen: Stripe Checkout zeigt dann
    // automatisch alle im Dashboard aktivierten Zahlarten (Settings → Payment
    // methods) an. Karte ist standardmäßig aktiv; Apple Pay/Google Pay laufen
    // ohne weiteres Setup automatisch über "Karte" mit, sobald Browser/Gerät
    // sie unterstützen. PayPal muss einmalig im Stripe-Dashboard aktiviert
    // werden, danach erscheint es hier automatisch mit.
    customer_email: email,
    // Servicegebühr bewusst als eigene Position statt im Ticketpreis versteckt —
    // der Gast sieht im Stripe-Checkout genau dieselbe Aufschlüsselung wie
    // vorher auf der Event-Seite.
    line_items: [
      {
        quantity,
        price_data: {
          currency: event.currency,
          unit_amount: perTicketCents,
          product_data: {
            name: event.title,
            description: discount
              ? `${event.venue} · ${describeDiscount(discount.rule, event.currency)}`
              : event.venue
          }
        }
      },
      // Rundungsrest (entsteht z.B. bei ungeraden Prozentrabatten auf mehrere
      // Tickets), damit die Summe exakt der angezeigten entspricht.
      ...(remainderCents > 0
        ? [
            {
              quantity: 1,
              price_data: {
                currency: event.currency,
                unit_amount: remainderCents,
                product_data: { name: "Rundungsausgleich" }
              }
            }
          ]
        : []),
      ...(feeCents > 0
        ? [
            {
              quantity: 1,
              price_data: {
                currency: event.currency,
                unit_amount: feeCents,
                product_data: {
                  name: "Servicegebühr",
                  description:
                    quantity > 1
                      ? `Vorverkaufs- und Bearbeitungsgebühr (${quantity} Tickets)`
                      : "Vorverkaufs- und Bearbeitungsgebühr"
                }
              }
            }
          ]
        : [])
    ],
    metadata: {
      eventId: event.id,
      name,
      email: email.toLowerCase(),
      phone: phone ?? "",
      feeCents: String(feeCents),
      quantity: String(quantity),
      discountCents: String(breakdown.discountCents),
      discountId: discount?.id ?? "",
      discountCode: discount?.rule.code ?? "",
      // Phase mitgeben, damit der Webhook das Ticket der richtigen Phase
      // zuordnen kann — sonst stimmt das Restkontingent nicht mehr.
      phaseId: activePhase?.id ?? "",
      phaseLabel: activePhase?.label ?? "",
      locale: await getLocale()
    },
    success_url: `${appUrl}/events/${event.slug}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/events/${event.slug}`
  });

  if (!session.url) {
    return NextResponse.json({ error: "Stripe-Checkout konnte nicht erstellt werden." }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
