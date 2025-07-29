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
  if (!isIframeReady) return;

  function collectNestedElements(
    currentFrameName: string,
    allElements: Record<string, FrameElement[]>,
    visited: Set<string> = new Set()
  ): Record<string, FrameElement[]> {
    if (visited.has(currentFrameName)) return {};
    visited.add(currentFrameName);

    const result: Record<string, FrameElement[]> = {};
    const currentElements = allElements[currentFrameName] || [];
    result[currentFrameName] = currentElements;

    for (const el of currentElements) {
      if (el.isFrameOrContainer) {
        Object.assign(
          result,
          collectNestedElements(el.id, allElements, visited)
        );
      }
    }

    return result;
  }

  const targetWindow = iframeRef.current?.contentWindow;
  if (!targetWindow) return;

  const nestedTree = collectNestedElements(savedName, allFrameElements);

  console.log("Sending syncFrame postMessage to iframe", {
    from: window.name,
    nestedTree,
  });

  targetWindow.postMessage(
    {
      type: 'syncFrame',
      frameName: savedName,
      elements: {
        TopFrame: nestedTree[savedName] || [],
        ...Object.fromEntries(
          Object.entries(nestedTree).filter(([key]) => key !== savedName)
        ),
      },
    },
    '*'
  );
}, [allFrameElements, isIframeReady]);









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
