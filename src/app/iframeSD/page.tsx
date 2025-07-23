'use client';

import { useEffect } from 'react';
import { useBackground } from '@/components/contexts/backgroundContext/BackgroundManager';
import ContainerBase from '@/components/addableElements/frames/containerBase/ContainerBase';
import { useFrame } from '@/components/contexts/FrameManager/FrameManager';
import { useTheme } from '@mui/material/styles';
export default function IframeSD() {
  const { setShowBackground } = useBackground();
  const { frameContainerRefs } = useFrame();
  const theme = useTheme();

  useEffect(() => {
    setShowBackground(false);
  }, [setShowBackground]);

  return (
    <div
      ref={frameContainerRefs["TopFrame"]}
      style={{
        width: '100%',
        height: '100%',
        position: 'fixed',
        top: 0,
        right: 0,
        overflowY: 'auto',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: theme.palette.secondary.main,
        
      }}
    >
      <ContainerBase frameName='TopFrame'/>
    </div>
  );
}
