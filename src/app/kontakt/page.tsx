import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ContactForm } from "@/components/ContactForm";
import { getTranslations } from "@/lib/serverLocale";

export const metadata: Metadata = {
  title: "Kontakt",
  description:
    "Fragen, Feedback oder einen Fehler gefunden? Schreib uns über das Kontaktformular.",
  alternates: { canonical: "/kontakt" }
};

export default function KontaktPage() {
  const { locale } = getTranslations();
  return (
    <>
      <Header />
      <main id="main-content" className="mx-auto max-w-xl px-5 py-16">
        <h1 className="text-display mb-2 text-3xl uppercase text-paper">Kontakt</h1>
        <p className="mb-8 text-sm text-paper/60">
          Fragen zu einem Event, ein Problem beim Ticketkauf gefunden oder einfach eine Idee?
          Schreib uns — wir melden uns so schnell wie möglich.
        </p>
        <ContactForm locale={locale} />
      </main>
      <Footer />
    </>
  );
}
