"use client";

import { useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { MuiColorInput } from "mui-color-input";
import { useThemeColors } from "@/components/contexts/themeManager/ThemeManager";
import { Stack } from "@mui/material";

const originalDefaultThemeColors = [
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

export default function SettingsMenu() {
  const { colors, setColors } = useThemeColors();
  const initialColorsRef = useRef<string[] | null>(null);
  const localStorageKey = "themeColors";

  useEffect(() => {
    if (initialColorsRef.current === null) {
      initialColorsRef.current = [...originalDefaultThemeColors];
    }
  }, []);

  useEffect(() => {
    try {
      const storedJson = localStorage.getItem(localStorageKey);
      if (!storedJson) return;
      const parsedValue = JSON.parse(storedJson);
      if (
        Array.isArray(parsedValue) &&
        parsedValue.every((elementValue) => typeof elementValue === "string")
      ) {
        setColors(parsedValue as string[]);
      }
    } catch {}
  }, [setColors]);

  function updateColorByIndex(colorIndex: number, newColor: string) {
    const updatedColors = [...colors];
    updatedColors[colorIndex] = newColor;
    setColors(updatedColors);
  }

  function createColorChangeHandler(colorIndex: number) {
    return function handleColorPickerChange(colorValue: string) {
      updateColorByIndex(colorIndex, colorValue);
    };
  }

  function handleSaveColors(): void {
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(colors));
    } catch {}
  }

  function handleResetToDefault(): void {
    const defaultsToApply =
      initialColorsRef.current ?? originalDefaultThemeColors;
    setColors([...defaultsToApply]);
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
    "NativeFunction",
  ];

  return (
    <Box
      component="ul"
      sx={{ padding: "0px", margin: "0px", listStyle: "none" }}
    >
      {colors.map((currentColor, colorIndex) => {
        const labelForColor = colorLabels[colorIndex];
        const onColorChange = createColorChangeHandler(colorIndex);

        return (
          <Box
            key={labelForColor}
            component="li"
            sx={{ marginBottom: "8px", display: "flex", alignItems: "center" }}
          >
            <Typography
              variant="caption"
              sx={{ width: "100px", marginRight: "16px" }}
            >
              {labelForColor}
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
      <Stack spacing={0.5}>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleSaveColors}
          fullWidth
        >
          Save to localStorage
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          onClick={handleResetToDefault}
          fullWidth
        >
          Reset To Default
        </Button>
      </Stack>
    </Box>
  );
}
