'use client';

import React, { useEffect, useState, useRef } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import {
  useFrame,
  FrameElement,
  POST_MESSAGE_LOG_ENABLED,
} from '@/components/contexts/FrameManager/FrameManager';

interface FrameProps {
  savedName: string;
  frameType: string;
}

function getSyncPayload(
  frameName: string,
  map: Record<string, FrameElement[]>
): Record<string, FrameElement[]> {
  function collectRecursively(
    frame: string,
    seen = new Set<string>()
  ): Record<string, FrameElement[]> {
    if (seen.has(frame)) return {};
    seen.add(frame);
    const direct = map[frame] || [];
    const collected: Record<string, FrameElement[]> = { [frame]: direct };
    for (const e of direct) {
      if (e.isFrameOrContainer) {
        Object.assign(collected, collectRecursively(e.id, seen));
      }
    }
    return collected;
  }

  const allNested = collectRecursively(frameName);
  const rootElements = allNested[frameName] || [];
  const nestedElements: Record<string, FrameElement[]> = {};
  for (const [k, els] of Object.entries(allNested)) {
    if (k !== frameName) nestedElements[k] = els;
  }
  return { TopFrame: rootElements, ...nestedElements };
}

export default function Frame({ savedName, frameType }: FrameProps) {
  const { containerRefs, registerFrame, frameElementsMap } = useFrame();
  const [iframeSize, setIframeSize] = useState({ width: 0, height: 0 });
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [isIframeReady, setIsIframeReady] = useState(false);
  const sameDomainUrl = `/frame/${savedName}`;
  const popupWindowRef = useRef<Window | null>(null);

  const openPopup = () => {
    const width = window.innerWidth / 2;
    const height = window.innerHeight;
    const popup = window.open(
      sameDomainUrl,
      savedName,
      `width=${width},height=${height}`
    );
    popupWindowRef.current = popup;
  };

  useEffect(() => {
    function handleReady(event: MessageEvent) {
      if (event.data?.type !== 'iframeReady') return;
      setIsIframeReady(true);
      if (POST_MESSAGE_LOG_ENABLED) {
        console.log(
          `[PostMessage Receive] iframeReady | frameName: ${event.data.frameName} | target: ${window.name || 'TopFrame'}`
        );
      }

      if (frameType === 'popupSameDomain') {
        const popup = popupWindowRef.current;
        if (!popup) return;
        const payload = getSyncPayload(savedName, frameElementsMap);
        if (POST_MESSAGE_LOG_ENABLED) {
          console.log(
            `[PostMessage Send] syncFrame → popup | frame: ${savedName}`,
            payload
          );
        }
        popup.postMessage(
          { type: 'syncFrame', frameName: savedName, elements: payload },
          '*'
        );
      }
    }
    window.addEventListener('message', handleReady);
    return () => window.removeEventListener('message', handleReady);
  }, [frameElementsMap, frameType, savedName]);

  useEffect(() => {

    if (frameType !== 'popupSameDomain') return;
  
    const popup = popupWindowRef.current;
    if (!popup || !isIframeReady) return;
    const payload = getSyncPayload(savedName, frameElementsMap);
    if (POST_MESSAGE_LOG_ENABLED) {
      console.log(
        `[PostMessage Send] syncFrame → popup | frame: ${savedName}`,
        payload
      );
    }
    popup.postMessage(
      { type: 'syncFrame', frameName: savedName, elements: payload },
      '*'
    );
  }, [frameElementsMap, isIframeReady, frameType, savedName]);

  useEffect(() => {
    if (!savedName) return;
    registerFrame(savedName);
  }, [savedName]);

  useEffect(() => {
    
    const targetWindow = window.opener ?? window.top;
    if (targetWindow === window) return;
    if (POST_MESSAGE_LOG_ENABLED) {
      console.log(
        `[PostMessage Send] frameAdded | from: ${window.name || 'TopFrame'} | newFrame: ${savedName}`
      );
    }
    console.log("send for target: ",targetWindow)
    targetWindow.postMessage(
      { type: 'frameAdded', frameName: savedName },
      '*'
    );
  }, [savedName]);

  useEffect(() => {
    function updateSize() {
      const topElement = containerRefs['TopFrame']?.current;
      if (!topElement) return;
      const { width, height } = topElement.getBoundingClientRect();
      setIframeSize({ width: width / 2, height: height / 2 });
    }
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [containerRefs]);

  useEffect(() => {
    if (!isIframeReady) return;
    const childWindow = iframeRef.current?.contentWindow;
    if (!childWindow) return;
    const payload = getSyncPayload(savedName, frameElementsMap);
    if (POST_MESSAGE_LOG_ENABLED) {
      console.log(
        `[PostMessage Send] syncFrame → iframe | frame: ${savedName}`,
        payload
      );
    }
    childWindow.postMessage(
      { type: 'syncFrame', frameName: savedName, elements: payload },
      '*'
    );
  }, [isIframeReady, frameElementsMap, savedName]);

  const isDev = process.env.NODE_ENV === 'development';
  const iframeSrc =
    frameType === 'sameDomain'
      ? `/frame/${savedName}`
      : isDev
      ? `http://localhost:3001/frame/${savedName}`
      : `https://frame.jonnoel.dev/frame/${savedName}`;

  if (frameType === 'popupSameDomain') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <Button variant="contained" onClick={openPopup}>
          Open {savedName} in popup
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ border: 'dashed', display: 'flex' }}>
      <iframe
        ref={iframeRef}
        name={savedName}
        src={iframeSrc}
        width={iframeSize.width}
        height={iframeSize.height}
        style={{ border: 'none', flex: '0 0 auto' }}
      />
    </Box>
  );
}
