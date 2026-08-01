import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/authGuard";
import { getDefaultGalleryTiles } from "@/lib/galleryDefaults";

/**
 * Übernimmt die bisher fest eingebauten Standard-Medien einmalig als echte,
 * bearbeitbare Galerie-Einträge. Danach lassen sie sich wie eigene Uploads
 * sortieren und löschen.
 *
 * Läuft absichtlich nur, solange die Tabelle noch leer ist — sonst würde ein
 * versehentlicher zweiter Klick die alten Medien erneut anhängen.
 */
export async function POST() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const existing = await prisma.galleryItem.count();
  if (existing > 0) {
    return NextResponse.json(
      { error: "Es gibt bereits eigene Galerie-Einträge." },
      { status: 400 }
    );
  }

  const tiles = getDefaultGalleryTiles();

  await prisma.galleryItem.createMany({
    data: tiles.map((tile, index) => ({
      type: tile.type,
      url: tile.url,
      posterUrl: tile.posterUrl,
      label: tile.label,
      order: index
    }))
  });

  return NextResponse.json({ ok: true, count: tiles.length });
}
