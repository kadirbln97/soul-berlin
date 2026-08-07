/**
 * Verkleinert und komprimiert ein hochgeladenes Bild serverseitig, bevor es
 * in Vercel Blob landet — statt das Originalfoto direkt vom Handy oder der
 * Kamera (oft mehrere MB, mit 4000px+ Kantenlänge) unverändert zu speichern
 * und bei jedem Seitenaufruf auszuliefern.
 *
 * Bewusst nicht für GIFs verwendet: sharp würde ein animiertes GIF beim
 * WebP-Export auf das erste Standbild reduzieren. Statische GIFs, Videos
 * und bereits kleine Dateien bleiben unangetastet (withoutEnlargement).
 *
 * @param maxEdge Längste Kante in Pixeln, auf die verkleinert wird.
 */
export async function optimizeImage(
  file: File,
  { maxEdge = 2400, quality = 82 }: { maxEdge?: number; quality?: number } = {}
): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  // Bewusst dynamisch statt eines Imports am Dateianfang: sharp lädt beim
  // Import ein plattformspezifisches Binary. Schlägt das fehl, soll der
  // Fehler hier im try/catch von safeOptimizeImage landen — nicht schon
  // beim Laden des Moduls, wo ihn kein try/catch mehr abfangen könnte.
  const { default: sharp } = await import("sharp");
  const input = Buffer.from(await file.arrayBuffer());

  const output = await sharp(input)
    .rotate() // EXIF-Ausrichtung anwenden, bevor die Metadaten wegfallen.
    .resize({ width: maxEdge, height: maxEdge, fit: "inside", withoutEnlargement: true })
    .webp({ quality })
    .toBuffer();

  return { buffer: output, contentType: "image/webp", ext: "webp" };
}

/** Animierte Formate (GIF) unverändert lassen, alles andere über sharp führen. */
export function shouldOptimize(mimeType: string) {
  return mimeType === "image/jpeg" || mimeType === "image/png" || mimeType === "image/webp";
}

/**
 * Wie optimizeImage, aber schlägt der native sharp-Baustein aus irgendeinem
 * Grund fehl (z.B. Plattform-Binary fehlt), soll das den Upload nicht
 * blockieren — dann landet eben das Original im Blob-Storage statt gar
 * nichts. Fehler wird geloggt, damit man es trotzdem bemerkt.
 */
export async function safeOptimizeImage(
  file: File,
  options?: { maxEdge?: number; quality?: number }
): Promise<{ buffer: Buffer; contentType: string; ext: string } | null> {
  try {
    return await optimizeImage(file, options);
  } catch (err) {
    console.error("Bildoptimierung fehlgeschlagen, speichere Original:", err);
    return null;
  }
}
