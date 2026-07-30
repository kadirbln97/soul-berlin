import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validation";
import { createTicketAndSendEmail, countActiveTickets } from "@/lib/createTicket";

export async function POST(req: Request) {
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

  if (event.ticketMode !== "GUESTLIST") {
    return NextResponse.json(
      { error: "Dieses Event läuft über kostenpflichtige Tickets, nicht über die Gästeliste." },
      { status: 400 }
    );
  }

  if (event.capacity) {
    const active = await countActiveTickets(event.id);
    if (active >= event.capacity) {
      return NextResponse.json({ error: "Dieses Event ist leider ausverkauft." }, { status: 409 });
    }
  }

  const existing = await prisma.ticket.findFirst({
    where: {
      eventId: event.id,
      email: email.toLowerCase(),
      status: { in: ["VALID", "CHECKED_IN"] }
    }
  });

  if (existing) {
    return NextResponse.json(
      { error: "Diese E-Mail-Adresse steht für dieses Event bereits auf der Gästeliste." },
      { status: 409 }
    );
  }

  const ticket = await createTicketAndSendEmail({
    event,
    name,
    email: email.toLowerCase(),
    phone
  });

  return NextResponse.json({ ok: true, ticketId: ticket.id });
}
