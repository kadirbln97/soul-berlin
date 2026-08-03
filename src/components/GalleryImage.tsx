"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * Galerie-Kachel, die beim Nachladen sanft einblendet statt hart aufzupoppen.
 *
 * Bewusst nur Deckkraft, keine Verschiebung und kein Stagger: die Kacheln
 * laden einzeln und in unvorhersehbarer Reihenfolge nach: eine Bewegung dazu
 * würde beim Scrollen unruhig wirken. Ein reines Einblenden überbrückt den
 * Sprung von grauer Fläche zu Bild, ohne sich in den Vordergrund zu drängen.
 */
export function GalleryImage({
  src,
  alt,
  sizes
}: {
  src: string;
  alt: string;
  sizes: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  // Liegt das Bild schon im Cache, ist onLoad bereits gefeuert, bevor React
  // übernimmt — ohne diese Prüfung bliebe die Kachel dauerhaft unsichtbar.
  useEffect(() => {
    if (ref.current?.complete) setLoaded(true);
  }, []);

  return (
    <Image
      ref={ref}
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      onLoad={() => setLoaded(true)}
      className={`gallery-fade object-cover transition-opacity duration-300 ease-out ${
        loaded ? "opacity-100" : "opacity-0"
      }`}
    />
  );
}
