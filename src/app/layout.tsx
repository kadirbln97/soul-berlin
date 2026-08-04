import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Anton, Inter } from "next/font/google";
import "./globals.css";
import { getLocale } from "@/lib/serverLocale";

const display = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap"
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap"
});

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
  const locale = await getLocale();

  return (
    <html lang={locale} className={`${display.variable} ${body.variable}`}>
      <body className="bg-ink text-paper font-body antialiased selection:bg-soul-orange selection:text-ink">
        {children}
      </body>
    </html>
  );
}
