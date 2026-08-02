import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/authGuard";
import { galleryUpdateSchema } from "@/lib/validation";

/**
 * KI-Kennzeichnung einer bestehenden Kachel umschalten (Art. 50 KI-VO).
 * Bewusst nachträglich änderbar: Ob ein Bild als KI-generiert gilt, fällt
 * einem oft erst später auf.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = galleryUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
  }

  const item = await prisma.galleryItem.update({
    where: { id },
    data: { isAi: parsed.data.isAi }
  });

  return NextResponse.json({ ok: true, item });
}

/** Einzelne Galerie-Kachel löschen (Datei bleibt im Blob-Storage liegen, wie
 * auch beim Austausch eines Event-Bilds — kein automatisches Aufräumen). */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  await prisma.galleryItem.delete({ where: { id } }).catch(() => null);

  return NextResponse.json({ ok: true });
}
