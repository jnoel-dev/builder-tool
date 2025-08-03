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

  function renderLabeledContainer(labelText: string, boxTexts: string[], containerStyles: object) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '100%' }}>
        <Box
          sx={{
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
            width: '100%',
            ...containerStyles,
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
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        paddingTop: 2,
        width: '100%',
      }}
    >
      {renderLabeledContainer('css override', ['1', '2', '3'], { filter: 'hue-rotate(45deg)' })}
      {renderLabeledContainer('overflow hidden', ['4', '5', '6'], { overflow: 'clip' })}
    </Box>
  );
}
