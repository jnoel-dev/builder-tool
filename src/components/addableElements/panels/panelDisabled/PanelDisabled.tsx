"use client";

import React, { useEffect } from "react";
import Box from "@mui/material/Box";
import { Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";

// Register custom-disabled-box once
class CustomDisabledBox extends HTMLElement {
  static get observedAttributes() {
    return ["disabled"];
  }


}

export default function PanelDisabled() {
  const theme = useTheme();

  const innerBoxStyles = {
    backgroundColor: theme.palette.secondary.main,
    padding: 2,
    width: "75px",
    height: "75px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.5rem",
    color: theme.palette.text.primary,
  };

  return (
    <custom-disabled-box disabled>
      <Box
        sx={{
          backgroundColor: theme.palette.primary.main,
          padding: 2,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          justifyContent="center"
          alignItems="center"
        >
          <Box sx={innerBoxStyles}>1</Box>
          <Box sx={innerBoxStyles}>2</Box>
          <Box sx={innerBoxStyles}>3</Box>
        </Stack>
      </Box>
    </custom-disabled-box>
  );
}
