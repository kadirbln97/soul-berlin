import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getSiteContent } from "@/lib/siteContent";
import { renderText } from "@/lib/renderText";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Impressum",
  description: "Impressum und Anbieterkennzeichnung von SØUL Berlin.",
  alternates: { canonical: "/legal/impressum" }
};

/**
 * Der Text kommt aus dem Baukasten (/admin/homepage, Gruppe „Rechtstexte").
 * Ohne gespeicherten Eintrag greift der Standardtext aus lib/legalDefaults.ts.
 *
 * renderText escaped den Inhalt vollständig, bevor es formatiert — deshalb
 * kann hier trotz dangerouslySetInnerHTML kein eingeschleuster Code laufen.
 * Siehe die Begründung in src/lib/renderText.ts.
 */
export default async function ImpressumPage() {
  const content = await getSiteContent();

  return (
    <>
      <Header />
      <main id="main-content" className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="text-display mb-6 text-3xl uppercase text-paper">Impressum</h1>
        <div
          className="mt-8 space-y-4 leading-relaxed text-paper/70 [&>h2:first-child]:mt-0"
          dangerouslySetInnerHTML={{ __html: renderText(content.legal_impressum) }}
        />
      </main>
      <Footer />
    </>
  );
}
