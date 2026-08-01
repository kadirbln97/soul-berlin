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
              alle Ticketkäufe über soulberlin.de, Betreiber siehe Impressum. Mit der
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
              Abendkasse vor Ort. Alle Preise verstehen sich in Euro und sind Endpreise. Als
              Kleinunternehmer im Sinne von § 19 Abs. 1 UStG wird keine Umsatzsteuer berechnet und
              daher auch nicht ausgewiesen.
            </p>
          </section>
          <section>
            <h2 className="mb-2 text-lg font-semibold text-paper">
              4. Widerrufsrecht, Stornierung & Rückerstattung
            </h2>
            <p className="mb-3">
              <strong className="text-paper">4.1 Kein gesetzliches Widerrufsrecht.</strong> Bei
              Verträgen über Freizeitveranstaltungen, die für einen bestimmten Zeitpunkt
              vorgesehen sind, besteht gemäß § 312g Abs. 2 Nr. 9 BGB kein Widerrufsrecht. Online
              gekaufte Tickets sind daher grundsätzlich vom Umtausch und von der Rückerstattung
              ausgeschlossen, soweit nachfolgend nichts anderes geregelt ist.
            </p>
            <p className="mb-3">
              <strong className="text-paper">4.2 Nichterscheinen.</strong> Erscheint eine Person
              nicht oder zu spät zur Veranstaltung oder verlässt sie die Veranstaltung vorzeitig,
              besteht kein Anspruch auf Erstattung des Ticketpreises.
            </p>
            <p className="mb-3">
              <strong className="text-paper">4.3 Absage der Veranstaltung.</strong> Wird eine
              Veranstaltung abgesagt, wird der volle Ticketpreis erstattet. Die Rückzahlung
              erfolgt automatisch über den ursprünglich genutzten Zahlungsweg (Stripe); ein
              gesonderter Antrag ist nicht erforderlich. Die Information erfolgt per E-Mail an
              die bei der Buchung angegebene Adresse.
            </p>
            <p className="mb-3">
              <strong className="text-paper">4.4 Verlegung der Veranstaltung.</strong> Wird eine
              Veranstaltung auf einen anderen Tag oder eine andere Uhrzeit verlegt, behält das
              Ticket für den Ersatztermin seine Gültigkeit. Wer den Ersatztermin nicht
              wahrnehmen möchte, kann die Erstattung des vollen Ticketpreises verlangen; das
              Verlangen ist innerhalb von 14 Tagen ab Bekanntgabe der Verlegung über das
              Kontaktformular (Thema „Ticket-Rückerstattung") oder per E-Mail geltend zu machen.
              Nach Ablauf dieser Frist gilt das Ticket für den Ersatztermin.
            </p>
            <p className="mb-3">
              <strong className="text-paper">4.5 Abweisung am Einlass.</strong> Wird einer Person
              der Einlass aus Gründen verweigert, die nicht in ihrer Person oder ihrem Verhalten
              liegen — etwa wegen Überfüllung, Erreichen der Kapazitätsgrenze oder aus
              organisatorischen Gründen —, wird der volle Ticketpreis erstattet. Erfolgt die
              Verweigerung des Einlasses dagegen aufgrund des Verhaltens oder des Zustands der
              Person (siehe Ziffer 5), besteht kein Anspruch auf Erstattung; eine Erstattung aus
              Kulanz im Einzelfall bleibt hiervon unberührt.
            </p>
            <p className="mb-3">
              <strong className="text-paper">4.6 Durchführung der Rückerstattung.</strong>{" "}
              Erstattungen erfolgen ausschließlich auf das ursprünglich verwendete Zahlungsmittel
              und in der Regel innerhalb von 14 Tagen. Etwaige Gebühren des
              Zahlungsdienstleisters werden nicht gesondert in Rechnung gestellt. Mit der
              Erstattung verliert der zugehörige QR-Code seine Gültigkeit.
            </p>
            <p>
              <strong className="text-paper">4.7 Gästeliste.</strong> Anmeldungen zur Gästeliste
              sind unverbindlich und können jederzeit formlos per E-Mail storniert werden. Da
              hierbei keine Online-Zahlung erfolgt, entfällt eine Rückerstattung.
            </p>
          </section>
          <section>
            <h2 className="mb-2 text-lg font-semibold text-paper">5. Einlassbedingungen</h2>
            <p>
              Der Einlass erfolgt gegen Vorlage des QR-Codes aus der Bestätigungs-E-Mail
              (digital oder ausgedruckt) sowie eines gültigen Lichtbildausweises. Jeder QR-Code ist
              nur einmal gültig. Der Veranstalter behält sich vor, den Einlass gemäß Hausrecht zu
              verweigern (z.B. bei Überfüllung, Vermummung, sichtbarer Alkoholisierung oder
              Verstoß gegen die Clubregeln). Ob in einem solchen Fall eine Erstattung erfolgt,
              richtet sich nach Ziffer 4.5. Mindestalter und Dresscode können je Event abweichen
              und werden auf der jeweiligen Eventseite angegeben.
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
          <section>
            <h2 className="mb-2 text-lg font-semibold text-paper">
              7. Bild- und Tonaufnahmen
            </h2>
            <p>
              Auf unseren Veranstaltungen werden Foto- und Videoaufnahmen erstellt und zur
              Bewerbung künftiger Events veröffentlicht. Auf die Aufnahmen wird am Einlass
              hingewiesen. Wer nicht abgebildet werden möchte, kann dies vor Ort dem Team
              mitteilen; bereits veröffentlichte Aufnahmen entfernen wir auf formlose Anfrage
              (Details siehe Datenschutzerklärung).
            </p>
          </section>
          <section>
            <h2 className="mb-2 text-lg font-semibold text-paper">
              8. Streitbeilegung & Schlussbestimmungen
            </h2>
            <p>
              Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor
              einer Verbraucherschlichtungsstelle teilzunehmen. Es gilt das Recht der
              Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts; zwingende
              Verbraucherschutzvorschriften des Staates, in dem der Verbraucher seinen
              gewöhnlichen Aufenthalt hat, bleiben unberührt. Sollte eine Bestimmung dieser AGB
              unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
            </p>
          </section>

          <p className="pt-2 text-xs text-paper/40">Stand: August 2026</p>
        </div>
      </main>
      <Footer />
    </>
  );
}
