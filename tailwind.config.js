// /** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",

    // Or if using `src` directory:
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    colors: {
      transparent: "transparent",
      globalColor6: "#555555",
      globalColor5: "#666666",
      globalColor4: "#777777",
      globalColor3: "#888888",
      globalColor2: "#999999",
      globalColor1: "#aaaaaa",
    },
  },
  plugins: [],
};
