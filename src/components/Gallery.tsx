import { prisma } from "@/lib/prisma";
import { getDefaultGalleryTiles, type GalleryTile } from "@/lib/galleryDefaults";
import { getTranslations } from "@/lib/serverLocale";
import { LazyVideo } from "./LazyVideo";
import { AiBadge } from "./AiBadge";

/**
 * "SØUL in Action" — Foto-/Video-Galerie. Inhalt + Reihenfolge werden unter
 * /admin/gallery verwaltet; solange dort nichts angelegt wurde, greifen die
 * ursprünglichen Standard-Medien (siehe lib/galleryDefaults.ts). Fotos sind
 * auf ~900px WebP komprimiert, Videos werden erst beim Reinscrollen geladen
 * (siehe LazyVideo) — hält die Startseite trotz vieler Medien schnell.
 */
export async function Gallery() {
  const { t } = await getTranslations();
  let tiles: GalleryTile[];

  try {
    const rows = await prisma.galleryItem.findMany({ orderBy: { order: "asc" } });
    tiles =
      rows.length > 0
        ? rows.map((r) => ({
            id: r.id,
            type: r.type as "PHOTO" | "VIDEO",
            url: r.url,
            posterUrl: r.posterUrl,
            label: r.label,
            isAi: r.isAi
          }))
        : getDefaultGalleryTiles();
  } catch {
    // Tabelle noch nicht angelegt o.Ä. — die Startseite soll deswegen nicht
    // ausfallen, also einfach die Standard-Medien zeigen.
    tiles = getDefaultGalleryTiles();
  }

  if (tiles.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {tiles.map((tile) =>
        tile.type === "PHOTO" ? (
          <div
            key={tile.id}
            className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-neutral-900"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={tile.url}
              alt={tile.label || "Impression von einem SØUL Berlin Event"}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
            {tile.isAi && <AiBadge label={t.ai.badge} title={t.ai.imageNotice} />}
          </div>
        ) : (
          <div key={tile.id} className="relative">
            <LazyVideo
              src={tile.url}
              poster={tile.posterUrl}
              label={tile.label || "SØUL Berlin Video"}
            />
            {tile.isAi && <AiBadge label={t.ai.badge} title={t.ai.imageNotice} />}
          </div>
        )
      )}
    </div>
  );
}
