'use client'

import { useEffect } from 'react';
import { useBackground } from '@/components/contexts/backgroundContext/BackgroundManager';
import ContainerBase from '@/components/addableElements/frames/containerBase/ContainerBase';
import { useFrame } from '@/components/contexts/FrameManager/FrameManager';
import { useTheme } from '@mui/material/styles';

export default function FramePage() {
  const { setShowBackground } = useBackground();
  const { containerRefs } = useFrame();
  const theme = useTheme();

  useEffect(() => {
    const isPopup = Boolean(window.opener);
    setShowBackground(isPopup);
  }, [setShowBackground]);

  return (
    <div
      ref={containerRefs["TopFrame"]}
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
      <ContainerBase connectedFrameName="TopFrame" hasOwnWindowObject={true} />
    </div>
  );
}