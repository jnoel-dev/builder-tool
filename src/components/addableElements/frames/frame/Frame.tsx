'use client';

import React, { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import { useFrame, FrameElement } from '@/components/contexts/frameManager/FrameManager';


interface FrameProps {
  savedName: string;
  frameType: string;
}

export default function Frame({ frameType, savedName }: FrameProps) {
  const { frameContainerRefs, addFrame, allFrameElements,removeElementFromFrame, updateElementPosition } = useFrame();
  const elements = allFrameElements[savedName] || [];
  const [size, setSize] = useState({ width: 0, height: 0 });
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [hasIframeLoaded, setHasIframeLoaded] = useState(false);
  const iframeLoadedRef = useRef(false); 
  const previousElementsRef = useRef<FrameElement[] | null>(null);


  //frame should be added only when truly mounted
 //idk maybe change later
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


// used to send post message to needed iframe to ensure data in frame manager is synced with iframe
useEffect(() => {

  const previousElements = previousElementsRef.current;

  //i dont want this effect to spam post messages...
  const hasContentChanged =
    !previousElements ||
    previousElements.length !== elements.length ||
    previousElements.some((previousElement, i) => {
      const currentElement = elements[i];
      return (
        previousElement.id !== currentElement.id ||
        previousElement.componentName !== currentElement.componentName ||
        previousElement.xPercent !== currentElement.xPercent ||
        previousElement.yPercent !== currentElement.yPercent ||
        previousElement.isFrameOrContainer !== currentElement.isFrameOrContainer
      );
    });

  if (!hasContentChanged) return;

  previousElementsRef.current = elements;

  if (!iframeLoadedRef.current) return;
  const targetWindow = iframeRef.current?.contentWindow;
  if (!targetWindow) return;

 
  targetWindow.postMessage(
    {
      type: 'syncFrame',
      frameName: savedName,
      elements,
    },
    '*'
  );
}, [elements]);


useEffect(() => {
  function handleRemoveElementMessage(event: MessageEvent) {
    if (!event.data || typeof event.data !== 'object') return;

    const { type, elementId, frameName } = event.data;

    if (type === 'removeElement' && elementId && frameName) {
     
      removeElementFromFrame(elementId, frameName);
    }
  }

  window.addEventListener('message', handleRemoveElementMessage);
  return () => window.removeEventListener('message', handleRemoveElementMessage);
}, []);

useEffect(() => {
  function handleUpdateElementPositionMessage(event: MessageEvent) {
    if (!event.data || typeof event.data !== 'object') return;

    const {
      type,
      elementId,
      frameName,
      xPercent,
      yPercent
    } = event.data;

    if (type === 'updateElementPosition' && elementId && frameName) {
      updateElementPosition(elementId, xPercent, yPercent, frameName);
    }
  }

  window.addEventListener('message', handleUpdateElementPositionMessage);
  return () => window.removeEventListener('message', handleUpdateElementPositionMessage);
}, []);

useEffect(() => {
  if (!hasIframeLoaded) return;
  const targetWindow = iframeRef.current?.contentWindow;
  if (!targetWindow) return;

  previousElementsRef.current = elements;
  console.log("attemoptingto senc")
  targetWindow.postMessage({
    type: 'syncFrame',
    frameName: savedName,
    elements,
  }, '*');
}, [hasIframeLoaded]);





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
        onLoad={() => {
          iframeLoadedRef.current = true;
          setHasIframeLoaded(true);
          iframeRef.current?.contentWindow?.postMessage({
            type: 'syncFrame',
            frameName: savedName,
            elements,
          }, '*');
        }}

        style={{
          border: 'none',
          flex: '0 0 auto',
        }}
      />
    </Box>
  );
}
