import React from 'react';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

export default function Panel({ children }: { children?: React.ReactNode }) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.primary.main,
        padding: 2,
        borderRadius: 1,
        width:"200px",
        height:"200px",
      }}
    >
      {children}
    </Box>
  );
}
