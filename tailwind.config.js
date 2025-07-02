const { globalColors } = require('./colors.js');

module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
      colors: {
      transparent: "transparent",
      globalColor1: globalColors.globalColor1,
      globalColor2: globalColors.globalColor2,
      globalColor3: globalColors.globalColor3,
      globalColor4: globalColors.globalColor4,
      globalColor5: globalColors.globalColor5,
      globalColor6: globalColors.globalColor6,
      globalColor0: globalColors.globalColor0
    },
    extend: {
      fontFamily: {
        roboto: ['Roboto'],
      },

    },

  },
    plugins: [
  ],
};
