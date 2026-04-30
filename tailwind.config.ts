import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#1F2A44",
          50: "#F4F5F8",
          100: "#E5E8EF",
          200: "#C2C9D8",
          300: "#9DA7BE",
          400: "#5C6A89",
          500: "#1F2A44",
          600: "#1A2339",
          700: "#141B2D",
          800: "#0F1422",
          900: "#0A0E18",
        },
        accent: {
          DEFAULT: "#C44536",
          hover: "#A8392B",
        },
        surface: "#F5F5F0",
        rule: "#D9D9D2",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      letterSpacing: {
        tightish: "-0.01em",
      },
      maxWidth: {
        prose: "62ch",
      },
    },
  },
  plugins: [],
};

export default config;
