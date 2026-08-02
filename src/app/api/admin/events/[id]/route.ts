import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/authGuard";
import { eventSchema } from "@/lib/validation";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" },
      { status: 400 }
    );
  }

  const data = parsed.data;

  if (
    (data.ticketMode === "PAID" || data.ticketMode === "BOTH") &&
    (!data.priceCents || data.priceCents <= 0)
  ) {
    return NextResponse.json(
      { error: "Bei kostenpflichtigen Events muss ein Preis > 0 angegeben werden." },
      { status: 400 }
    );
  }

  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Event nicht gefunden" }, { status: 404 });
  }

  const tiers =
    data.ticketMode === "GUESTLIST" || data.ticketMode === "BOTH"
      ? (data.guestlistTiers ?? [])
      : [];

  // Staffeln komplett neu anlegen ist einfacher & sicherer als einzeln
  // abzugleichen — es sind maximal 3 pro Event, kein Performance-Thema.
  const event = await prisma.event.update({
    where: { id },
    data: {
      title: data.title,
      subtitle: data.subtitle || null,
      description: data.description,
      titleEn: data.titleEn || null,
      subtitleEn: data.subtitleEn || null,
      descriptionEn: data.descriptionEn || null,
      venue: data.venue,
      address: data.address || null,
      imageUrl: data.imageUrl || null,
      imageIsAi: data.imageIsAi ?? false,
      dateStart: new Date(data.dateStart),
      dateEnd: data.dateEnd ? new Date(data.dateEnd) : null,
      ticketMode: data.ticketMode,
      priceCents:
        data.ticketMode === "PAID" || data.ticketMode === "BOTH" ? data.priceCents : null,
      capacity: data.capacity || null,
      ticketSalesEndAt: data.ticketSalesEndAt ? new Date(data.ticketSalesEndAt) : null,
      status: data.status,
      guestlistTiers: {
        deleteMany: {},
        create: tiers.map((tier, i) => ({
          untilTime: new Date(tier.untilTime),
          priceCents: tier.priceCents,
          label: tier.label || null,
          order: i
        }))
      }
    }
  });

  return NextResponse.json({ ok: true, event });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Event nicht gefunden" }, { status: 404 });
  }

  await prisma.event.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
