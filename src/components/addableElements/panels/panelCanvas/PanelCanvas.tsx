"use client";

import React, { useRef, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";

export default function PanelCanvas() {
  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const SCALE_FACTOR = 0.75;

  useEffect(() => {
    const BOX_COUNT = 3;
    const BOX_CONTENT_SIZE = 70;
    const PADDING = 18;
    const SPACING = PADDING;

    const fullBoxSize = BOX_CONTENT_SIZE + PADDING * 2;
    const panelWidth =
      PADDING * 2 + fullBoxSize * BOX_COUNT + SPACING * (BOX_COUNT - 1);
    const panelHeight = PADDING * 2 + fullBoxSize;

    const scaledWidth = Math.round(panelWidth * SCALE_FACTOR);
    const scaledHeight = Math.round(panelHeight * SCALE_FACTOR);

    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = scaledWidth;
    canvas.height = scaledHeight;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.scale(SCALE_FACTOR, SCALE_FACTOR);
    context.fillStyle = theme.palette.primary.main;
    context.fillRect(0, 0, panelWidth, panelHeight);

    context.font = "1.5rem sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";

    for (let boxIndex = 0; boxIndex < BOX_COUNT; boxIndex++) {
      const boxXPosition = PADDING + boxIndex * (fullBoxSize + SPACING);
      const boxYPosition = PADDING;

      context.fillStyle = theme.palette.secondary.main;
      context.fillRect(boxXPosition, boxYPosition, fullBoxSize, fullBoxSize);

      context.fillStyle = theme.palette.text.primary;
      const textCenterX = boxXPosition + fullBoxSize / 2;
      const textCenterY = boxYPosition + fullBoxSize / 2;
      context.fillText(String(boxIndex + 1), textCenterX, textCenterY);
    }
  }, [theme, SCALE_FACTOR]);

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: theme.palette.background.default,
      }}
    >
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </Box>
  );
}
