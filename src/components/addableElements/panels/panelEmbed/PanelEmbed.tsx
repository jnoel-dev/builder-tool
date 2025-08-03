'use client';

import React from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

export default function PanelEmbedExamples() {
  const theme = useTheme();

  const boxStyles = {
    backgroundColor: theme.palette.secondary.main,
    padding: 2,
    width: '75px',
    height: '75px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    color: theme.palette.text.primary,
  };

function renderContainer(labelText: string, boxTexts: string[], containerCustomStyle: object) {
  return (
    <Box sx={{ position: 'relative', width: 'fit-content', ...containerCustomStyle }}>
      <Box
        sx={{
          position: 'absolute',
          top: -32,
          right: 0,
          backgroundColor: theme.palette.secondary.main,
          paddingX: 1,
          paddingY: 0.5,
          width: '100%',
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.text.primary,
            textTransform: 'uppercase',
            fontWeight: 500,
          }}
        >
          {labelText}
        </Typography>
      </Box>
      <Box
        sx={{
          border: `2px solid ${theme.palette.secondary.main}`,
          padding: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Stack direction="row" spacing={2}>
          {boxTexts.map((text) => (
            <Box key={text} sx={boxStyles}>
              {text}
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}


  return (
    <Box
      sx={{
        backgroundColor: theme.palette.primary.main,
        padding: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        paddingTop: 6
      }}
    >
      {renderContainer('css override', ['1', '2', '3'], { filter: 'hue-rotate(45deg)' })}
      {renderContainer('overflow', ['4', '5', '6'], { overflow: 'clip' })}
      {renderContainer('position relative', ['7', '8', '9'], { position: 'relative' })}
    </Box>
  );
}
