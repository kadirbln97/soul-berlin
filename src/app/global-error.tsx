"use client";

/**
 * Letzte Auffangstelle: greift nur, wenn schon das Root-Layout selbst scheitert
 * (z.B. weil die Datenbankabfrage im Layout fehlschlägt). Muss deshalb ein
 * komplettes HTML-Dokument liefern und darf keine Klassen aus globals.css
 * voraussetzen — die kommen über das Layout, das hier gerade nicht rendert.
 */
export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="de">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#f5f3ee",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          textAlign: "center",
          padding: "2rem"
        }}
      >
        <div style={{ maxWidth: 480 }}>
          <p style={{ fontSize: 14, letterSpacing: "0.1em", opacity: 0.7 }}>SØUL BERLIN</p>
          <h1 style={{ fontSize: 28, margin: "12px 0", color: "#ff6a1a" }}>
            Da ist etwas schiefgelaufen
          </h1>
          <p style={{ opacity: 0.8, lineHeight: 1.6 }}>
            Das lag an uns, nicht an dir. Bitte versuch es gleich noch einmal — oder schreib
            uns an kadir.alik@gmx.de, falls es nicht besser wird.
          </p>
          {error.digest && (
            <p style={{ fontSize: 11, opacity: 0.5 }}>Fehlerkennung: {error.digest}</p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 16,
              padding: "12px 24px",
              borderRadius: 999,
              border: 0,
              background: "#ff6a1a",
              color: "#0a0a0a",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Noch einmal versuchen
          </button>
        </div>
      </body>
    </html>
  );
}
