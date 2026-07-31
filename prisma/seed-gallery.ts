// Einmaliges Migrations-Skript: überträgt die bisher fest im Code
// eingebauten Galerie-Fotos/Videos (aus dem alten src/components/Gallery.tsx)
// als GalleryItem-Zeilen in die Datenbank, in der bisherigen Anzeigereihenfolge
// — damit nach dem Umstieg auf die admin-verwaltete Galerie nichts von der
// Startseite verschwindet. Läuft nur, wenn die Tabelle noch leer ist (sicher
// mehrfach ausführbar).
//
// Nutzung: npm run seed-gallery
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PHOTOS = [
  "gallery-01",
  "gallery-02",
  "gallery-03",
  "gallery-04",
  "gallery-05",
  "gallery-06",
  "gallery-07",
  "gallery-08",
  "gallery-09",
  "gallery-10",
  "gallery-11",
  "gallery-12",
  "gallery-13"
];

const VIDEOS = [
  { src: "/media/video/dayparty.mp4", poster: "/media/video/dayparty-poster.jpg", label: "SØUL Day Party" },
  { src: "/media/video/rooftop.mp4", poster: "/media/video/rooftop-poster.jpg", label: "SØUL Rooftop" },
  { src: "/media/video/barbox.mp4", poster: "/media/video/barbox-poster.jpg", label: "SØUL Bar Box" }
];

async function main() {
  const existing = await prisma.galleryItem.count();
  if (existing > 0) {
    console.log(`GalleryItem-Tabelle hat bereits ${existing} Einträge — nichts zu tun.`);
    return;
  }

  // Gleiche Misch-Reihenfolge wie vorher im Code (Video nach jedem 5. Foto).
  const rows: { type: "PHOTO" | "VIDEO"; url: string; posterUrl: string | null; label: string | null; order: number }[] = [];
  let videoIdx = 0;
  PHOTOS.forEach((slug, i) => {
    rows.push({
      type: "PHOTO",
      url: `/media/photos/${slug}.webp`,
      posterUrl: null,
      label: "Impression von einem SØUL Berlin Event",
      order: 0
    });
    if (i > 0 && i % 5 === 0 && videoIdx < VIDEOS.length) {
      const v = VIDEOS[videoIdx];
      rows.push({ type: "VIDEO", url: v.src, posterUrl: v.poster, label: v.label, order: 0 });
      videoIdx += 1;
    }
  });
  while (videoIdx < VIDEOS.length) {
    const v = VIDEOS[videoIdx];
    rows.push({ type: "VIDEO", url: v.src, posterUrl: v.poster, label: v.label, order: 0 });
    videoIdx += 1;
  }

  rows.forEach((row, i) => (row.order = i));

  await prisma.galleryItem.createMany({ data: rows });
  console.log(`${rows.length} Galerie-Einträge angelegt.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
