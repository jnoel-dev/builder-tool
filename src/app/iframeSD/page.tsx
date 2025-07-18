'use client';

import { useEffect } from 'react';
import { useBackground } from '@/components/contexts/backgroundContext/BackgroundManager';

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
      <div>
        This is the iframe page — background is disabled.
      </div>
    </div>
  );
}
