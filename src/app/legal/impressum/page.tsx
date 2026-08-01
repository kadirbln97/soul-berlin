import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function ImpressumPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="text-display mb-6 text-3xl uppercase text-paper">Impressum</h1>

        <div className="mt-8 space-y-6 text-paper/70">
          <section>
            <h2 className="mb-2 text-lg font-semibold text-paper">
              Angaben gemäß § 5 DDG
            </h2>
            <p>
              Kadir Alik
              <br />
              Schleiermacher Str. 23
              <br />
              10961 Berlin
              <br />
              Deutschland
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-paper">Kontakt</h2>
            <p>
              E-Mail: kadir.alik@gmx.de
              <br />
              Kontaktformular:{" "}
              <Link href="/kontakt" className="underline hover:text-soul-orange">
                soulberlin.de/kontakt
              </Link>
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-paper">Umsatzsteuer</h2>
            <p>
              Als Kleinunternehmer im Sinne von § 19 Abs. 1 UStG wird keine Umsatzsteuer
              berechnet und daher auch nicht ausgewiesen.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-paper">
              Verantwortlich für den Inhalt
            </h2>
            <p>Kadir Alik, Anschrift wie oben (§ 18 Abs. 2 MStV).</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-paper">
              Verbraucherstreitbeilegung
            </h2>
            <p>
              Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor
              einer Verbraucherschlichtungsstelle teilzunehmen. Anliegen klären wir gerne
              direkt — schreib uns einfach über das Kontaktformular oder per E-Mail.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-paper">Haftung für Links</h2>
            <p>
              Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir
              keinen Einfluss haben. Für diese fremden Inhalte kann keine Gewähr übernommen
              werden; verantwortlich ist stets der jeweilige Anbieter. Bei Bekanntwerden von
              Rechtsverletzungen entfernen wir derartige Links umgehend.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-paper">Urheberrecht</h2>
            <p>
              Die auf dieser Website veröffentlichten Inhalte, Fotos und Videos unterliegen dem
              deutschen Urheberrecht. Eine Vervielfältigung oder Verwendung außerhalb der
              gesetzlich zulässigen Fälle bedarf unserer vorherigen schriftlichen Zustimmung.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
