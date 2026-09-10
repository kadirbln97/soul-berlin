import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Anton } from "next/font/google";
import "./globals.css";
import { getTranslations } from "@/lib/serverLocale";
import { getNextExternalTicketLink } from "@/lib/events";
import { TicketFab } from "@/components/TicketFab";

const display = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap"
});

// Bewusst kein Google-Webfont fürs Fließtext: Inter/Geist/Space Grotesk sind
// die Standardschriften, die praktisch jede KI-gebaute Seite verwendet — mit
// einer davon wirkt selbst eine handgemachte Seite generisch. Die System-
// schriftart lädt außerdem ohne Netzwerk-Roundtrip und ohne Layout-Sprung.

const appUrl = process.env.APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "SØUL BERLIN — Good people. Good music.",
    template: "%s · SØUL BERLIN"
  },
  description:
    "SØUL Berlin ist House Music Culture: Events, Guestlist & Tickets. Good people. Good music.",
  openGraph: {
    title: "SØUL BERLIN",
    description: "Good people. Good music.",
    type: "website",
    siteName: "SØUL BERLIN",
    locale: "de_DE"
  },
  twitter: {
    card: "summary_large_image",
    title: "SØUL BERLIN",
    description: "Good people. Good music."
  },
  // Bestätigt den Seitenbesitz gegenüber der Google Search Console — nötig,
  // um die Sitemap einzureichen und die Indexierung aktiv anzustoßen, statt
  // passiv auf den nächsten Crawl zu warten. Der Wert ist ein öffentlicher
  // Verifizierungscode, kein Geheimnis.
  verification: {
    google: "zxJMKy9TTzLQE39r3DHkF8xyWF_Y6WQZBouQN41vz_4"
  }
};

export default async function RootLayout({
  children
}: {
  children: ReactNode;
}) {
  // lang-Attribut folgt der gewählten Sprache — wichtig für Screenreader und
  // für die automatische Übersetzungserkennung im Browser.
  const { locale, t } = await getTranslations();

  // Ticketlink des nächsten Events für den schwebenden Knopf. Gibt es kein
  // anstehendes Event mit externem Shop, erscheint gar kein Knopf.
  const ticketLink = await getNextExternalTicketLink();

  return (
    <html lang={locale} className={display.variable}>
      {/* Kein bg-ink hier: die Klasse hat als Selektor höhere Spezifität als
          die body{}-Regel in globals.css und würde deren Hintergrundfarbe
          (das aufgehellte Anthrazit gegen den "Perma-Dark-Mode"-Scanner-
          Treffer) sonst überschreiben. */}
      <body className="text-paper font-body antialiased selection:bg-soul-orange selection:text-ink">
        {children}
        {ticketLink && (
          <TicketFab
            url={ticketLink.url}
            label={t.ticketFab.label}
            title={t.ticketFab.title}
            closeLabel={t.ticketFab.close}
            moveLabel={t.ticketFab.move}
          />
        )}
      </body>
    </html>
  );
}
