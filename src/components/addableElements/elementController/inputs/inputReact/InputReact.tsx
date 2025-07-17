import React, { useState } from 'react';
import Box from '@mui/material/Box';
import { Stack, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export default function InputReact() {
  const theme = useTheme();
  const [text, setText] = useState('');
  const [displayText, setDisplayText] = useState('');

  const handleShowClick = () => {
    setDisplayText(text);
  };

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.primary.main,
        padding: 2,
      }}
    >
      <Stack direction="column" spacing={2}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
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
