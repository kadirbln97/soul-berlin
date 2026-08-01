import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/authGuard";
import { discountSchema } from "@/lib/validation";

/** Legt einen Rabatt/eine Aktion für ein Event an. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = discountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" },
      { status: 400 }
    );
  }

  const event = await prisma.event.findUnique({ where: { id: params.id } });
  if (!event) {
    return NextResponse.json({ error: "Event nicht gefunden" }, { status: 404 });
  }

  const data = parsed.data;
  const code = data.code?.trim() || null;

  // Prozent wird als ganze Zahl gespeichert, Festbeträge in Cent.
  const value =
    data.type === "FIXED" ? Math.round(data.value * 100) : Math.round(data.value);

  if (code) {
    const duplicate = await prisma.discount.findFirst({
      where: { eventId: event.id, code: { equals: code, mode: "insensitive" } }
    });
    if (duplicate) {
      return NextResponse.json(
        { error: "Diesen Code gibt es für dieses Event schon." },
        { status: 409 }
      );
    }
  } else {
    // Nur ein automatischer Rabatt pro Event — sonst wäre für Gäste nicht
    // nachvollziehbar, welcher greift.
    const existingAuto = await prisma.discount.findFirst({
      where: { eventId: event.id, code: null, active: true }
    });
    if (existingAuto) {
      return NextResponse.json(
        {
          error:
            "Es gibt bereits einen automatischen Rabatt für dieses Event. Bitte diesen zuerst deaktivieren oder löschen."
        },
        { status: 409 }
      );
    }
  }

  const discount = await prisma.discount.create({
    data: {
      eventId: event.id,
      code,
      type: data.type,
      value: data.type === "BOGO" ? 0 : value,
      label: data.label?.trim() || null,
      active: data.active ?? true,
      maxUses: data.maxUses ?? null
    }
  });

  return NextResponse.json({ ok: true, discount });
}
