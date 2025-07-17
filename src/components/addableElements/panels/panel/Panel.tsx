import React from 'react';
import Box from '@mui/material/Box';
import { Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export default function Panel() {
  const theme = useTheme();

  const innerBoxStyles = {
    backgroundColor: theme.palette.secondary.main,
    padding: 2,
    minHeight: "75px",
    minWidth: "75px",
     display: "flex",
    alignItems: "center", 
    justifyContent: "center", 

    fontSize: "1.5rem",
    color: theme.palette.text.primary,
  };

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.text.secondary,
        padding: 2,
      }}
    >
      <Stack direction="row" spacing={2}> 
        <Box sx={innerBoxStyles}>1</Box>
        <Box sx={innerBoxStyles}>2</Box>
        <Box sx={innerBoxStyles}>3</Box>
      </Stack>
    </Box>
  );
}
