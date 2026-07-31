import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getAdminSession } from "@/lib/authGuard";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Nimmt einen Bild-Upload vom Admin-Bereich entgegen (Event-Cover) und legt
 * ihn in Vercel Blob Storage ab. Gibt die öffentliche URL zurück, die dann im
 * Event gespeichert wird. Kein Zugriff ohne Login möglich.
 */
export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  // Schutz vor Missbrauch/Massen-Uploads: max. 20 Uploads pro 10 Minuten.
  const ip = getClientIp(req);
  const rl = checkRateLimit(`upload:${ip}`, 20, 10 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Zu viele Uploads. Bitte kurz warten." },
      { status: 429 }
    );
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        error:
          "Bild-Upload ist nicht eingerichtet (BLOB_READ_WRITE_TOKEN fehlt). Storage in Vercel verbinden."
      },
      { status: 500 }
    );
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Keine Datei erhalten." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Nur JPEG, PNG, WebP oder GIF erlaubt." },
      { status: 400 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Datei zu groß (max. 10 MB)." },
      { status: 400 }
    );
  }

  const ext = file.type.split("/")[1] ?? "jpg";
  const filename = `events/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const blob = await put(filename, file, {
    access: "public",
    contentType: file.type
  });

  return NextResponse.json({ ok: true, url: blob.url });
}
