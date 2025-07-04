'use client';
import * as React from "react";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { useFrame } from '@/components/frameManager/FrameManager';

interface FrameBaseProps {
  frameName: string;
}

export default function FrameBase({ frameName }: FrameBaseProps) {
  const theme = useTheme();
  const { frameElements, frameRefs } = useFrame(); 
  const elements = frameElements[frameName] || []; 

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
        ref={frameRefs[frameName]}
        sx={{
          position: 'relative',
          overflow: 'hidden',
          width: '100%',
          height: '100%',
          border: 'dashed',
          color: theme.palette.secondary.main,
        }}
      >
        {elements.map((el, i) => (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              left: el.x,
              top: el.y,
              transform: 'translate(-50%, -50%)',   
              transformOrigin: 'center center',
            }}
          >
            {el.component}
          </Box>
        ))}
      </Box>
    </div>
  );
}
