import { LazyVideo } from "./LazyVideo";

// 13 Fotos + 3 Videos = 16 Kacheln — bei 4 Spalten (Desktop) ergibt das exakt
// 4 volle Reihen, damit kein Video allein in einer unvollständigen Reihe landet.
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

/**
 * "SØUL in Action" — Foto-/Video-Galerie. Alle Bilder sind auf ~900px WebP
 * komprimiert (~40-140KB/Stück), alle Videos werden erst beim Reinscrollen
 * geladen (siehe LazyVideo) — hält die Startseite trotz vieler Medien schnell.
 */
export function Gallery() {
  // Fotos und Video-Kacheln im Grid mischen, Videos gleichmäßig verteilt.
  const items: { type: "photo" | "video"; index: number }[] = [];
  let videoIdx = 0;
  PHOTOS.forEach((_, i) => {
    items.push({ type: "photo", index: i });
    if (i > 0 && i % 5 === 0 && videoIdx < VIDEOS.length) {
      items.push({ type: "video", index: videoIdx });
      videoIdx += 1;
    }
  });
  while (videoIdx < VIDEOS.length) {
    items.push({ type: "video", index: videoIdx });
    videoIdx += 1;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {items.map((item, i) =>
        item.type === "photo" ? (
          <div
            key={`photo-${item.index}`}
            className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-neutral-900"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/media/photos/${PHOTOS[item.index]}.webp`}
              alt="Impression von einem SØUL Berlin Event"
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <LazyVideo
            key={`video-${item.index}`}
            src={VIDEOS[item.index].src}
            poster={VIDEOS[item.index].poster}
            label={VIDEOS[item.index].label}
          />
        )
      )}
    </div>
  );
}
