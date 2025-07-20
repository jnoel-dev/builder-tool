'use client';

import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { useFrame } from '@/components/contexts/frameManager/FrameManager';

interface frameProps {
  savedName: string;
  frameType: string;
}

export default function Frame({ frameType, savedName }: frameProps) {
  const { frameContainerRefs, addFrame, allFrameElements } = useFrame();

  const [size, setSize] = useState({ width: 0, height: 0 });
 console.log(allFrameElements)
  useEffect(() => {
      if (!savedName) return;
      addFrame(savedName);
    }, [savedName]);

  useEffect(() => {
    const updateSize = () => {
      const topFrameElement = frameContainerRefs['TopFrame']?.current;
      if (topFrameElement) {
        const topFrameRect = topFrameElement.getBoundingClientRect();
        setSize({
          width: topFrameRect.width * 0.5,
          height: topFrameRect.height * 0.5,
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [frameContainerRefs['TopFrame']]);

  return (
    <Box
      sx={{
        border: 'dashed',
        display: 'flex',
      }}
    >
      <iframe
        src="/iframeSD"
        width={size.width}
        height={size.height}
        style={{
          border: 'none',
          flex: '0 0 auto',
        }}
      />
    </Box>
  );
}
