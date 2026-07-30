import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function ImpressumPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="text-display mb-6 text-3xl uppercase text-paper">Impressum</h1>
        <div className="rounded-xl border border-soul-orange/40 bg-soul-orange/10 p-4 text-sm text-paper/80">
          Platzhalter — hier fehlen noch deine echten Pflichtangaben nach § 5 TMG /
          Anbieterkennzeichnung. Bitte vor dem Live-Gang ausfüllen bzw. von einem Anwalt/Steuerberater
          prüfen lassen (insbesondere wenn Tickets verkauft werden).
        </div>
        <div className="mt-8 space-y-4 text-paper/70">
          <p>
            [Vor- und Nachname bzw. Firmenname]
            <br />
            [Straße und Hausnummer]
            <br />
            [PLZ und Ort]
          </p>
          <p>
            Kontakt:
            <br />
            E-Mail: [deine@email.de]
            <br />
            Telefon: [optional]
          </p>
          <p>
            Umsatzsteuer-ID (falls vorhanden): [DE...]
            <br />
            Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV: [Name]
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
