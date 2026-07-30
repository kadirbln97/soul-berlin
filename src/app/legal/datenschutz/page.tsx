import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function DatenschutzPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="text-display mb-6 text-3xl uppercase text-paper">Datenschutzerklärung</h1>
        <div className="rounded-xl border border-soul-orange/40 bg-soul-orange/10 p-4 text-sm text-paper/80">
          Diese Seite ist inhaltlich vorbereitet, ersetzt aber keine Rechtsberatung. Bitte die
          eckigen Klammern [...] ausfüllen und vor dem Live-Gang von einem Anwalt/einer
          Datenschutzberatung prüfen lassen.
        </div>

        <div className="mt-8 space-y-6 text-paper/70">
          <section>
            <h2 className="mb-2 text-lg font-semibold text-paper">1. Verantwortlicher</h2>
            <p>[Name/Firma], [Adresse], [E-Mail] — siehe auch Impressum.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-paper">
              2. Keine Tracking-Cookies
            </h2>
            <p>
              Diese Website setzt für Besucher:innen <strong>keine</strong> Cookies zu
              Marketing- oder Analysezwecken und bindet keine Drittanbieter-Tracker ein. Es wird
              deshalb bewusst auf einen Cookie-Consent-Banner verzichtet, da nach ePrivacy/DSGVO
              keine Einwilligung für rein technisch notwendige Vorgänge nötig ist. Nur im
              passwortgeschützten Admin-Bereich wird ein technisch notwendiges Session-Cookie
              gesetzt (Login-Status), das nicht dem Tracking dient.
              <br />
              <em>
                Hinweis: Solltest du später Analyse-Tools (z.B. Google Analytics), Werbepixel
                oder Social-Media-Embeds einbinden, muss diese Erklärung ergänzt und ein
                Cookie-Consent-Banner nachgerüstet werden.
              </em>
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-paper">
              3. Welche Daten wir bei Ticket-/Gästelisten-Anmeldung verarbeiten
            </h2>
            <p>
              Name, E-Mail-Adresse, optional Telefonnummer. Bei Kartenzahlung zusätzlich
              Zahlungsdaten — diese werden ausschließlich von unserem Zahlungsdienstleister
              Stripe verarbeitet, nicht von uns gespeichert.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-paper">4. Zwecke & Rechtsgrundlage</h2>
            <p>
              Vertragsabwicklung beim Ticketkauf (Art. 6 Abs. 1 lit. b DSGVO), Einwilligung bei
              kostenloser Gästelisten-Anmeldung (Art. 6 Abs. 1 lit. a DSGVO), Einlasskontrolle per
              QR-Code am Veranstaltungsort.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-paper">5. Empfänger / Auftragsverarbeiter</h2>
            <ul className="list-inside list-disc space-y-1">
              <li>Stripe (Zahlungsabwicklung) — eigene Datenschutzerklärung: stripe.com/de/privacy</li>
              <li>[E-Mail-Anbieter, z.B. Resend/Brevo] (Versand des Ticket-QR-Codes)</li>
              <li>[Hosting-Anbieter, z.B. Vercel/Supabase] (Serverbetrieb & Datenbank)</li>
            </ul>
            <p className="mt-2">
              Mit allen genannten Dienstleistern besteht bzw. wird ein Auftragsverarbeitungsvertrag
              (AVV) nach Art. 28 DSGVO abgeschlossen.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-paper">6. Speicherdauer</h2>
            <p>
              Ticket-/Gästelistendaten werden [z.B. 90 Tage nach dem Event] aufbewahrt, sofern
              keine gesetzlichen Aufbewahrungspflichten (z.B. Rechnungsdaten bei Zahlungen)
              entgegenstehen, und danach gelöscht.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-paper">7. Deine Rechte</h2>
            <p>
              Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der
              Verarbeitung, Datenübertragbarkeit und Widerspruch (Art. 15–21 DSGVO). Für eine
              Löschanfrage genügt eine E-Mail an [Kontakt-E-Mail] — wir löschen deine Daten dann
              vollständig aus unserem System.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-paper">8. Beschwerderecht</h2>
            <p>
              Du kannst dich bei der zuständigen Datenschutzaufsichtsbehörde beschweren, z.B. der
              Berliner Beauftragten für Datenschutz und Informationsfreiheit.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
