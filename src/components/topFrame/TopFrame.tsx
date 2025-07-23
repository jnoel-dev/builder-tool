'use client';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import ContainerBase from '../addableElements/frames/containerBase/ContainerBase';
import { useFrame } from '../contexts/FrameManager/FrameManager';

export default function TopFrame(){
  const theme = useTheme();
   const { frameContainerRefs } = useFrame();

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
          left: 0,
          fontSize: '20px',
          color: theme.palette.secondary.main,
        }}
      >
        TopFrame
      </Typography>

      <Box
        id="TopFrame"
        ref={frameContainerRefs["TopFrame"]}
        sx={{
          position: 'relative',
          overflow: 'hidden',
          width: '100%',
          height: '100%',
          border: 'dashed',
          color: theme.palette.secondary.main,
        }}
      >
        <ContainerBase frameName='TopFrame'/>
      </Box>
    </div>
  );
}  
  
