"use client";

import React from "react";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import { MuiColorInput } from "mui-color-input";
import { useThemeColors } from "@/components/contexts/themeManager/ThemeManager";

export default function SettingsMenu() {
  const { colors, setColors } = useThemeColors();

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

  const colorLabels = [
    "Main",
    "Main Alt",
    "Background",
    "Background Alt",
    "Text",
    "Text Alt",
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

     
    </Box>
  );
}
