import React, { useRef, useState} from 'react';
import Box from '@mui/material/Box';
import { Stack, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export default function InputReact() {
  const theme = useTheme();
  const [text, setText] = useState('');



  return (
    <Box
      sx={{
        backgroundColor: theme.palette.primary.main,
        padding: 2,
      }}
    >
      <Stack direction="row" spacing={2}>
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

      </Stack>
    </Box>
  );
}
