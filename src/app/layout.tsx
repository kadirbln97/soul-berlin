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

export const metadata: Metadata = {
  title: "SØUL BERLIN — Good people. Good music.",
  description:
    "SØUL Berlin ist House Music Culture: Events, Guestlist & Tickets. Good people. Good music.",
  openGraph: {
    title: "SØUL BERLIN",
    description: "Good people. Good music.",
    type: "website"
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
