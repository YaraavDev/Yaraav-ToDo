/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: "#000000",
          card: "#0F0F0F",
          border: "#1F1F1F",
          text: "#E7E9EA",
          subtext: "#71767B",
          accent: "#FFFFFF",
        },
        light: {
          bg: "#FFFFFF",
          card: "#F7F9F9",
          border: "#EFF3F4",
          text: "#0F1419",
          subtext: "#536471",
          accent: "#000000",
        },
      },
      fontFamily: {
        en: ["Inter", "sans-serif"],
        fa: ["Vazirmatn", "sans-serif"],
      },
      borderRadius: {
        card: "16px",
        pill: "9999px",
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: "translateY(8px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        popIn: { "0%": { transform: "scale(0.9)", opacity: 0 }, "100%": { transform: "scale(1)", opacity: 1 } },
      },
      animation: {
        fadeIn: "fadeIn .25s ease-out",
        slideUp: "slideUp .3s cubic-bezier(.2,.8,.2,1)",
        popIn: "popIn .25s cubic-bezier(.34,1.56,.64,1)",
      },
    },
  },
  plugins: [],
};
