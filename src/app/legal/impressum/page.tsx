import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function ImpressumPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="text-display mb-6 text-3xl uppercase text-paper">Impressum</h1>
        <div className="mt-8 space-y-4 text-paper/70">
          <p>
            Kadir Alik
            <br />
            Schleiermacher Str. 23
            <br />
            10961 Berlin
          </p>
          <p>
            Kontakt:
            <br />
            E-Mail: kandir1997@googlemail.com
          </p>
          <p>
            Steuernummer: 14/204/05109
            <br />
            Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV: Kadir Alik
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
