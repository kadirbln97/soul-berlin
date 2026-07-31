import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getAdminSession } from "@/lib/authGuard";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

// Eigene Upload-Route für die Galerie (statt die Event-Cover-Route
// mitzubenutzen), weil hier zusätzlich Videos + größere Dateien erlaubt sein
// müssen — bewusst getrennt, um den bestehenden Event-Bild-Upload nicht
// anzufassen/zu riskieren.
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15 MB
const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  // Videos sind groß — großzügigeres, aber weiterhin begrenztes Limit gegen Missbrauch.
  const ip = getClientIp(req);
  const rl = checkRateLimit(`gallery-upload:${ip}`, 30, 10 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Zu viele Uploads. Bitte kurz warten." }, { status: 429 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        error:
          "Datei-Upload ist nicht eingerichtet (BLOB_READ_WRITE_TOKEN fehlt). Storage in Vercel verbinden."
      },
      { status: 500 }
    );
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Keine Datei erhalten." }, { status: 400 });
  }

  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

  if (!isImage && !isVideo) {
    return NextResponse.json(
      { error: "Nur JPEG, PNG, WebP, GIF (Foto) oder MP4/WebM/MOV (Video) erlaubt." },
      { status: 400 }
    );
  }

  const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > maxBytes) {
    return NextResponse.json(
      { error: `Datei zu groß (max. ${Math.round(maxBytes / 1024 / 1024)} MB).` },
      { status: 400 }
    );
  }

  const ext = file.type.split("/")[1] ?? "bin";
  const filename = `gallery/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const blob = await put(filename, file, {
    access: "public",
    contentType: file.type
  });

  return NextResponse.json({ ok: true, url: blob.url });
}
