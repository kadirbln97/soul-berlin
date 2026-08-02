import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/authGuard";

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
