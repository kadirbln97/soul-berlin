import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/authGuard";
import { sendTicketEmailWithRetry } from "@/lib/createTicket";

/**
 * Ticket-E-Mail erneut verschicken — für Tickets, deren Versand beim Anlegen
 * gescheitert ist (emailSentAt leer), oder wenn ein Gast die Mail schlicht
 * nicht findet. Der QR-Code bleibt derselbe; es entsteht kein zweites Ticket.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: { event: true }
  });
  if (!ticket) {
    return NextResponse.json({ error: "Ticket nicht gefunden" }, { status: 404 });
  }
  if (ticket.isManual || !ticket.email || !ticket.email.includes("@")) {
    return NextResponse.json(
      { error: "Für diesen Eintrag gibt es keine E-Mail-Adresse." },
      { status: 400 }
    );
  }
  if (ticket.status !== "VALID" && ticket.status !== "CHECKED_IN") {
    return NextResponse.json(
      { error: "Dieses Ticket ist storniert oder erstattet — keine Mail mehr möglich." },
      { status: 400 }
    );
  }

  const sent = await sendTicketEmailWithRetry(ticket, ticket.event);
  if (!sent) {
    return NextResponse.json(
      { error: "Versand fehlgeschlagen — bitte SMTP-Einstellungen prüfen (siehe RUNBOOK)." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
