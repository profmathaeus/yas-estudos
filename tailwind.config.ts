import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        yas: {
          burgundy:   "#8B1D3A",
          lavender:   "#B89FD4",
          plum:       "#5B4A7E",
          yellow:     "#F5F5A0",
          terracotta: "#C8876A",
          cream:      "#FAFFF0",
          ink:        "#1A1525",
        },
        bloco: {
          sus:        "#5B4A7E",
          tecnicas:   "#B89FD4",
          doencas:    "#C8876A",
          emergencias:"#8B1D3A",
          mulher:     "#F5F5A0",
          bio:        "#5B8A7E",
          farma:      "#9B84C4",
          mental:     "#7B6A9E",
          idoso:      "#D4A08A",
        },
      },
      fontFamily: {
        display: ["var(--font-cormorant)", "Georgia", "serif"],
        body:    ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.5rem",
      },
      keyframes: {
        "flip-in": {
          "0%":   { transform: "rotateY(0deg)" },
          "100%": { transform: "rotateY(180deg)" },
        },
        "flip-out": {
          "0%":   { transform: "rotateY(180deg)" },
          "100%": { transform: "rotateY(0deg)" },
        },
      },
      animation: {
        "flip-in":  "flip-in 0.5s ease forwards",
        "flip-out": "flip-out 0.5s ease forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
