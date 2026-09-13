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

  const item = await prisma.galleryItem.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ ok: true });

  await prisma.galleryItem.delete({ where: { id } }).catch(() => null);

  // Datei im Blob-Speicher mit entfernen — aber nur, wenn sie sonst nirgends
  // mehr verwendet wird (andere Kachel, Event-Bild, Startseiten-Baukasten).
  // Sonst blieben mit jeder gelöschten Kachel Waisen im Speicher liegen.
  const url = item.url;
  const stillUsed =
    !url.includes(".public.blob.vercel-storage.com") ||
    (await prisma.galleryItem.count({ where: { url } })) > 0 ||
    (await prisma.event.count({ where: { imageUrl: url } })) > 0 ||
    (await prisma.siteContent.count({ where: { value: url } })) > 0;
  if (!stillUsed) {
    try {
      const { del } = await import("@vercel/blob");
      await del(url);
    } catch (err) {
      // Nicht schlimm: die Kachel ist weg, die Datei kostet nur Speicher.
      console.error("[gallery] Blob konnte nicht gelöscht werden:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
