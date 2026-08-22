import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { einwilligungBestaetigen } from "@/lib/newsletter";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Anmeldung bestätigen",
  // Bestätigungsseiten gehören nicht in den Suchindex: sie funktionieren nur
  // mit gültigem Token und hätten für Suchende keinerlei Nutzen.
  robots: { index: false, follow: false }
};

export default async function NewsletterBestaetigenPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  // IP als Nachweis, wann und von wo bestätigt wurde — im Streitfall muss der
  // Versender die Einwilligung belegen können.
  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerList.get("x-real-ip") ??
    null;

  const ergebnis = token ? await einwilligungBestaetigen({ token, ip }) : { ok: false };

  return (
    <>
      <Header />
      <main id="main-content" className="mx-auto max-w-2xl px-5 py-24 text-center">
        {ergebnis.ok ? (
          <>
            <h1 className="text-display text-3xl uppercase text-paper sm:text-4xl">
              Alles klar — du bist dabei
            </h1>
            <p className="mt-4 text-paper/70">
              Wir melden uns, sobald das nächste SØUL-Event steht. Abmelden kannst
              du dich jederzeit über den Link am Ende jeder E-Mail.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-display text-3xl uppercase text-paper/80 sm:text-4xl">
              Link nicht mehr gültig
            </h1>
            <p className="mt-4 text-paper/70">
              Dieser Bestätigungslink wurde bereits verwendet oder ist abgelaufen.
              Falls du schon bestätigt hast, ist alles in Ordnung — du bist dann
              bereits auf der Liste.
            </p>
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
