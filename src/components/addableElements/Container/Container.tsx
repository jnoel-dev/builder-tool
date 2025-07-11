import React from 'react';
import Box from '@mui/material/Box';
import FrameBase from '@/components/frameBase/FrameBase';
import { useFrame } from '@/components/frameManager/FrameManager';

interface ContainerProps {
  containerType: string;
  savedName: string;
}

export default function Container({
  containerType = "vertical",
  savedName,
}: ContainerProps) {
  const { frameContainerRefs } = useFrame();


  return (
    <Box
      ref={frameContainerRefs[savedName]}
      sx={{

        border: '1px solid',
        display: 'inline-block', 
  
      }}
    >
      <FrameBase frameName={savedName} disableElementControlsForChildren={true}/>
    </Box>
  );
}
