import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/authGuard";
import { galleryReorderSchema } from "@/lib/validation";

/**
 * Setzt die Reihenfolge aller Galerie-Kacheln neu, anhand der übergebenen
 * ID-Liste (Index in der Liste = neue order). Wird nach jedem
 * Hoch/Runter-Klick im Admin-Bereich mit der kompletten aktuellen Liste
 * aufgerufen — bei der überschaubaren Anzahl an Kacheln (typischerweise
 * <50) ist das einfacher und robuster als einzelne Swap-Requests.
 */
export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = galleryReorderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
  }

  const { ids } = parsed.data;

  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.galleryItem.update({ where: { id }, data: { order: index } })
    )
  );

  return NextResponse.json({ ok: true });
}
