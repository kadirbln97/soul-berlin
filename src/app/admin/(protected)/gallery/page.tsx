import { prisma } from "@/lib/prisma";
import { getDefaultGalleryTiles } from "@/lib/galleryDefaults";
import { GalleryManager } from "@/components/GalleryManager";

export const dynamic = "force-dynamic";

export default async function AdminGalleryPage() {
  const items = await prisma.galleryItem.findMany({ orderBy: { order: "asc" } });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-display text-2xl uppercase text-paper sm:text-3xl">
          Galerie ("SØUL in Action")
        </h1>
        <p className="mt-1 text-sm text-paper/50">
          Fotos & Videos für die Galerie auf der Startseite. Reihenfolge per Hoch/Runter,
          Löschen sofort wirksam.
        </p>
      </div>

      <GalleryManager
        initialItems={items.map((i) => ({
          id: i.id,
          type: i.type as "PHOTO" | "VIDEO",
          url: i.url,
          posterUrl: i.posterUrl,
          label: i.label
        }))}
        defaultTiles={getDefaultGalleryTiles()}
      />
    </div>
  );
}
