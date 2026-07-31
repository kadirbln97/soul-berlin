import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Anton, Inter } from "next/font/google";
import "./globals.css";

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
  }
};

export default function RootLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <html lang="de" className={`${display.variable} ${body.variable}`}>
      <body className="bg-ink text-paper font-body antialiased selection:bg-soul-orange selection:text-ink">
        {children}
      </body>
    </html>
  );
}
