"use client";

import React, { useEffect, useState, useRef } from 'react';
import Box from '@mui/material/Box';
import {
  useFrame,
  FrameElement,
  POST_MESSAGE_LOG_ENABLED,
} from '@/components/contexts/FrameManager/FrameManager';

interface FrameProps {
  savedName: string;
  frameType: string;
}

export default function Frame({ savedName, frameType }: FrameProps) {
  const { containerRefs, registerFrame, frameElementsMap } = useFrame();
  const [iframeSize, setIframeSize] = useState({ width: 0, height: 0 });
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [isIframeReady, setIsIframeReady] = useState(false);

  useEffect(() => {
    function handleReady(event: MessageEvent) {
      if (event.data?.type !== 'iframeReady') return;
      if (POST_MESSAGE_LOG_ENABLED) {
        console.log(
          `[PostMessage Receive] iframeReady | source: ${(event.source as Window)?.name || 'TopFrame'} | target: ${window.name || 'TopFrame'}`
        );
      }
      setIsIframeReady(true);
    }
    window.addEventListener('message', handleReady);
    return () => window.removeEventListener('message', handleReady);
  }, []);

  useEffect(() => {
    if (!savedName) return;
    registerFrame(savedName);
  }, [savedName]);

  useEffect(() => {
    if (window.top === window) return;
    if (POST_MESSAGE_LOG_ENABLED) {
      console.log(
        `[PostMessage Send] frameAdded | from: ${window.name || 'TopFrame'} | newFrame: ${savedName}`
      );
    }
    window.top?.postMessage({ type: 'frameAdded', frameName: savedName }, '*');
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

    function collectFrameElementsRecursively(
      frameName: string,
      elementMap: Record<string, FrameElement[]>,
      visited = new Set<string>()
    ): Record<string, FrameElement[]> {
      if (visited.has(frameName)) return {};
      visited.add(frameName);
      const directElements = elementMap[frameName] || [];
      const collectedElements: Record<string, FrameElement[]> = { [frameName]: directElements };
      for (const element of directElements) {
        if (element.isFrameOrContainer) {
          const nested = collectFrameElementsRecursively(element.id, elementMap, visited);
          Object.assign(collectedElements, nested);
        }
      }
      return collectedElements;
    }

    const childWindow = iframeRef.current?.contentWindow;
    if (!childWindow) return;

    const allNestedElements = collectFrameElementsRecursively(savedName, frameElementsMap);
    const rootElements = allNestedElements[savedName] || [];
    const descendantElements: Record<string, FrameElement[]> = {};

    for (const [frameKey, elements] of Object.entries(allNestedElements)) {
      if (frameKey !== savedName) {
        descendantElements[frameKey] = elements;
      }
    }

    const elementsToSync = { TopFrame: rootElements, ...descendantElements };

    if (POST_MESSAGE_LOG_ENABLED) {
      console.log(
        `[PostMessage Send] syncFrame | from: ${window.name || 'TopFrame'} | frame: ${savedName}`,
        elementsToSync
      );
    }

    childWindow.postMessage(
      { type: 'syncFrame', frameName: savedName, elements: elementsToSync },
      '*'
    );
  }, [isIframeReady, frameElementsMap, savedName]);

  const isDev = process.env.NODE_ENV === 'development';
  const frameSrc =
    frameType === 'sameDomain'
      ? '/frame'
      : isDev
      ? 'http://localhost:3001/frame'
      : 'https://frame.jonnoel.dev/frame';

  return (
    <Box sx={{ border: 'dashed', display: 'flex' }}>
      <iframe
        ref={iframeRef}
        name={savedName}
        src={frameSrc}
        width={iframeSize.width}
        height={iframeSize.height}
        style={{ border: 'none', flex: '0 0 auto' }}
      />
    </Box>
  );
}
