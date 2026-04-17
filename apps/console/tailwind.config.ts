import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        surface: {
          0: "#050608",
          1: "#0c0d12",
          2: "#14151b",
          3: "#1c1d24",
        },
        border: {
          DEFAULT: "#1e2028",
          subtle: "#16171d",
          hover: "#2a2c35",
        },
        text: {
          primary: "#f0f1f3",
          secondary: "#a0a4ad",
          muted: "#5c616b",
          faint: "#383c44",
        },
        accent: {
          DEFAULT: "#10b981",
          muted: "#10b98120",
          subtle: "#10b98110",
        },
        danger: {
          DEFAULT: "#ef4444",
          muted: "#ef444420",
        },
        warning: {
          DEFAULT: "#f59e0b",
          muted: "#f59e0b20",
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out",
        "slide-up": "slide-up 0.4s ease-out",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
