"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Videokachel, die erst dann überhaupt geladen wird, wenn sie in den
 * sichtbaren Bereich scrollt (IntersectionObserver) — kein Preload, kein
 * unnötiger Traffic beim ersten Seitenaufbau. Läuft dann stumm & in Schleife
 * als dezentes Hintergrundvideo. Bis dahin (und als Fallback ohne JS) wird
 * nur das kleine Poster-Bild angezeigt.
 */
export function LazyVideo({
  src,
  poster,
  label
}: {
  src: string;
  poster: string;
  label: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-neutral-900"
    >
      {shouldLoad ? (
        <video
          src={src}
          poster={poster}
          muted
          loop
          playsInline
          autoPlay
          preload="none"
          aria-label={label}
          className="h-full w-full object-cover"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poster}
          alt={label}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
}
