import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1000px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        background: "#0c0d0e",
        surface: {
          DEFAULT: "#141518",
          subtle: "#1a1c20",
          card: "#18191c",
          hover: "#222428",
          border: "#27292e",
        },
        spotify: {
          green: "#10b981",
          emerald: "#10b981",
          hover: "#059669",
        },
        primary: {
          DEFAULT: "#10b981",
          foreground: "#ffffff",
          hover: "#059669",
        },
        secondary: {
          DEFAULT: "#27272a",
          foreground: "#f4f4f5",
        },
        muted: {
          DEFAULT: "#71717a",
          foreground: "#a1a1aa",
        },
        border: "#27272a",
      },
      borderRadius: {
        DEFAULT: "0.75rem",
        lg: "1rem",
        xl: "1.25rem",
        "2xl": "1.5rem",
        full: "9999px",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out forwards",
        "pulse-subtle": "pulse-subtle 2s ease-in-out infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
