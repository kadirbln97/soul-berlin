import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { abmelden } from "@/lib/newsletter";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Abmelden",
  robots: { index: false, follow: false }
};

/**
 * Abmeldung vom Newsletter über den Link aus einer E-Mail.
 *
 * Bewusst zweistufig: Der Link öffnet diese Seite, abgemeldet wird erst per
 * Knopfdruck. Grund ist nicht Bequemlichkeit für uns, sondern das Gegenteil
 * von Zufall — Sicherheitsscanner in Mailprogrammen rufen Links in E-Mails
 * automatisch auf. Bei sofortiger Abmeldung per Aufruf würden Leute
 * ausgetragen, die nie geklickt haben. Ein Knopf bleibt trotzdem „ohne
 * weiteres möglich" im Sinne von § 7 UWG.
 */
export default async function NewsletterAbmeldenPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string; ok?: string }>;
}) {
  const { token, ok } = await searchParams;

  async function abmeldungAusfuehren(formData: FormData) {
    "use server";
    const t = String(formData.get("token") ?? "");
    const ergebnis = await abmelden(t);
    redirect(`/newsletter/abmelden?ok=${ergebnis.ok ? "1" : "0"}`);
  }

  const erledigt = ok === "1";
  const fehlgeschlagen = ok === "0";

  return (
    <>
      <Header />
      <main id="main-content" className="mx-auto max-w-2xl px-5 py-24 text-center">
        {erledigt ? (
          <>
            <h1 className="text-display text-3xl uppercase text-paper sm:text-4xl">
              Abgemeldet
            </h1>
            <p className="mt-4 text-paper/70">
              Du bekommst keine E-Mails mehr von uns zu kommenden Events. Deine
              Tickets und Gästelisten-Einträge bleiben davon unberührt.
            </p>
          </>
        ) : fehlgeschlagen || !token ? (
          <>
            <h1 className="text-display text-3xl uppercase text-paper/80 sm:text-4xl">
              Link nicht gültig
            </h1>
            <p className="mt-4 text-paper/70">
              Dieser Abmeldelink ist unvollständig oder gehört zu keiner
              Adresse. Schreib uns einfach kurz an{" "}
              <a href="mailto:kadir.alik@gmx.de" className="underline hover:text-soul-orange">
                kadir.alik@gmx.de
              </a>{" "}
              — wir tragen dich dann von Hand aus.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-display text-3xl uppercase text-paper sm:text-4xl">
              Keine E-Mails mehr?
            </h1>
            <p className="mt-4 text-paper/70">
              Ein Klick, dann bist du raus. Es fallen keine Kosten an.
            </p>
            <form action={abmeldungAusfuehren} className="mt-8">
              <input type="hidden" name="token" value={token} />
              <button type="submit" className="btn-primary">
                Jetzt abmelden
              </button>
            </form>
          </>
        )}

        <Link href="/" className="btn-outline mt-8 inline-flex">
          Zur Startseite
        </Link>
      </main>
      <Footer />
    </>
  );
}
