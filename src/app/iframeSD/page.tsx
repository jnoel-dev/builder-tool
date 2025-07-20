'use client';

import { useEffect } from 'react';
import { useBackground } from '@/components/contexts/backgroundContext/BackgroundManager';
import ContainerBase from '@/components/addableElements/frames/containerBase/ContainerBase';

export default function IframeSD() {
  const { setShowBackground } = useBackground();

  useEffect(() => {
    setShowBackground(false);
  }, [setShowBackground]);

  return (
    <div
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
      }}
    >
      <ContainerBase frameName='TopFrame'/>
    </div>
  );
}
