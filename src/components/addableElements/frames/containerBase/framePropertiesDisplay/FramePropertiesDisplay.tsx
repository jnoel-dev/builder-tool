'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

type FramePropertiesDisplayProps = {
  properties?: Record<string, unknown>;
};


export default function FramePropertiesDisplay({ properties }: FramePropertiesDisplayProps) {
  const hasProperties = properties && Object.keys(properties).length > 0;
  if (!hasProperties) {
    return <Typography variant="body2" sx={{ color: 'white' }} />;
  }

  const entries = Object.entries(properties as Record<string, unknown>);

  return (
    <Box>
      <Stack spacing={0.5}>
        {entries.map(([propertyKey]) => {
          let textColor: string;
          switch (propertyKey) {
            case 'cspH':
            case 'cspM':
              textColor = 'red';
              break;
            default:
              textColor = 'white';
          }
          return (
            <Typography key={propertyKey} variant="body2" sx={{ color: textColor }}>
              <strong>{propertyKey}</strong>
            </Typography>
          );
        })}
      </Stack>
    </Box>
  );
}
