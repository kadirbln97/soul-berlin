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
          Diese AGB sind inhaltlich vorbereitet, ersetzen aber keine Rechtsberatung. Vor allem bei
          kostenpflichtigen Ticketverkäufen empfehlen wir eine anwaltliche Prüfung.
        </div>
        <div className="mt-8 space-y-6 text-paper/70">
          <section>
            <h2 className="mb-2 text-lg font-semibold text-paper">1. Geltungsbereich</h2>
            <p>
              Diese Allgemeinen Geschäftsbedingungen gelten für alle Anmeldungen zur Gästeliste und
              alle Ticketkäufe über soul-berlin.vercel.app, Betreiber siehe Impressum. Mit der
              Anmeldung bzw. dem Ticketkauf erkennst du diese AGB an.
            </p>
          </section>
          <section>
            <h2 className="mb-2 text-lg font-semibold text-paper">2. Vertragsschluss</h2>
            <p>
              Bei kostenpflichtigen Tickets kommt der Vertrag mit erfolgreicher Zahlungsabwicklung
              über unseren Zahlungsdienstleister Stripe zustande; du erhältst danach dein Ticket
              mit QR-Code per E-Mail. Bei der Gästeliste kommt der Vertrag mit Absenden des
              Anmeldeformulars und Erhalt der Bestätigungs-E-Mail zustande.
            </p>
          </section>
          <section>
            <h2 className="mb-2 text-lg font-semibold text-paper">3. Preise & Zahlung</h2>
            <p>
              Bei kostenpflichtigen Tickets wird der angezeigte Preis online per Kreditkarte bzw.
              den von Stripe angebotenen Zahlungsmethoden fällig. Bei Gästelisten-Events mit
              Preisstaffeln ("bis HH:MM Uhr X €") ist der angezeigte Betrag rein informativ — es
              erfolgt keine Online-Zahlung, die Bezahlung erfolgt bar oder per Karte direkt an der
              Abendkasse vor Ort. Alle Preise verstehen sich in Euro.
            </p>
          </section>
          <section>
            <h2 className="mb-2 text-lg font-semibold text-paper">4. Widerrufsrecht / Stornierung</h2>
            <p>
              Für online gekaufte Tickets besteht grundsätzlich ein gesetzliches Widerrufsrecht
              nach § 355 BGB, das jedoch bei Verträgen über Freizeitveranstaltungen mit einem
              festgelegten Termin gemäß § 312g Abs. 2 Nr. 9 BGB erlischt, sobald das Ticket
              ausgestellt wurde. Eine Stornierung durch uns (z.B. bei Ausfall des Events) wird per
              E-Mail mitgeteilt; bereits gezahlte Beträge werden in diesem Fall über Stripe
              zurückerstattet. Gästelisten-Anmeldungen können jederzeit formlos per E-Mail
              storniert werden.
            </p>
          </section>
          <section>
            <h2 className="mb-2 text-lg font-semibold text-paper">5. Einlassbedingungen</h2>
            <p>
              Der Einlass erfolgt gegen Vorlage des QR-Codes aus der Bestätigungs-E-Mail
              (digital oder ausgedruckt) sowie eines gültigen Lichtbildausweises. Jeder QR-Code ist
              nur einmal gültig. Der Veranstalter behält sich vor, den Einlass gemäß Hausrecht zu
              verweigern (z.B. bei Überfüllung, Vermummung, sichtbarer Alkoholisierung oder
              Verstoß gegen die Clubregeln); ein Anspruch auf Erstattung besteht in diesem Fall
              nicht, sofern die Verweigerung durch das Verhalten der Person begründet ist.
              Mindestalter und Dresscode können je Event abweichen und werden auf der jeweiligen
              Eventseite angegeben.
            </p>
          </section>
          <section>
            <h2 className="mb-2 text-lg font-semibold text-paper">6. Haftung</h2>
            <p>
              Wir haften unbeschränkt für Vorsatz und grobe Fahrlässigkeit sowie nach den
              Vorschriften des Produkthaftungsgesetzes. Bei leicht fahrlässiger Verletzung
              wesentlicher Vertragspflichten (Kardinalpflichten) ist die Haftung auf den
              vertragstypisch vorhersehbaren Schaden begrenzt. Im Übrigen ist die Haftung für leicht
              fahrlässige Pflichtverletzungen ausgeschlossen. Für Garderobe und mitgebrachte
              Gegenstände wird keine Haftung übernommen, soweit gesetzlich zulässig.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
