import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#FAF7F2",
          100: "#F7F3EC",
          200: "#EFE8DE",
          300: "#E9DDCC",
          400: "#E4D9CB",
          500: "#D3C3B0",
        },
        espresso: {
          950: "#140E0A",
          900: "#1E1510",
          800: "#2A1E17",
          700: "#35271F",
          600: "#49382E",
          500: "#5D493E",
        },
        terracotta: {
          DEFAULT: "#B86D52",
          50: "#FBF2EE",
          100: "#F5DFD6",
          200: "#E8B8A6",
          300: "#D99378",
          400: "#C9785A",
          500: "#B86D52",
          600: "#9A543B",
          700: "#7A3F2B",
        },
        sage: {
          DEFAULT: "#70816B",
          50: "#F3F5F2",
          100: "#E3E7E1",
          200: "#C4CCC0",
          300: "#A3B09E",
          400: "#879682",
          500: "#70816B",
          600: "#586754",
        },
        taupe: {
          DEFAULT: "#7C695C",
          50: "#F8F6F4",
          100: "#EFEBE7",
          200: "#DBD3CB",
          300: "#BFB2A7",
          400: "#9E8E81",
          500: "#7C695C",
          600: "#635246",
        },
        // CSS variable dynamic mapping for diner theme
        dishora: {
          bg: "var(--dishora-bg, #F7F3EC)",
          surface: "var(--dishora-surface, #FFFFFF)",
          text: "var(--dishora-text, #35271F)",
          mutedText: "var(--dishora-muted-text, #7C695C)",
          accent: "var(--dishora-accent, #B86D52)",
          secondaryAccent: "var(--dishora-secondary-accent, #70816B)",
          border: "var(--dishora-border, #E4D9CB)",
          hover: "var(--dishora-hover, #F1E9DF)",
        }
      },
      fontFamily: {
        serif: ["var(--font-serif)", "DM Serif Display", "Instrument Serif", "Georgia", "serif"],
        sans: ["var(--font-sans)", "DM Sans", "Manrope", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        card: "var(--card-radius, 16px)",
      },
      boxShadow: {
        soft: "0 2px 10px -2px rgba(53, 39, 31, 0.05), 0 10px 25px -5px rgba(53, 39, 31, 0.04)",
        lifted: "0 10px 30px -10px rgba(53, 39, 31, 0.1), 0 20px 40px -15px rgba(53, 39, 31, 0.06)",
        sheet: "0 -10px 40px -10px rgba(53, 39, 31, 0.15)",
      }
    },
  },
  plugins: [],
};

export default config;

