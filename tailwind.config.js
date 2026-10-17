/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./admin.html",
    "./js/**/*.{js,html}",
    "./src/**/*.{js,html}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#051329",
          deep: "#0A2540",
          ocean: "#0E365E",
          teal: "#1D976C",
          sea: "#00D4FF",
          lagoon: "#06D6A0",
          sand: "#FDF8F0",
          gold: "#F59E0B",
          goldLight: "#FDE68A",
          goldDark: "#D97706",
          goldDeep: "#B45309",
          darkBg: "#030712",
          cardDark: "#071326",
          cardGlass: "rgba(7, 19, 38, 0.78)",
          borderDark: "#1E293B",
          accentAqua: "#00F0FF",
        },
      },
      fontFamily: {
        cairo: ["Cairo", "sans-serif"],
        sans: ['"Plus Jakarta Sans"', "Cairo", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      boxShadow: {
        "gold-glow": "0 0 25px -4px rgba(245, 158, 11, 0.45)",
        "gold-glow-lg": "0 0 35px 0 rgba(245, 158, 11, 0.6)",
        "sea-glow": "0 0 25px -4px rgba(0, 212, 255, 0.45)",
        "card-glass":
          "0 15px 35px -5px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.12)",
      },
    },
  },
  plugins: [],
};
