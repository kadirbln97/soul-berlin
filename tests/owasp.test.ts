import { test } from "node:test";
import assert from "node:assert/strict";
import { csvField, csvRow, csvSafeValue } from "../src/lib/csv";
import { appSecretProblem } from "../src/lib/appSecret";
import { fileTypeMatches, sniffFileType } from "../src/lib/fileType";

// Regressionstests zu den Befunden aus dem OWASP-Durchgang.

test("CSV: Formeln werden zu Text", () => {
  for (const boese of [
    '=HYPERLINK("http://boese.de","klick")',
    "+1+1",
    "-2+3",
    "@SUM(A1)",
    "\t=cmd|'/c calc'!A0"
  ]) {
    const feld = csvField(boese);
    assert.ok(feld.startsWith(`"'`), `nicht entschärft: ${boese}`);
  }
});

test("CSV: normale Werte bleiben unverändert", () => {
  assert.equal(csvSafeValue("Kadir Alik"), "Kadir Alik");
  assert.equal(csvField("Kadir Alik"), '"Kadir Alik"');
  assert.equal(csvField(""), '""');
  assert.equal(csvField(null), '""');
});

test("CSV: Anführungszeichen und Semikolon zerlegen die Zeile nicht", () => {
  assert.equal(csvField('Max "Maxi" Mustermann'), '"Max ""Maxi"" Mustermann"');
  assert.equal(csvRow(["a;b", "c"]), '"a;b";"c"');
});

test("APP_SECRET: zu kurz, leer oder Platzhalter wird abgelehnt", () => {
  assert.match(appSecretProblem(undefined) ?? "", /fehlt/);
  assert.match(appSecretProblem("") ?? "", /fehlt/);
  assert.match(appSecretProblem("change-me-to-a-long-random-string") ?? "", /Platzhalter/);
  assert.match(appSecretProblem("kurz") ?? "", /zu kurz/);
  assert.match(appSecretProblem("a".repeat(31)) ?? "", /zu kurz/);
  assert.equal(appSecretProblem("a".repeat(32)), null);
  assert.equal(appSecretProblem("f3c1".repeat(16)), null);
});

const kopf = (bytes: number[]) => Uint8Array.from([...bytes, ...Array(16).fill(0)]);
const ascii = (text: string) => [...text].map((c) => c.charCodeAt(0));

test("Dateityp wird am Inhalt erkannt", () => {
  assert.equal(sniffFileType(kopf([0xff, 0xd8, 0xff, 0xe0])), "image/jpeg");
  assert.equal(sniffFileType(kopf([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), "image/png");
  assert.equal(sniffFileType(kopf(ascii("GIF89a"))), "image/gif");
  assert.equal(sniffFileType(kopf([...ascii("RIFF"), 0, 0, 0, 0, ...ascii("WEBP")])), "image/webp");
  assert.equal(sniffFileType(kopf([0x1a, 0x45, 0xdf, 0xa3])), "video/webm");
  assert.equal(sniffFileType(kopf([0, 0, 0, 0x20, ...ascii("ftypisom")])), "video/mp4");
  assert.equal(sniffFileType(kopf([0, 0, 0, 0x14, ...ascii("ftypqt  ")])), "video/quicktime");
});

test("Getarnte Dateien werden abgelehnt", () => {
  // HTML mit <script>, das sich als GIF ausgibt
  const html = kopf(ascii("<html><script>"));
  assert.equal(sniffFileType(html), null);
  assert.equal(fileTypeMatches("image/gif", sniffFileType(html)), false);
  // PNG-Inhalt, als GIF deklariert
  assert.equal(
    fileTypeMatches("image/gif", sniffFileType(kopf([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))),
    false
  );
  // Zu kurz zum Prüfen
  assert.equal(sniffFileType(Uint8Array.from([0xff, 0xd8])), null);
});

test("MP4 und MOV gelten als austauschbar (Handys benennen sie unterschiedlich)", () => {
  assert.equal(fileTypeMatches("video/quicktime", "video/mp4"), true);
  assert.equal(fileTypeMatches("video/mp4", "video/quicktime"), true);
  assert.equal(fileTypeMatches("image/jpeg", "video/mp4"), false);
});
