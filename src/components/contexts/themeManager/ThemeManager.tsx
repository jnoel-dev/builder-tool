'use client';

import { createContext, useContext, useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ReactNode } from 'react';

const defaultColors = [
  '#eeeeee', 
  '#bdbdbd', 
  '#212121', 
  '#424242', 
  '#fafafa', 
  '#eeeeee', 
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
      mode: 'dark',
      primary: {
        main: colors[0] || '#eeeeee',
      },
      secondary: {
        main: colors[1] || '#bdbdbd',
      },
      background: {
        default: colors[2] || '#212121',
        paper: colors[3] || '#424242',
      },
      text: {
        primary: colors[4] || '#fafafa',
        secondary: colors[5] || '#eeeeee',
        disabled: '#757575',
      },
    },
  });

  return (
    <ThemeContext.Provider value={{ colors, setColors }}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeContext.Provider>
  );
}
