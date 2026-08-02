import { prisma } from "@/lib/prisma";
import { getDefaultGalleryTiles } from "@/lib/galleryDefaults";
import { GalleryManager } from "@/components/GalleryManager";

export const dynamic = "force-dynamic";

/**
 * Beim allerersten Aufruf werden die bisher fest eingebauten Standard-Medien
 * automatisch als echte, bearbeitbare Einträge angelegt — damit sie sofort
 * sortier- und löschbar sind, ohne dass jemand einen Extra-Schritt ausführen
 * muss. Passiert genau einmal (danach ist die Tabelle nicht mehr leer).
 */
async function ensureGalleryItems() {
  const existing = await prisma.galleryItem.count();
  if (existing > 0) return;

  await prisma.galleryItem.createMany({
    data: getDefaultGalleryTiles().map((tile, index) => ({
      type: tile.type,
      url: tile.url,
      posterUrl: tile.posterUrl,
      label: tile.label,
      order: index
    }))
  });
}

export default async function AdminGalleryPage() {
  await ensureGalleryItems();

  const items = await prisma.galleryItem.findMany({ orderBy: { order: "asc" } });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-display text-2xl uppercase text-paper sm:text-3xl">
          Galerie (&quot;SØUL in Action&quot;)
        </h1>
        <p className="mt-1 text-sm text-paper/50">
          Fotos & Videos für die Galerie auf der Startseite. Zum Umsortieren eine Kachel mit
          der Maus an die neue Stelle ziehen oder die Pfeile benutzen — die Reihenfolge wird
          sofort gespeichert.
        </p>
        <p className="mt-2 text-xs text-paper/40">
          Mit KI erstellte oder bearbeitete Medien bitte ankreuzen — auf der Startseite
          erscheint dann automatisch der Hinweis „KI-generiert“ (Transparenzpflicht nach
          Art. 50 KI-VO).
        </p>
      </div>

      <GalleryManager
        initialItems={items.map((i) => ({
          id: i.id,
          type: i.type as "PHOTO" | "VIDEO",
          url: i.url,
          posterUrl: i.posterUrl,
          label: i.label,
          isAi: i.isAi
        }))}
      />
    </div>
  );
}
