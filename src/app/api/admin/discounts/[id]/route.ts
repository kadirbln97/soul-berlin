import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/authGuard";

/** Rabatt aktivieren/deaktivieren. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.active !== "boolean") {
    return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
  }

  const discount = await prisma.discount.update({
    where: { id: params.id },
    data: { active: body.active }
  });

  return NextResponse.json({ ok: true, discount });
}

/** Rabatt löschen. Bereits gekaufte Tickets behalten ihren Rabatt-Snapshot. */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  await prisma.discount.delete({ where: { id: params.id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
