import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#F7F3EA",
        sage: {
          DEFAULT: "#8A9A7B",
          soft: "#A8B59A",
          deep: "#5F6F52",
          mist: "#D5DCCB",
        },
        petal: {
          ivory: "#F5EDE0",
          blush: "#E8C9C0",
          apricot: "#E6C4A8",
          lilac: "#C9B8D4",
          champagne: "#E8D5B7",
          special: "#B8A4C9",
        },
        dusk: {
          peach: "#F0C9A8",
          rose: "#E0B0B8",
          violet: "#9B8BB5",
          night: "#1A1F2E",
        },
      },
      fontFamily: {
        display: ["var(--font-cormorant)", "Noto Serif SC", "serif"],
        serif: ["var(--font-noto-serif)", "Noto Serif SC", "serif"],
        sans: ["var(--font-noto-sans)", "Noto Sans SC", "sans-serif"],
      },
      animation: {
        "float-slow": "float 8s ease-in-out infinite",
        "sway": "sway 4s ease-in-out infinite",
        "dust": "dust 12s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        sway: {
          "0%, 100%": { transform: "rotate(-2deg)" },
          "50%": { transform: "rotate(2deg)" },
        },
        dust: {
          "0%": { transform: "translateY(0) translateX(0)", opacity: "0" },
          "10%": { opacity: "0.5" },
          "90%": { opacity: "0.3" },
          "100%": { transform: "translateY(-100vh) translateX(40px)", opacity: "0" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
