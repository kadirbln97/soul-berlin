import { escapeHtml } from "./escapeHtml";

/**
 * Wandelt die im Baukasten eingegebenen Texte in HTML um — bewusst mit einem
 * sehr kleinen Sprachumfang statt einer Markdown-Bibliothek.
 *
 * Unterstützt wird:
 *   ## Überschrift          → Zwischenüberschrift
 *   **fett**                → Fettschrift
 *   - Punkt                 → Aufzählung
 *   [Text](https://…)       → Link
 *   Leerzeile               → neuer Absatz
 *
 * SICHERHEIT: Der Text wird IMMER zuerst vollständig escaped und erst danach
 * formatiert. Dadurch kann eingegebenes HTML nie ausgeführt werden — ein
 * <script> im Impressum landet als sichtbarer Text auf der Seite, nicht als
 * Code im Browser der Besucher. Das ist der Grund, warum hier kein fertiger
 * Markdown-Umsetzer verwendet wird: die meisten lassen HTML absichtlich durch.
 */

/** Nur Ziele, die wirklich Seitenaufrufe sind — kein javascript:, kein data:. */
function linkErlaubt(url: string) {
  return /^(https?:\/\/|mailto:|tel:|\/)/i.test(url.trim());
}

function inline(text: string) {
  // Reihenfolge wichtig: Links zuerst, damit Klammern in Linktexten nicht
  // vorher von der Fettschrift-Regel zerlegt werden.
  let s = text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (treffer, beschriftung, url) => {
    if (!linkErlaubt(url)) return treffer;
    const extern = /^https?:\/\//i.test(url);
    const zusatz = extern ? ' target="_blank" rel="noreferrer noopener"' : "";
    return `<a href="${url}" class="underline hover:text-soul-orange"${zusatz}>${beschriftung}</a>`;
  });

  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-paper">$1</strong>');
  return s;
}

export function renderText(quelle: string): string {
  // Schritt 1: alles unschädlich machen.
  const sicher = escapeHtml(quelle ?? "");

  // Schritt 2: in Blöcke zerlegen (Leerzeile trennt Absätze).
  const bloecke = sicher.split(/\n\s*\n/);
  const teile: string[] = [];

  for (const roh of bloecke) {
    const block = roh.trim();
    if (block === "") continue;

    const zeilen = block.split("\n").map((z) => z.trim());

    // Aufzählung: Block, dessen Zeilen alle mit "- " beginnen.
    if (zeilen.every((z) => z.startsWith("- "))) {
      const punkte = zeilen
        .map((z) => `<li>${inline(z.slice(2).trim())}</li>`)
        .join("");
      teile.push(`<ul class="list-disc space-y-1 pl-5">${punkte}</ul>`);
      continue;
    }

    // Überschrift: einzelne Zeile, die mit ## beginnt.
    if (zeilen.length === 1 && zeilen[0].startsWith("## ")) {
      teile.push(
        `<h2 class="mb-2 mt-8 text-lg font-semibold text-paper">${inline(
          zeilen[0].slice(3).trim()
        )}</h2>`
      );
      continue;
    }

    // Normaler Absatz. Einfache Zeilenumbrüche innerhalb eines Absatzes
    // bleiben erhalten — in Adressblöcken ist das genau das Gewünschte.
    teile.push(`<p>${inline(zeilen.join("<br />"))}</p>`);
  }

  return teile.join("\n");
}
