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
        brand: {
          50: "#eefdf5",
          100: "#d6f9e6",
          200: "#b0f1d0",
          300: "#7ae3b3",
          400: "#3fce90",
          500: "#1ab373",
          600: "#0e915d",
          700: "#0c744d",
          800: "#0d5c40",
          900: "#0c4c36",
        },
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(16, 24, 40, 0.06), 0 1px 3px 0 rgba(16, 24, 40, 0.10)",
        soft: "0 4px 20px -4px rgba(16, 24, 40, 0.08)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
