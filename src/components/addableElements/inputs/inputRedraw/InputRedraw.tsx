import React, { useState, useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import { Stack, Button } from "@mui/material";
import { useTheme } from "@mui/material/styles";

export default function InputRedraw() {
  const [key, setKey] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const theme = useTheme();

  const handleClick = () => {
    setKey((previousKey) => previousKey + 1);
  };

  const handleShowClick = () => {
    setDisplayText(inputRef.current ? inputRef.current.value : "");
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
      <Stack direction="column" spacing={2}>
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
          }}
        />
        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="contained"
            color="secondary"
            sx={{ color: theme.palette.text.primary, width: "100%" }}
            onClick={handleShowClick}
          >
            show text
          </Button>
          {displayText && (
            <Box
              sx={{
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.primary,
                padding: "8px",
              }}
            >
              {displayText}
            </Box>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
