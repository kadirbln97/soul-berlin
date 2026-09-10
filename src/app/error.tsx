"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Fängt Fehler beim Rendern einer Seite ab (Datenbank nicht erreichbar,
 * unerwarteter Zustand …). Ohne diese Datei zeigt Next seine eigene,
 * englische Fehlerseite ohne Logo, Kontaktweg oder Rückweg.
 *
 * Bewusst ohne Header/Footer: die lesen aus der Datenbank — wenn genau die
 * gerade das Problem ist, würde die Fehlerseite selbst wieder scheitern.
 */
export default function ErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Landet in den Vercel-Logs (und, sobald eingerichtet, im Fehler-Alarm).
    console.error("[error.tsx]", error);
  }, [error]);

  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-5 py-32 text-center"
    >
      <p className="text-display text-2xl italic-skew text-paper">SØUL BERLIN</p>
      <p className="text-display text-3xl uppercase text-soul-orange">Da ist etwas schiefgelaufen</p>
      <p className="text-paper/70">
        Das lag an uns, nicht an dir. Versuch es gleich noch einmal — wenn es dann immer
        noch hakt, schreib uns kurz, damit wir es reparieren können.
      </p>
      {error.digest && (
        <p className="text-[11px] text-paper/50">Fehlerkennung: {error.digest}</p>
      )}
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="btn-primary">
          Noch einmal versuchen
        </button>
        <Link href="/" className="btn-outline">
          Zur Startseite
        </Link>
        <a href="mailto:kadir.alik@gmx.de" className="btn-outline">
          Uns schreiben
        </a>
      </div>
    </main>
  );
}
