import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function DatenschutzPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="text-display mb-6 text-3xl uppercase text-paper">Datenschutzerklärung</h1>
        <div className="rounded-xl border border-soul-orange/40 bg-soul-orange/10 p-4 text-sm text-paper/80">
          Platzhalter — diese Seite verarbeitet personenbezogene Daten (Name, E-Mail, ggf.
          Telefon & Zahlungsdaten über Stripe). Vor dem Live-Gang eine vollständige,
          DSGVO-konforme Datenschutzerklärung einsetzen (z.B. mit einem Generator oder
          anwaltlich erstellt) — inkl. Angaben zu Stripe, SMTP-Anbieter und Hosting.
        </div>
        <div className="mt-8 space-y-4 text-paper/70">
          <p>1. Verantwortlicher — [Name, Kontakt]</p>
          <p>
            2. Welche Daten wir verarbeiten — Name, E-Mail, optional Telefonnummer bei
            Ticket-/Gästelisten-Anmeldung; bei Kartenzahlung zusätzlich Zahlungsdaten über
            unseren Zahlungsdienstleister Stripe.
          </p>
          <p>3. Zweck — Vertragsabwicklung (Ticketverkauf), Einlasskontrolle per QR-Code.</p>
          <p>4. Empfänger — Stripe (Zahlungsabwicklung), [E-Mail-Anbieter] (Versand des Tickets).</p>
          <p>5. Speicherdauer — [Text ergänzen]</p>
          <p>6. Deine Rechte — Auskunft, Berichtigung, Löschung, Widerspruch nach DSGVO.</p>
        </div>
      </main>
      <Footer />
    </>
  );
}
