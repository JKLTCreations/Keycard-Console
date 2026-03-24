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
        surface: {
          0: "#06080f",
          1: "#0d0e13",
          2: "#131418",
          3: "#1a1b20",
        },
        border: {
          DEFAULT: "#212225",
          subtle: "#1a1b1e",
          hover: "#2e3135",
        },
        text: {
          primary: "#edeef0",
          secondary: "#b0b4ba",
          muted: "#5a6169",
          faint: "#3a3d42",
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
