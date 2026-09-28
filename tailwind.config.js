/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        arena: {
          bg: "#090a0f",
          surface: "#111420",
          card: "#161b2b",
          border: "#252d43",
          hover: "#1e253c",
        },
        crimson: {
          light: "#ff4d6d",
          DEFAULT: "#e11d48",
          dark: "#be123c",
          glow: "rgba(225, 29, 72, 0.4)",
        },
        gold: {
          light: "#fde047",
          DEFAULT: "#f59e0b",
          dark: "#b45309",
          glow: "rgba(245, 158, 11, 0.35)",
        },
        emerald: {
          glow: "rgba(16, 185, 129, 0.35)",
        }
      },
      boxShadow: {
        'crimson-glow': '0 0 25px rgba(225, 29, 72, 0.35)',
        'gold-glow': '0 0 25px rgba(245, 158, 11, 0.35)',
        'card-glow': '0 8px 32px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounce 2s infinite',
      }
    },
  },
  plugins: [],
};
