import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function AgbPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="text-display mb-6 text-3xl uppercase text-paper">
          Allgemeine Geschäftsbedingungen
        </h1>
        <div className="rounded-xl border border-soul-orange/40 bg-soul-orange/10 p-4 text-sm text-paper/80">
          Platzhalter — vor dem Live-Gang unbedingt echte, rechtssichere AGB (inkl. Storno-/
          Widerrufsbedingungen für Ticketkäufe) einsetzen, idealerweise anwaltlich geprüft.
        </div>
        <div className="mt-8 space-y-4 text-paper/70">
          <p>1. Geltungsbereich — [Text ergänzen]</p>
          <p>2. Vertragsschluss beim Ticketkauf — [Text ergänzen]</p>
          <p>3. Preise & Zahlung (Stripe) — [Text ergänzen]</p>
          <p>4. Widerrufsrecht / Stornierung — [Text ergänzen]</p>
          <p>5. Einlassbedingungen — [Text ergänzen]</p>
          <p>6. Haftung — [Text ergänzen]</p>
        </div>
      </main>
      <Footer />
    </>
  );
}
