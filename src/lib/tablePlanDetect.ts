import { z } from "zod";

/**
 * Automatische Tischerkennung auf einem Grundriss über die Claude API.
 *
 * Ablauf (siehe /api/admin/table-plan/detect): Bild aus dem Blob-Speicher
 * laden, auf höchstens 1568 px verkleinern, ein beschriftetes 10-%-Raster
 * einzeichnen (das Modell schätzt Positionen mit Referenzlinien deutlich
 * genauer), an das Modell schicken, JSON zurückbekommen, hier prüfen.
 *
 * Das Ergebnis ist ein Vorschlag: Kästen sitzen erfahrungsgemäß zu 80–90 %
 * brauchbar, der Rest wird im Zeichen-Editor nachgezogen.
 */

export const DETECT_MAX_EDGE = 1568;
export const DEFAULT_DETECT_MODEL = "claude-sonnet-5";

export type DetectedTable = {
  id: string;
  capacity: number | null;
  x: number;
  y: number;
  w: number;
  h: number;
};

export const DETECT_PROMPT = `Du siehst den Grundriss eines Veranstaltungsorts mit nummerierten Tischen (Sitzplätze, Lounges, Booths). Über das Bild ist ein magentafarbenes Hilfsraster gelegt: Linien alle 10 % der Bildbreite bzw. -höhe, an den Rändern beschriftet. Das Raster gehört nicht zum Plan — es dient nur dir als Maßstab.

Finde jeden Tisch, der eine Nummer oder Bezeichnung trägt, und gib für jeden ein Rechteck an, das die Tischgrafik samt Nummer eng umschließt.

Koordinaten: Prozent der gesamten Bildbreite bzw. -höhe, Ursprung oben links, eine Nachkommastelle. x/y = linke obere Ecke, w/h = Breite/Höhe. Nutze das Raster: ein Tisch, der zwischen der 30-%- und der 40-%-Linie beginnt, hat x zwischen 30 und 40.

Nicht aufnehmen: Bühne, DJ, Bar, Theke, Tanzfläche, Toiletten, Garderobe, Ein-/Ausgänge, Legenden, Überschriften.

capacity: Anzahl der Sitzplätze, falls der Plan sie erkennen lässt (Stühle gezeichnet oder Zahl angegeben), sonst null.

Antworte ausschließlich mit JSON in genau dieser Form, ohne Erklärung und ohne Codeblock:
{"tables":[{"id":"1","capacity":4,"x":12.3,"y":45.0,"w":8.0,"h":6.5}]}`;

const detectedTableSchema = z.object({
  id: z.union([z.string(), z.number()]).transform((v) => String(v).trim()),
  capacity: z.number().int().min(1).max(50).nullable().optional(),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number()
});

const detectedResponseSchema = z.object({
  tables: z.array(detectedTableSchema).max(80)
});

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

/**
 * Antworttext des Modells in geprüfte Tische verwandeln. Tolerant gegenüber
 * Codeblöcken oder Vorreden, streng bei der Geometrie: Werte werden auf
 * 0–100 begrenzt, zu kleine Kästen verworfen, doppelte Nummern eindeutig
 * gemacht.
 */
export function parseDetectedTables(text: string): DetectedTable[] {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Das Modell hat kein JSON geliefert.");
  }

  let json: unknown;
  try {
    json = JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new Error("Das Modell hat ungültiges JSON geliefert.");
  }

  const parsed = detectedResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Die Antwort des Modells hatte nicht das erwartete Format.");
  }

  const seen = new Map<string, number>();
  const tables: DetectedTable[] = [];

  for (const raw of parsed.data.tables) {
    if (!Number.isFinite(raw.x) || !Number.isFinite(raw.y) || !Number.isFinite(raw.w) || !Number.isFinite(raw.h)) {
      continue;
    }
    const x = clamp(raw.x, 0, 99);
    const y = clamp(raw.y, 0, 99);
    const w = clamp(raw.w, 0, 100 - x);
    const h = clamp(raw.h, 0, 100 - y);
    if (w < 1 || h < 1) continue;

    let id = raw.id || String(tables.length + 1);
    const count = seen.get(id) ?? 0;
    seen.set(id, count + 1);
    if (count > 0) id = `${id}-${count + 1}`;

    tables.push({
      id: id.slice(0, 20),
      capacity: raw.capacity ?? null,
      x: round1(x),
      y: round1(y),
      w: round1(w),
      h: round1(h)
    });
  }

  if (tables.length === 0) {
    throw new Error("Auf dem Bild wurden keine Tische erkannt.");
  }

  return tables;
}

/** Beschriftetes 10-%-Raster als SVG, wird per sharp über das Bild gelegt. */
export function buildGridOverlaySvg(width: number, height: number): string {
  const stroke = "rgba(255,0,200,0.55)";
  const fontSize = Math.max(12, Math.round(Math.min(width, height) / 60));
  const lines: string[] = [];
  const labels: string[] = [];

  for (let i = 1; i < 10; i++) {
    const x = (width * i) / 10;
    const y = (height * i) / 10;
    lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="${stroke}" stroke-width="1"/>`);
    lines.push(`<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="${stroke}" stroke-width="1"/>`);
    labels.push(
      `<text x="${x + 3}" y="${fontSize + 2}" font-size="${fontSize}" font-family="sans-serif" fill="rgb(255,0,200)">${i * 10}</text>`
    );
    labels.push(
      `<text x="3" y="${y - 3}" font-size="${fontSize}" font-family="sans-serif" fill="rgb(255,0,200)">${i * 10}</text>`
    );
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${lines.join("")}${labels.join("")}</svg>`;
}

/**
 * Bild fürs Modell vorbereiten: verkleinern, Raster drüber, als PNG (Linien
 * und Ziffern bleiben scharf; JPEG würde sie verschmieren).
 */
export async function prepareImageForDetection(input: Buffer): Promise<Buffer> {
  const { default: sharp } = await import("sharp");
  const resized = await sharp(input)
    .rotate()
    .resize({ width: DETECT_MAX_EDGE, height: DETECT_MAX_EDGE, fit: "inside", withoutEnlargement: true })
    .flatten({ background: "#ffffff" })
    .png()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = resized.info;
  const overlay = Buffer.from(buildGridOverlaySvg(width, height));

  return sharp(resized.data)
    .composite([{ input: overlay, top: 0, left: 0 }])
    .png({ compressionLevel: 8 })
    .toBuffer();
}

/** Ruft die Claude API auf und gibt den reinen Antworttext zurück. */
export async function askModelForTables(imagePng: Buffer): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY fehlt");
  }
  const model = process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_DETECT_MODEL;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55_000);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      // Kein temperature-Parameter: aktuelle Modelle lehnen ihn ab
      // ("temperature is deprecated for this model").
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: "image/png", data: imagePng.toString("base64") }
              },
              { type: "text", text: DETECT_PROMPT }
            ]
          }
        ]
      })
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Claude API antwortete mit ${res.status}: ${body.slice(0, 300)}`);
    }

    const data = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text = (data.content ?? [])
      .filter((c) => c.type === "text" && typeof c.text === "string")
      .map((c) => c.text)
      .join("\n");
    if (!text.trim()) {
      throw new Error("Leere Antwort vom Modell");
    }
    return text;
  } finally {
    clearTimeout(timeout);
  }
}
