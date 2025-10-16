"use client";

import { HTMLAttributes } from "react";
import Box from "@mui/material/Box";
import { Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";

interface PanelProps {
  isDisabled?: boolean;
}

export default function Panel({ isDisabled = false }: PanelProps) {
  const theme = useTheme();

  const innerBoxStyles = {
    backgroundColor: theme.palette.secondary.main,
    width: "75px",
    height: "75px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.5rem",
    color: theme.palette.text.primary,
  };

  const outerBoxProps = isDisabled
    ? ({ disabled: true } as HTMLAttributes<HTMLDivElement>)
    : {};

  return (
    <Box
      {...outerBoxProps}
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
  );
}
