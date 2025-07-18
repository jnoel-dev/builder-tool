'use client';

import * as React from "react";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import { useThemeColors } from "@/components/contexts/themeManager/ThemeManager";
import Typography from "@mui/material/Typography";

export default function SettingsMenu() {
  const { colors, setColors } = useThemeColors();

    const handleColorChange = (index: number, value: string) => {
    const updatedColors = [...colors];
    updatedColors[index] = value;
    setColors(updatedColors);
    };


  const colorLabels = [
    "Primary color",
    "Secondary color",
    "Background default",
    "Background paper",
    "Text primary",
    "Text secondary",
  ];

  return (
    <div>
      <Divider component="li" />

      {colors.map((color, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
            {colorLabels[index]}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              sx={{
                width: 30,
                height: 30,
                backgroundColor: color,
                border: '1px solid #ccc',
                marginRight: 2,
              }}
            />
            <TextField
              value={color}
              onChange={(e) => handleColorChange(index, e.target.value)}
              variant="outlined"
              size="small"
            />
          </Box>
        </Box>
      ))}

      <Divider component="li" />
    </div>
  );
}