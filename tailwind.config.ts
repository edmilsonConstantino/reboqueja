import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#FFC300",
          50: "#FFF8DC",
          100: "#FFEFB8",
          200: "#FFE38A",
          300: "#FFD65C",
          400: "#FFC300",
          500: "#EAB308",
          600: "#CA9A04",
          700: "#A16207",
          800: "#854D0E",
          900: "#713F12",
        },
        ink: {
          DEFAULT: "#121212",
          muted: "#5B5B5B",
        },
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        card: "0 2px 16px rgba(0,0,0,0.08)",
        sheet: "0 -4px 24px rgba(0,0,0,0.12)",
      },
    },
  },
  plugins: [],
};
export default config;
