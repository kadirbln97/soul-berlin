import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/authGuard";
import { galleryItemSchema } from "@/lib/validation";

/** Neue Foto-/Video-Kachel ans Ende der Galerie anhängen. */
export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = galleryItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const last = await prisma.galleryItem.findFirst({ orderBy: { order: "desc" } });
  const nextOrder = (last?.order ?? -1) + 1;

  const item = await prisma.galleryItem.create({
    data: {
      type: data.type,
      url: data.url,
      posterUrl: data.posterUrl || null,
      label: data.label || null,
      isAi: data.isAi ?? false,
      order: nextOrder
    }
  });

  return NextResponse.json({ ok: true, item });
}
