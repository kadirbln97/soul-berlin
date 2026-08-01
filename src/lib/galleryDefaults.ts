/**
 * Die ursprünglich fest eingebauten Galerie-Medien. Sie werden angezeigt,
 * solange im Admin-Bereich noch nichts Eigenes angelegt wurde — dadurch
 * verschwindet beim Umstieg auf die verwaltbare Galerie nichts von der
 * Startseite, ohne dass irgendein Skript laufen muss.
 *
 * Sobald in /admin/gallery der erste eigene Eintrag existiert, zählt
 * ausschließlich die Datenbank.
 */
export type GalleryTile = {
  id: string;
  type: "PHOTO" | "VIDEO";
  url: string;
  posterUrl: string | null;
  label: string | null;
};

const PHOTO_SLUGS = [
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
  { url: "/media/video/dayparty.mp4", posterUrl: "/media/video/dayparty-poster.jpg", label: "SØUL Day Party" },
  { url: "/media/video/rooftop.mp4", posterUrl: "/media/video/rooftop-poster.jpg", label: "SØUL Rooftop" },
  { url: "/media/video/barbox.mp4", posterUrl: "/media/video/barbox-poster.jpg", label: "SØUL Bar Box" }
];

/**
 * 13 Fotos + 3 Videos = 16 Kacheln, Videos gleichmäßig dazwischen — bei 4
 * Spalten (Desktop) ergibt das exakt 4 volle Reihen, damit kein Video allein
 * in einer unvollständigen Reihe landet.
 */
export function getDefaultGalleryTiles(): GalleryTile[] {
  const tiles: GalleryTile[] = [];
  let videoIdx = 0;

  PHOTO_SLUGS.forEach((slug, i) => {
    tiles.push({
      id: `default-photo-${slug}`,
      type: "PHOTO",
      url: `/media/photos/${slug}.webp`,
      posterUrl: null,
      label: "Impression von einem SØUL Berlin Event"
    });
    if (i > 0 && i % 5 === 0 && videoIdx < VIDEOS.length) {
      const v = VIDEOS[videoIdx];
      tiles.push({ id: `default-video-${videoIdx}`, type: "VIDEO", ...v });
      videoIdx += 1;
    }
  });

  while (videoIdx < VIDEOS.length) {
    const v = VIDEOS[videoIdx];
    tiles.push({ id: `default-video-${videoIdx}`, type: "VIDEO", ...v });
    videoIdx += 1;
  }

  return tiles;
}
