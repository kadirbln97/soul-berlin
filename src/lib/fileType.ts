/**
 * Dateityp aus dem Dateiinhalt bestimmen statt aus der Angabe des Browsers.
 *
 * Der Content-Type eines Uploads kommt vom Client und lässt sich frei
 * behaupten. JPEG, PNG und WebP werden bei uns ohnehin von sharp neu kodiert
 * — was auch immer drinsteckte, überlebt das nicht. GIFs und Videos gehen
 * dagegen unverändert in den Blob-Speicher. Deshalb hier ein Blick auf die
 * ersten Bytes: die "Magic Bytes" am Dateianfang verraten das echte Format.
 */

export type SniffedType =
  | "image/jpeg"
  | "image/png"
  | "image/gif"
  | "image/webp"
  | "video/mp4"
  | "video/webm"
  | "video/quicktime"
  | null;

function hasAscii(bytes: Uint8Array, offset: number, text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    if (bytes[offset + i] !== text.charCodeAt(i)) return false;
  }
  return true;
}

/** Erkennt das Format an den ersten Bytes; null = unbekannt/nicht erlaubt. */
export function sniffFileType(input: Uint8Array): SniffedType {
  const b = input;
  if (b.length < 12) return null;

  // JPEG: FF D8 FF
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a
  ) {
    return "image/png";
  }

  // GIF: "GIF87a" oder "GIF89a"
  if (hasAscii(b, 0, "GIF87a") || hasAscii(b, 0, "GIF89a")) return "image/gif";

  // WebP: "RIFF" .... "WEBP"
  if (hasAscii(b, 0, "RIFF") && hasAscii(b, 8, "WEBP")) return "image/webp";

  // WebM/Matroska: 1A 45 DF A3
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return "video/webm";

  // MP4/MOV: Box "ftyp" ab Byte 4, danach die Marke
  if (hasAscii(b, 4, "ftyp")) {
    const brand = String.fromCharCode(b[8], b[9], b[10], b[11]);
    if (brand === "qt  ") return "video/quicktime";
    return "video/mp4";
  }

  return null;
}

/**
 * Passt der erkannte Typ zur Angabe des Browsers?
 *
 * MP4 und QuickTime teilen sich das Containerformat und werden von Handys
 * uneinheitlich benannt — die beiden gelten deshalb als austauschbar.
 */
export function fileTypeMatches(declared: string, sniffed: SniffedType): boolean {
  if (!sniffed) return false;
  if (declared === sniffed) return true;
  const mp4Familie = new Set(["video/mp4", "video/quicktime"]);
  return mp4Familie.has(declared) && mp4Familie.has(sniffed);
}
