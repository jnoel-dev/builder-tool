'use client';
import { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

interface FrameBaseProps {
  frameName: string;
  children?: ReactNode;
}

export default function FrameBase({ frameName, children }: FrameBaseProps) {
  const theme = useTheme();
  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-block',
        width: '80%',
        height: '80%',
      }}
    >
    <Typography
      variant="subtitle2"
      sx={{
        position: 'absolute',
        top: '-30px',
        left: '0px',
        fontSize: '20px', 
        color: theme.palette.secondary.main,
      }}
    >
      {frameName}
    </Typography>

      <Box
        id={frameName}
        sx={{
          overflow: 'hidden',
          width: '100%',
          height: '100%',
          border: 'dashed',
          color: theme.palette.secondary.main,
        }}
      >
        {children}
      </Box>
    </div>
  );
}
