import React, { useState, useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";

export default function InputRedraw() {
  const [key, setKey] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const theme = useTheme();

  const handleClick = () => {
    //forces react to re-render element
    setKey((prev) => prev + 1);
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, [key]);

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.primary.main,
        padding: 2,
      }}
    >
      <input
        key={key}
        name="InputRedraw"
        ref={inputRef}
        onClick={handleClick}
        placeholder="insert text here..."
        style={{
          backgroundColor: theme.palette.background.paper,
          padding: "8px",
          color: theme.palette.text.primary,
          flex: 1,
          width: "100%",
        }}
      />
    </Box>
  );
}
