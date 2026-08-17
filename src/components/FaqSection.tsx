import type { SiteContent } from "@/lib/siteContent";

/** Plätze aus dem Baukasten (siehe SITE_CONTENT_FIELDS, Gruppe "Häufige Fragen"). */
const FAQ_SLOTS = [1, 2, 3, 4, 5, 6];

/**
 * Kleine Symbole vor der Frage — feste Reihenfolge, passend zu den
 * Standardfragen (Alter, Tickets, Musik, Dresscode, Reservierung). Ändert
 * jemand die Reihenfolge im Baukasten, bleibt das Symbol trotzdem sinnvoll
 * neutral, weil es ab Platz 6 auf das Fragezeichen zurückfällt.
 */
function SlotIcon({ slot }: { slot: number }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
    className: "shrink-0 text-paper/50"
  };

  switch (slot) {
    case 2: // Tickets
      return (
        <svg {...common}>
          <path d="M20.6 8.4V6.8A1.8 1.8 0 0 0 18.8 5H5.2A1.8 1.8 0 0 0 3.4 6.8v1.6a2.4 2.4 0 0 1 0 7.2v1.6A1.8 1.8 0 0 0 5.2 19h13.6a1.8 1.8 0 0 0 1.8-1.8v-1.6a2.4 2.4 0 0 1 0-7.2Z" />
          <path d="M14 5v14" strokeDasharray="2 2.5" />
        </svg>
      );
    case 3: // Musik
      return (
        <svg {...common}>
          <path d="M9 18V6l10-2v12" />
          <circle cx="6.5" cy="18" r="2.5" />
          <circle cx="16.5" cy="16" r="2.5" />
        </svg>
      );
    case 4: // Dresscode
      return (
        <svg {...common}>
          <path d="M9 3 4 5.5 5.5 10 8 9.2V21h8V9.2l2.5.8L20 5.5 15 3a3 3 0 0 1-6 0Z" />
        </svg>
      );
    case 5: // Reservierung
      return (
        <svg {...common}>
          <path d="M7.5 3.5h-3A1.5 1.5 0 0 0 3 5.2C3 13.4 10.6 21 18.8 21a1.5 1.5 0 0 0 1.7-1.5v-3l-4-1.5-2 2a13.5 13.5 0 0 1-6.5-6.5l2-2Z" />
        </svg>
      );
    default: // Alter & alles Weitere
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.6 9.3a2.5 2.5 0 1 1 3.3 2.4c-.6.2-.9.8-.9 1.4v.4" />
          <path d="M12 17h.01" />
        </svg>
      );
  }
}

/**
 * Häufige Fragen als aufklappbare Liste am Ende der Startseite.
 *
 * Bewusst mit <details>/<summary> statt eigenem JavaScript: das Auf- und
 * Zuklappen funktioniert dadurch auch ohne JS, ist von Haus aus per Tastatur
 * bedienbar und wird von Screenreadern korrekt als Ausklappbereich angesagt.
 * Die weiche Höhenanimation ist reine Zugabe (siehe .faq-item in globals.css) —
 * wo der Browser sie nicht kann, klappt es eben ohne Übergang auf.
 */
export function FaqSection({ content }: { content: SiteContent }) {
  const items = FAQ_SLOTS.map((slot) => ({
    slot,
    question: (content[`faq_${slot}_question`] ?? "").trim(),
    answer: (content[`faq_${slot}_answer`] ?? "").trim()
  })).filter((item) => item.question !== "" && item.answer !== "");

  if (items.length === 0) return null;

  // Damit Google die Fragen als FAQ erkennen kann. Kostet nichts und passt
  // zur gerade eingerichteten Search Console.
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer }
    }))
  };

  return (
    <section className="mx-auto max-w-3xl px-5 pb-24">
      <h2 className="text-display mb-8 text-2xl uppercase text-paper sm:text-3xl">
        {content.faq_heading}
      </h2>

      <div className="flex flex-col divide-y divide-paper/10 border-y border-paper/10">
        {items.map((item) => (
          <details key={item.slot} className="faq-item group">
            <summary className="flex cursor-pointer list-none items-center gap-3 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soul-orange focus-visible:ring-offset-2 focus-visible:ring-offset-ink">
              <SlotIcon slot={item.slot} />
              <span className="flex-1 text-sm font-semibold text-paper sm:text-base">
                {item.question}
              </span>
              {/* Der Pfeil dreht sich beim Aufklappen — die einzige Bewegung,
                  die hier wirklich etwas erklärt (Zustand offen/zu). */}
              <svg
                aria-hidden="true"
                width={18}
                height={18}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="faq-chevron shrink-0 text-paper/40"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </summary>
            <p className="pb-5 pl-[30px] pr-1 text-sm leading-relaxed text-paper/70">
              {item.answer}
            </p>
          </details>
        ))}
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </section>
  );
}
