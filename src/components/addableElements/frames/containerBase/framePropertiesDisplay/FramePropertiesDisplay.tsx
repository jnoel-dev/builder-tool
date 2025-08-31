'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

type FramePropertiesDisplayProps = {
  properties?: Record<string, unknown>;
};

function formatValue(value: unknown): string {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export default function FramePropertiesDisplay({ properties }: FramePropertiesDisplayProps) {
  const hasProperties = properties && Object.keys(properties).length > 0;
  if (!hasProperties) {
    return <Typography variant="body2" sx={{ color: 'white' }} />;
  }

  const entries = Object.entries(properties as Record<string, unknown>);

  return (
    <Box>
      <Stack spacing={0.5}>
        {entries.map(([propertyKey, propertyValue]) => {
          const color = propertyKey === 'CspInHeaders' ? 'red' : 'white';
          return (
            <Typography key={propertyKey} variant="body2" sx={{ color }}>
              <strong>{propertyKey}</strong>: {formatValue(propertyValue)}
            </Typography>
          );
        })}
      </Stack>
    </Box>
  );
}
