import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  future: {
    // hover: nur dort anwenden, wo es ein echtes Zeigegerät gibt. Ohne das
    // löst ein Fingertipp auf dem Handy den Hover-Zustand aus — die Event-Karte
    // blieb dann angehoben stehen, bis man woanders hintippt.
    hoverOnlyWhenSupported: true
  },
  theme: {
    extend: {
      colors: {
        ink: "#0a0a0a",
        paper: "#f5f3ee",
        soul: {
          orange: "#ff6a1a",
          orangeDark: "#c9500f",
          orangeLight: "#ff9455"
        }
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        // Systemschrift statt Inter/Geist/Space Grotesk — siehe layout.tsx.
        body: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif"
        ]
      },
      backgroundImage: {
        "grain": "url('/grain.png')"
      }
    }
  },
  plugins: []
};

export default config;
