import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "SØUL BERLIN — Good people. Good music.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Default Open-Graph-Bild fürs Teilen der Startseite / statischer Seiten
// (Kontakt, Impressum, ...). Event-Seiten überschreiben dies mit dem
// jeweiligen Event-Flyer via generateMetadata.
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          backgroundImage:
            "radial-gradient(circle at 25% 25%, rgba(255,106,26,0.25), transparent 45%)"
        }}
      >
        <div
          style={{
            fontSize: 120,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "#f5f3ee",
            display: "flex"
          }}
        >
          SØUL BERLIN
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 36,
            color: "#ff6a1a",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            display: "flex"
          }}
        >
          Good people. Good music.
        </div>
      </div>
    ),
    { ...size }
  );
}
