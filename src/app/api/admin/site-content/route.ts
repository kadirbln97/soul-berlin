import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/authGuard";
import { SITE_CONTENT_FIELDS } from "@/lib/siteContent";

// Neben den Grundfeldern auch die englischen Varianten ("<key>_en") und bei
// Bildern die KI-Kennzeichnung ("<key>_ai", Art. 50 KI-VO) zulassen.
const ALLOWED_KEYS = new Set([
  ...SITE_CONTENT_FIELDS.map((f) => f.key),
  ...SITE_CONTENT_FIELDS.filter((f) => f.translatable).map((f) => `${f.key}_en`),
  ...SITE_CONTENT_FIELDS.filter((f) => f.type === "image").map((f) => `${f.key}_ai`)
]);
const MAX_VALUE_LENGTH = 2000;
// Rechtstexte (Impressum, Datenschutz, AGB) sind ganze Seiten — die
// Datenschutzerklärung allein hat rund 10.000 Zeichen.
const MAX_LONGTEXT_LENGTH = 60_000;
const LONGTEXT_KEYS = new Set(
  SITE_CONTENT_FIELDS.filter((f) => f.type === "longtext").flatMap((f) =>
    f.translatable ? [f.key, `${f.key}_en`] : [f.key]
  )
);

/**
 * Speichert die im Baukasten (/admin/homepage) geänderten Startseiten-Texte
 * und -Bilder. Es werden ausschließlich die in siteContent.ts definierten
 * Schlüssel akzeptiert — niemand kann also über diese Route beliebige
 * Einträge in die Tabelle schreiben.
 */
export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || typeof body.values !== "object") {
    return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
  }

  const entries = Object.entries(body.values as Record<string, unknown>);

  for (const [key, value] of entries) {
    if (!ALLOWED_KEYS.has(key)) {
      return NextResponse.json({ error: `Unbekanntes Feld: ${key}` }, { status: 400 });
    }
    const maxLength = LONGTEXT_KEYS.has(key) ? MAX_LONGTEXT_LENGTH : MAX_VALUE_LENGTH;
    if (typeof value !== "string" || value.length > maxLength) {
      return NextResponse.json(
        {
          error: `Wert für "${key}" ist ungültig oder zu lang (max. ${maxLength.toLocaleString("de-DE")} Zeichen).`
        },
        { status: 400 }
      );
    }
    // Empfängeradresse prüfen — ein Tippfehler hier würde sonst dazu führen,
    // dass Kontaktanfragen unbemerkt nicht mehr zugestellt werden.
    if (key === "contact_email" && value.trim() !== "") {
      const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
      if (!looksLikeEmail) {
        return NextResponse.json(
          { error: "Bitte eine gültige E-Mail-Adresse für das Kontaktformular eingeben." },
          { status: 400 }
        );
      }
    }
  }

  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.siteContent.upsert({
        where: { key },
        create: { key, value: value as string },
        update: { value: value as string }
      })
    )
  );

  return NextResponse.json({ ok: true });
}
