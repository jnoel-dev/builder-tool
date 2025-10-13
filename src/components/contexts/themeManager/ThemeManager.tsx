"use client";

import { createContext, useContext, useState } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { ReactNode } from "react";

declare module "@mui/material/styles" {
  interface Palette {
    infoDisplay: {
      csp: string;
      success: string;
      warning: string;
      nativeFunction: string;
    };
  }
  interface PaletteOptions {
    infoDisplay?: {
      csp?: string;
      success?: string;
      warning?: string;
      nativeFunction?: string;
    };
  }
}

const defaultColors = [
  "#eeeeee",
  "#bdbdbd",
  "#212121",
  "#424242",
  "#fafafa",
  "#eeeeee",
  "#f44336",
  "#4caf50",
  "#ffeb3b",
  "#ff9800",
];

const ThemeContext = createContext<{
  colors: string[];
  setColors: React.Dispatch<React.SetStateAction<string[]>>;
}>({
  colors: defaultColors,
  setColors: () => {},
});

export const useThemeColors = () => useContext(ThemeContext);

export default function ThemeManager({ children }: { children: ReactNode }) {
  const [colors, setColors] = useState(defaultColors);

  const theme = createTheme({
    palette: {
      mode: "dark",
      primary: { main: colors[0] || "#eeeeee" },
      secondary: { main: colors[1] || "#bdbdbd" },
      background: {
        default: colors[2] || "#212121",
        paper: colors[3] || "#424242",
      },
      text: {
        primary: colors[4] || "#fafafa",
        secondary: colors[5] || "#eeeeee",
        disabled: "#757575",
      },
      infoDisplay: {
        csp: colors[6] || "#f44336",
        success: colors[7] || "#4caf50",
        warning: colors[8] || "#ffeb3b",
        nativeFunction: colors[9] || "#ff9800",
      },
    },
  });

  return (
    <ThemeContext.Provider value={{ colors, setColors }}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeContext.Provider>
  );
}
