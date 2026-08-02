import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/authGuard";

/**
 * Namenssuche für den Einlass: findet Gäste eines Events anhand von Name oder
 * E-Mail. Gedacht für Gäste ohne QR-Code (manuell eingetragene Promoter-Gäste)
 * oder wenn jemand seine Bestätigungsmail nicht findet.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ guests: [] });
  }

  const guests = await prisma.ticket.findMany({
    where: {
      eventId: id,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } }
      ]
    },
    orderBy: { name: "asc" },
    take: 25,
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      tierLabel: true,
      amountCents: true,
      currency: true,
      isManual: true,
      promoterName: true,
      checkedInAt: true,
      stripeSessionId: true
    }
  });

  return NextResponse.json({
    guests: guests.map(({ stripeSessionId, ...g }) => ({
      ...g,
      ticketType: stripeSessionId ? "PAID_ONLINE" : "GUESTLIST"
    }))
  });
}
