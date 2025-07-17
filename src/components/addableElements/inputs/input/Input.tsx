import React, { useRef } from 'react';
import Box from '@mui/material/Box';
import { Stack, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export default function Input() {
  const theme = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);

  const generateRandomNumber = () => {
    const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    if (inputRef.current) {
      inputRef.current.value = randomNumber;
    }
  };

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.primary.main,
        padding: 2,
      }}
    >
      <Stack direction="row" spacing={2}>
        <input
          name="input"
          ref={inputRef}
          placeholder="insert text here..."
          style={{
            backgroundColor: theme.palette.background.paper,
            padding: '8px',
            color: theme.palette.text.primary,
            flex: 1,
          }}
        />
        <Button variant="contained" onClick={generateRandomNumber} color="secondary" sx={{ color: theme.palette.text.primary }}>
          generate text
        </Button>
      </Stack>
    </Box>
  );
}
