import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brown: {
          50: "#F7F3ED",
          100: "#EDE6DC",
          200: "#E0D6C8",
          300: "#C4B59A",
          400: "#A89070",
          500: "#8B7355",
          600: "#6B5A45",
          700: "#5D4E37",
          800: "#3D3325",
          900: "#2C1810",
          950: "#1A1008",
        },
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
