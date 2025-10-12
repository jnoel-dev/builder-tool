"use client";

import { useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { MuiColorInput } from "mui-color-input";
import { useThemeColors } from "@/components/contexts/themeManager/ThemeManager";
import { Stack } from "@mui/material";

export default function SettingsMenu() {
  const { colors, setColors } = useThemeColors();
  const initialColorsRef = useRef<string[] | null>(null);
  const localStorageKey = "themeColors";

  useEffect(() => {
    if (!initialColorsRef.current) initialColorsRef.current = [...colors];
    try {
      const storedJson = localStorage.getItem(localStorageKey);
      if (!storedJson) return;
      const parsed = JSON.parse(storedJson);
      if (Array.isArray(parsed) && parsed.every((value) => typeof value === "string")) {
        setColors(parsed as string[]);
      }
    } catch {}
  }, []);

  function updateColorByIndex(index: number, newColor: string) {
    const updatedColors = [...colors];
    updatedColors[index] = newColor;
    setColors(updatedColors);
  }

  function createColorChangeHandler(index: number) {
    return function handleColorPickerChange(colorValue: string) {
      updateColorByIndex(index, colorValue);
    };
  }

  function handleSaveColors(): void {
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(colors));
    } catch {}
  }

  function handleResetToDefault(): void {
    const defaults = initialColorsRef.current ?? colors;
    setColors([...defaults]);
    try {
      localStorage.removeItem(localStorageKey);
    } catch {}
  }

  const colorLabels = [
    "Main",
    "Main Alt",
    "Background",
    "Background Alt",
    "Text",
    "Text Alt",
    "CSP",
    "Success",
    "Warning",
    "NativeFunction"
  ];

  return (
    <Box
      component="ul"
      sx={{
        padding: "0px",
        margin: "0px",
        listStyle: "none",
      }}
    >


      {colors.map((currentColor, index) => {
        const label = colorLabels[index];
        const onColorChange = createColorChangeHandler(index);

        return (
          <Box
            key={label}
            component="li"
            sx={{
              marginBottom: "8px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Typography
              variant="caption"
              sx={{ width: "100px", marginRight: "16px" }}
            >
              {label}
            </Typography>

            <MuiColorInput
              value={currentColor}
              onChange={onColorChange}
              format="hex"
              size="small"
            />
          </Box>
        );
      })}
        <Stack spacing={.5}>
        <Button variant="contained" color="secondary" onClick={handleSaveColors} fullWidth>
          Save to localStorage
        </Button>
        <Button variant="outlined" color="secondary" onClick={handleResetToDefault} fullWidth>
          Reset To Default
        </Button>
        </Stack>
      
    </Box>
  );
}
