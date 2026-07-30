import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
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
        body: ["var(--font-body)", "sans-serif"]
      },
      backgroundImage: {
        "grain": "url('/grain.png')"
      }
    }
  },
  plugins: []
};

export default config;
