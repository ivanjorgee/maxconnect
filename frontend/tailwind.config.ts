import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#F45D0B",
          soft: "#F58A46",
        },
        background: {
          DEFAULT: "#050609",
          soft: "#0B1013",
          elevated: "#0F1620",
        },
        foreground: "#F8FAFC",
        muted: "#9CA3AF",
        stroke: "#1F2937",
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
      },
      fontFamily: {
        sans: ["'Space Grotesk'", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "glow-primary": "0 10px 40px rgba(244,93,11,0.35)",
        "card-border": "inset 0 0 0 1px rgba(255,255,255,0.04)",
      },
      backgroundImage: {
        "grid-radial":
          "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0), radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)",
        "spotlight": "radial-gradient(circle at 20% 20%, rgba(244,93,11,0.12), transparent 30%)",
      },
      borderRadius: {
        xl: "14px",
      },
    },
  },
  plugins: [],
};

export default config;
