"use client";

import Image from "next/image";
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
  poster?: string | null;
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
          poster={poster ?? undefined}
          muted
          loop
          playsInline
          autoPlay
          preload="none"
          aria-label={label}
          className="h-full w-full object-cover"
        />
      ) : poster ? (
        <Image
          src={poster}
          alt={label}
          fill
          sizes="(min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="object-cover"
        />
      ) : (
        // Kein Poster hinterlegt: einfaches Platzhalter-Tile mit Play-Symbol,
        // bis das Video beim Reinscrollen geladen wird.
        <div
          role="img"
          aria-label={label}
          className="flex h-full w-full items-center justify-center bg-neutral-900"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-paper/10">
            <div className="ml-1 h-0 w-0 border-y-8 border-l-[14px] border-y-transparent border-l-paper/60" />
          </div>
        </div>
      )}
    </div>
  );
}
