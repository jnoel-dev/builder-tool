import React, { useRef, useLayoutEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { Stack, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export default function InputReact() {
  const theme = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const [displayText, setDisplayText] = useState('');

  const handleShowClick = () => {
    if (inputRef.current) {
      setDisplayText(inputRef.current.value);
    }
  };


  useLayoutEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  });

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.primary.main,
        padding: 2,
      }}
    >
      <Stack direction="column" spacing={2}>
        <input
          name="customInput"
          ref={inputRef}
          placeholder="insert text here..."
          style={{
            backgroundColor: theme.palette.background.paper,
            padding: '8px',
            color: theme.palette.text.primary,
            flex: 1,
          }}
        />

        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="contained"
            color="secondary"
            sx={{ color: theme.palette.text.primary }}
            onClick={handleShowClick}
          >
            show text
          </Button>
          {displayText && (
            <Box
              sx={{
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.primary,
                padding: '8px',
                borderRadius: '4px',
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
