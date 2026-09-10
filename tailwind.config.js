/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#FDF3D9",
        creamLight: "#FEFAEC",
        blush: "#F6C9C6",
        blushDark: "#E9A6A6",
        maroon: "#7A2E4A",
        maroonDark: "#5C1F38",
        plum: "#B04A6B",
        peach: "#F4E2B8",
      },
      fontFamily: {
        display: ["ui-rounded", "'Poppins'", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.5rem",
      },
    },
  },
  plugins: [],
};
