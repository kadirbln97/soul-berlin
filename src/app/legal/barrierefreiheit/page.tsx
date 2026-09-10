import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Barrierefreiheit",
  description:
    "Erklärung zur Barrierefreiheit von soulberlin.de: was wir umsetzen, wo es Grenzen gibt und wie du uns Hindernisse meldest.",
  alternates: { canonical: "/legal/barrierefreiheit" }
};

/**
 * Freiwillige Erklärung zur Barrierefreiheit.
 *
 * Als Kleinstunternehmen sind wir von der Pflicht des
 * Barrierefreiheitsstärkungsgesetzes für Dienstleistungen ausgenommen
 * (§ 3 Abs. 3 BFSG). Die Erklärung steht trotzdem hier, weil sie zum
 * Anspruch der Seite passt und weil sie den Weg für Rückmeldungen öffnet.
 *
 * Bewusst fest im Code statt im Baukasten: der Text beschreibt den
 * technischen Stand der Seite und gehört zu dem, was sich mit dem Code
 * ändert — nicht zu dem, was sich zwischen Events ändert.
 */
export default function AccessibilityPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="text-display mb-6 text-3xl uppercase text-paper">
          Erklärung zur Barrierefreiheit
        </h1>
        <div className="mt-8 space-y-6 leading-relaxed text-paper/70">
          <p>
            Wir möchten, dass jede:r diese Website nutzen kann — unabhängig davon, wie sie
            oder er liest, hört, sieht oder bedient. Diese Erklärung beschreibt, was wir dafür
            tun, wo es noch Grenzen gibt und wie du uns Hindernisse meldest. Sie bezieht sich
            auf die Website soulberlin.de.
          </p>

          <h2 className="text-display text-xl uppercase text-paper">Was wir umsetzen</h2>
          <p>
            Wir orientieren uns an den Web Content Accessibility Guidelines (WCAG) 2.2 auf
            Stufe AA. Konkret bedeutet das unter anderem: Alle Inhalte lassen sich mit der
            Tastatur erreichen und bedienen, Bilder tragen Alternativtexte, Formularfelder
            sind mit ihren Beschriftungen verknüpft, Farbkontraste erfüllen die Mindestwerte,
            und die Seite bleibt bei starker Vergrößerung nutzbar. Bewegungen werden
            reduziert, wenn dein Gerät das wünscht. Der Tischplan lässt sich auch über eine
            Liste bedienen, nicht nur über die Grafik. Wir prüfen die Seite regelmäßig mit
            automatischen Werkzeugen und von Hand.
          </p>

          <h2 className="text-display text-xl uppercase text-paper">Wo es Grenzen gibt</h2>
          <p>
            Event-Flyer sind Grafiken mit eingebettetem Text; die wesentlichen Angaben
            (Datum, Ort, Line-up, Preise) stehen deshalb immer zusätzlich als Text auf der
            Eventseite. Videos in der Galerie sind Stimmungsaufnahmen ohne Sprache und haben
            keine Untertitel. Der Ticketkauf über externe Anbieter (Stripe, Eventbrite) und
            die Tischreservierung über WhatsApp führen auf Seiten, deren Barrierefreiheit
            wir nicht beeinflussen können.
          </p>

          <h2 className="text-display text-xl uppercase text-paper">Hindernis melden</h2>
          <p>
            Stößt du auf etwas, das dich an der Nutzung hindert, sag uns bitte Bescheid —
            über das <Link href="/kontakt" className="text-soul-orange hover:underline">Kontaktformular</Link> oder
            per E-Mail an{" "}
            <a href="mailto:kadir.alik@gmx.de" className="text-soul-orange hover:underline">
              kadir.alik@gmx.de
            </a>
            . Wir melden uns in der Regel innerhalb von drei Werktagen und kümmern uns
            darum. Wenn du Tickets oder einen Gästelistenplatz brauchst und die Seite dich
            dabei ausbremst, schreib uns einfach — wir erledigen das dann direkt für dich.
          </p>

          <h2 className="text-display text-xl uppercase text-paper">Rechtlicher Rahmen</h2>
          <p>
            Diese Erklärung geben wir freiwillig ab. Als Kleinstunternehmen fällt unser
            Angebot nicht unter die Pflichten des Barrierefreiheitsstärkungsgesetzes für
            Dienstleistungen (§ 3 Abs. 3 BFSG). Zuständige Durchsetzungsstelle für
            Beschwerden ist die Marktüberwachungsbehörde des Landes Berlin; wir würden uns
            aber freuen, wenn du dich zuerst an uns wendest.
          </p>

          <p className="text-sm text-paper/60">Stand: September 2026</p>
        </div>
      </main>
      <Footer />
    </>
  );
}
