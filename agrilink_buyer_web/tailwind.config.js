/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        forest: {
          50: "#EFF7F1",
          100: "#D8E3DA",
          600: "#0B5D3B",
          700: "#094A30",
          900: "#06301F",
        },
        clay: {
          50: "#FDF3EA",
          100: "#F5DDC4",
          500: "#C2571B",
          600: "#A6470F",
        },
        ink: {
          900: "#1F2A24",
          700: "#3B4A41",
          400: "#7C8B82",
        },
        paper: "#FAF8F3",
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
