'use client';

import React, { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import { useFrame, FrameElement } from '@/components/contexts/FrameManager/FrameManager';


interface FrameProps {
  savedName: string;
  frameType: string;
}

export default function Frame({ frameType, savedName }: FrameProps) {
  const { frameContainerRefs, addFrame, allFrameElements,removeElementFromFrame, updateElementPosition } = useFrame();
  const elements = allFrameElements[savedName] || [];
  const [size, setSize] = useState({ width: 0, height: 0 });
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const previousElementsRef = useRef<FrameElement[] | null>(null);
  const [isIframeReady, setIsIframeReady] = useState(false);

  useEffect(() => {
    function handleReady(e: MessageEvent) {
      if (e.data?.type === 'iframeReady') {
        console.log("received iframe ready!")
        setIsIframeReady(true);
      }
    }
    window.addEventListener('message', handleReady);
    return () => window.removeEventListener('message', handleReady);
  }, []);

  //frame should be added only when truly mounted
 //idk maybe change later
  useEffect(() => {
      if (!savedName) return;
      addFrame(savedName);
    }, [savedName]);

useEffect(() => {
  if (window.top === window) return; 
  console.log("SENDING POST")
  window.top?.postMessage({
    type: 'frameAdded',
    savedName,
  }, '*');
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


// sends element data from top frame to iframe to sync element data
useEffect(() => {
  console.log("trying to sync")
  console.log("isIframeReady: ", isIframeReady)
  
  if (!isIframeReady) return;

  previousElementsRef.current = elements;

  const targetWindow = iframeRef.current?.contentWindow;
  if (!targetWindow) return;

  console.log("sending message from:", window.name, "to sync data");
  targetWindow.postMessage({
    type: 'syncFrame',
    frameName: savedName,
    elements,
  }, '*');
}, [elements, isIframeReady]);



  return (
    <Box
      sx={{
        border: 'dashed',
        display: 'flex',
      }}
    >
      <iframe
        ref={iframeRef}
        name={savedName}
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
