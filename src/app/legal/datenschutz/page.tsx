import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function DatenschutzPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="text-display mb-6 text-3xl uppercase text-paper">Datenschutzerklärung</h1>
        <div className="rounded-xl border border-soul-orange/40 bg-soul-orange/10 p-4 text-sm text-paper/80">
          Diese Seite ist inhaltlich vorbereitet, ersetzt aber keine Rechtsberatung. Vor allem bei
          kostenpflichtigen Ticketverkäufen empfehlen wir eine Prüfung durch eine
          Datenschutzberatung.
        </div>

        <div className="mt-8 space-y-6 text-paper/70">
          <section>
            <h2 className="mb-2 text-lg font-semibold text-paper">1. Verantwortlicher</h2>
            <p>
              Kadir Alik, Schleiermacher Str. 23, 10961 Berlin, kadir.alik@gmx.de — siehe auch
              Impressum. Ein Datenschutzbeauftragter ist gesetzlich nicht bestellt und aufgrund
              der Größe des Angebots nicht erforderlich.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-paper">2. Keine Tracking-Cookies</h2>
            <p>
              Diese Website setzt für Besucher:innen <strong>keine</strong> Cookies zu Marketing-
              oder Analysezwecken und bindet keine Drittanbieter-Tracker ein. Es wird deshalb
              bewusst auf einen Cookie-Consent-Banner verzichtet, da nach § 25 Abs. 2 TDDDG und
              der DSGVO für rein technisch notwendige Vorgänge keine Einwilligung nötig ist. Nur
              im passwortgeschützten Admin-Bereich wird ein technisch notwendiges Session-Cookie
              gesetzt (Login-Status), das nicht dem Tracking dient.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-paper">
              3. Server-Logfiles beim Aufruf der Website
            </h2>
            <p>
              Beim Aufruf dieser Website werden durch unseren Hosting-Dienstleister automatisch
              Daten in Server-Logfiles erfasst: IP-Adresse, Datum und Uhrzeit des Zugriffs,
              aufgerufene Seite, übertragene Datenmenge, Referrer sowie Browser- und
              Betriebssystem-Informationen. Diese Verarbeitung ist technisch erforderlich, um die
              Website auszuliefern und ihre Stabilität und Sicherheit zu gewährleisten.
              Rechtsgrundlage ist unser berechtigtes Interesse an einem sicheren, störungsfreien
              Betrieb (Art. 6 Abs. 1 lit. f DSGVO). Die Daten werden nach kurzer Zeit automatisch
              gelöscht und nicht mit anderen Datenquellen zusammengeführt.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-paper">
              4. Ticketkauf & Gästelisten-Anmeldung
            </h2>
            <p className="mb-2">
              Verarbeitet werden: Name, E-Mail-Adresse und — sofern freiwillig angegeben —
              Telefonnummer. Hinzu kommen die zum Ticket gehörenden Angaben (Event, ggf.
              Preisstaffel, Zahlungsstatus, Zeitpunkt des Check-ins am Einlass).
            </p>
            <p className="mb-2">
              <strong className="text-paper">Zwecke und Rechtsgrundlagen:</strong> Abwicklung des
              Ticketkaufs sowie Zusendung und Kontrolle des QR-Codes am Einlass als
              Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO); bei der kostenlosen Gästeliste auf
              Grundlage deiner Einwilligung (Art. 6 Abs. 1 lit. a DSGVO). Bei Zahlungen bestehen
              zusätzlich handels- und steuerrechtliche Aufbewahrungspflichten (Art. 6 Abs. 1 lit.
              c DSGVO).
            </p>
            <p>
              <strong className="text-paper">Zahlungsdaten:</strong> Kartendaten und ähnliche
              Zahlungsinformationen werden ausschließlich von unserem Zahlungsdienstleister Stripe
              verarbeitet. Wir erhalten und speichern keine vollständigen Zahlungsdaten, sondern
              lediglich die Information, ob und in welcher Höhe gezahlt wurde.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-paper">5. Kontaktformular</h2>
            <p>
              Wenn du uns über das Kontaktformular schreibst, verarbeiten wir die dort
              angegebenen Daten (Name, E-Mail-Adresse, Thema, Nachricht und bei
              Rückerstattungsanfragen zusätzlich Ticket-Nummer und Event), um deine Anfrage zu
              beantworten. Rechtsgrundlage ist unser berechtigtes Interesse an der Beantwortung
              von Anfragen (Art. 6 Abs. 1 lit. f DSGVO) bzw., wenn die Anfrage einen Vertrag
              betrifft, Art. 6 Abs. 1 lit. b DSGVO. Die Nachrichten werden gelöscht, sobald sie
              abschließend bearbeitet sind und keine Aufbewahrungspflichten entgegenstehen.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-paper">
              6. Fotos und Videos von Veranstaltungen
            </h2>
            <p>
              Auf unseren Veranstaltungen werden Foto- und Videoaufnahmen erstellt, die wir zur
              Dokumentation und Bewerbung künftiger Events auf dieser Website und in sozialen
              Netzwerken veröffentlichen. Auf die Aufnahmen wird am Einlass durch Hinweise
              aufmerksam gemacht. Rechtsgrundlage ist unser berechtigtes Interesse an der
              Öffentlichkeitsarbeit für unsere Veranstaltungen (Art. 6 Abs. 1 lit. f DSGVO) in
              Verbindung mit § 23 KunstUrhG. Wenn du auf einer Aufnahme erkennbar bist und deren
              Veröffentlichung nicht möchtest, genügt eine formlose Nachricht an
              kadir.alik@gmx.de — wir entfernen das Bild dann zeitnah von unserer Website.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-paper">
              7. Empfänger / Auftragsverarbeiter
            </h2>
            <ul className="list-inside list-disc space-y-1">
              <li>
                Stripe Payments Europe Ltd. (Zahlungsabwicklung) — Datenschutzerklärung:
                stripe.com/de/privacy
              </li>
              <li>Resend (Versand der Ticket- und Benachrichtigungs-E-Mails)</li>
              <li>Vercel (Hosting der Website und Speicherung hochgeladener Bilder/Videos)</li>
              <li>Neon (Betrieb der Datenbank, Serverstandort EU)</li>
            </ul>
            <p className="mt-2">
              Mit diesen Dienstleistern bestehen Verträge zur Auftragsverarbeitung nach Art. 28
              DSGVO. Eine Weitergabe deiner Daten zu anderen Zwecken, insbesondere zu Werbezwecken
              an Dritte, findet nicht statt.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-paper">
              8. Datenübermittlung in Drittländer
            </h2>
            <p>
              Einzelne der genannten Dienstleister haben ihren Sitz in den USA oder verarbeiten
              Daten dort. Soweit dabei personenbezogene Daten in ein Drittland übermittelt werden,
              erfolgt dies auf Grundlage des Angemessenheitsbeschlusses der EU-Kommission zum
              EU-US Data Privacy Framework bzw. auf Grundlage von Standardvertragsklauseln der
              EU-Kommission nach Art. 46 Abs. 2 lit. c DSGVO. Trotz dieser Garantien lässt sich
              nicht vollständig ausschließen, dass Behörden im Drittland auf Daten zugreifen.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-paper">9. Speicherdauer</h2>
            <p>
              Ticket- und Gästelistendaten werden 90 Tage nach dem jeweiligen Event gelöscht.
              Davon ausgenommen sind Daten, für die gesetzliche Aufbewahrungspflichten bestehen —
              insbesondere Zahlungs- und Rechnungsdaten, die nach § 147 AO und § 257 HGB bis zu
              zehn Jahre aufbewahrt werden müssen. Diese Daten werden für andere Zwecke gesperrt.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-paper">10. Deine Rechte</h2>
            <p className="mb-2">
              Du hast jederzeit das Recht auf Auskunft über die zu dir gespeicherten Daten (Art.
              15 DSGVO), auf Berichtigung (Art. 16), auf Löschung (Art. 17), auf Einschränkung der
              Verarbeitung (Art. 18), auf Datenübertragbarkeit (Art. 20) sowie auf Widerspruch
              gegen Verarbeitungen, die auf einem berechtigten Interesse beruhen (Art. 21 DSGVO).
            </p>
            <p>
              Soweit wir Daten auf Grundlage deiner Einwilligung verarbeiten, kannst du diese
              jederzeit mit Wirkung für die Zukunft widerrufen (Art. 7 Abs. 3 DSGVO); die
              Rechtmäßigkeit der bis dahin erfolgten Verarbeitung bleibt davon unberührt. Für
              alle Anliegen genügt eine formlose E-Mail an kadir.alik@gmx.de.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-paper">11. Beschwerderecht</h2>
            <p>
              Unabhängig davon kannst du dich bei einer Datenschutz-Aufsichtsbehörde beschweren.
              Für uns zuständig ist:
            </p>
            <p className="mt-2">
              Berliner Beauftragte für Datenschutz und Informationsfreiheit
              <br />
              Alt-Moabit 59–61, 10555 Berlin
              <br />
              www.datenschutz-berlin.de
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-paper">
              12. Keine automatisierte Entscheidungsfindung
            </h2>
            <p>
              Eine automatisierte Entscheidungsfindung oder ein Profiling im Sinne von Art. 22
              DSGVO findet nicht statt.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-paper">
              13. Künstliche Intelligenz
            </h2>
            <p>
              Deine personenbezogenen Daten — Name, E-Mail-Adresse, Telefonnummer, Ticket- und
              Check-in-Daten — werden nicht an KI-Systeme übermittelt und nicht zum Training
              von KI-Modellen verwendet. Auf dieser Website ist kein Chatbot und kein
              KI-Assistent im Einsatz; der Einlass-Scanner liest ausschließlich den QR-Code auf
              dem Ticket und wertet keine biometrischen Merkmale aus.
            </p>
            <p className="mt-2">
              Wo wir KI bei der Erstellung von Inhalten dieser Website einsetzen und wie
              KI-generierte Bilder gekennzeichnet sind, erklären wir im{" "}
              <Link href="/legal/impressum" className="text-soul-orange hover:underline">
                Impressum
              </Link>
              .
            </p>
          </section>

          <p className="pt-2 text-xs text-paper/60">Stand: August 2026</p>
        </div>
      </main>
      <Footer />
    </>
  );
}
