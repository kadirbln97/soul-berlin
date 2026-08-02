import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/authGuard";
import { formatEventDate } from "@/lib/format";

/**
 * Manueller Check-in über die Namenssuche an der Tür — für Gäste ohne
 * QR-Code (Promoter-Liste) oder wenn die Bestätigungsmail fehlt.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) {
    return NextResponse.json({ error: "Gast nicht gefunden" }, { status: 404 });
  }

  if (ticket.status === "REFUNDED" || ticket.status === "CANCELLED") {
    return NextResponse.json(
      { error: "Dieses Ticket wurde storniert/erstattet — kein Einlass." },
      { status: 409 }
    );
  }

  if (ticket.status === "CHECKED_IN") {
    return NextResponse.json(
      {
        error: `Bereits eingecheckt${
          ticket.checkedInAt ? ` am ${formatEventDate(ticket.checkedInAt)}` : ""
        }.`
      },
      { status: 409 }
    );
  }

  const updated = await prisma.ticket.update({
    where: { id: ticket.id },
    data: {
      status: "CHECKED_IN",
      checkedInAt: new Date(),
      checkedInBy: session.email
    }
  });

  return NextResponse.json({ ok: true, ticket: { id: updated.id, status: updated.status } });
}
