import { prisma } from "@/lib/prisma";
import { LazyVideo } from "./LazyVideo";

/**
 * "SØUL in Action" — Foto-/Video-Galerie. Inhalt + Reihenfolge kommen komplett
 * aus der Datenbank (GalleryItem, verwaltet unter /admin/gallery) — kein
 * Code-Deploy mehr nötig, um Medien zu tauschen, zu sortieren oder zu
 * löschen. Fotos sind auf ~900px WebP komprimiert, Videos werden erst beim
 * Reinscrollen geladen (siehe LazyVideo) — hält die Startseite trotz vieler
 * Medien schnell.
 */
export async function Gallery() {
  const items = await prisma.galleryItem.findMany({ orderBy: { order: "asc" } });

  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {items.map((item) =>
        item.type === "PHOTO" ? (
          <div
            key={item.id}
            className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-neutral-900"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.url}
              alt={item.label || "Impression von einem SØUL Berlin Event"}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <LazyVideo
            key={item.id}
            src={item.url}
            poster={item.posterUrl}
            label={item.label || "SØUL Berlin Video"}
          />
        )
      )}
    </div>
  );
}
