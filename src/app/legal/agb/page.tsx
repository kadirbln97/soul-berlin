import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getSiteContent } from "@/lib/siteContent";
import { renderText } from "@/lib/renderText";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AGB",
  description: "Allgemeine Geschäftsbedingungen für Tickets und Gästeliste bei SØUL Berlin.",
  alternates: { canonical: "/legal/agb" }
};

/**
 * Der Text kommt aus dem Baukasten (/admin/homepage, Gruppe „Rechtstexte").
 * Ohne gespeicherten Eintrag greift der Standardtext aus lib/legalDefaults.ts.
 *
 * renderText escaped den Inhalt vollständig, bevor es formatiert — deshalb
 * kann hier trotz dangerouslySetInnerHTML kein eingeschleuster Code laufen.
 * Siehe die Begründung in src/lib/renderText.ts.
 */
export default async function AgbPage() {
  const content = await getSiteContent();

  return (
    <>
      <Header />
      <main id="main-content" className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="text-display mb-6 text-3xl uppercase text-paper">AGB</h1>
        <div
          className="mt-8 space-y-4 leading-relaxed text-paper/70 [&>h2:first-child]:mt-0"
          dangerouslySetInnerHTML={{ __html: renderText(content.legal_agb) }}
        />
      </main>
      <Footer />
    </>
  );
}
