import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Legacy Bloomberg palette (kept for /main and existing pages)
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

        // 邹氏卡藏 brand palette (LOCKED per Visual_Branding_Master_Prompt.md)
        // Use on /cardmania, /cardmania/thanks, /verdict.html and all 邹氏卡藏-branded surfaces
        brand: {
          bg: "#0D0D0D",
          "bg-deep": "#050505",
          panel: "#1A1815",
          "panel-dark": "#14120F",
          "panel-warm": "#1E1A14",
          gold: "#C8A15A",
          "gold-light": "#E2C58E",
          "gold-deep": "#8B6E3C",
          red: "#B73224",
          "red-bright": "#D43A2A",
          "red-deep": "#8E2419",
          cream: "#F5EBD2",
          "cream-dim": "#F8F2E0",
        },
      },
      fontFamily: {
        // Legacy
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],

        // 邹氏卡藏 brand fonts
        "brand-brush": ["var(--font-ma-shan-zheng)", "Songti SC", "serif"],     // 毛笔楷书 — brand mark only
        "brand-editorial": ["var(--font-noto-serif-sc)", "Songti SC", "serif"], // section heads + tagline
        "brand-serif": ["var(--font-noto-serif-sc)", "Songti SC", "serif"],     // generic serif
        "brand-sans": ["var(--font-noto-sans-sc)", "PingFang SC", "sans-serif"], // body
        "brand-en": ["var(--font-inter)", "system-ui", "sans-serif"],           // English numerals
        "brand-label": ["var(--font-oswald)", "Inter", "sans-serif"],           // EN labels / kickers
      },
      letterSpacing: {
        tightish: "-0.01em",
        wider2: "0.22em",
        widest2: "0.34em",
      },
      maxWidth: {
        prose: "62ch",
        "brand-content": "1180px",
      },
      boxShadow: {
        "brand-gold-glow": "0 4px 22px rgba(200,161,90,0.4), 0 0 0 1px rgba(245,235,210,0.2) inset",
        "brand-gold-hover": "0 10px 30px rgba(200,161,90,0.55), 0 0 0 1px rgba(245,235,210,0.3) inset",
      },
    },
  },
  plugins: [],
};

export default config;
