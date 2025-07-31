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
}

export default function Frame({ savedName }: FrameProps) {
  const { containerRefs, registerFrame, frameElementsMap } = useFrame();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [isIframeReady, setIsIframeReady] = useState(false);

  useEffect(() => {
    function handleReady(event: MessageEvent) {
      if (event.data?.type !== 'iframeReady') return;
      if (POST_MESSAGE_LOG_ENABLED) {
        console.log(
          `[PostMessage Receive] iframeReady` +
          ` | source: ${(event.source as Window)?.name || 'TopFrame'}` +
          ` | target: ${window.name || 'TopFrame'}`
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
        `[PostMessage Send] frameAdded` +
        ` | from: ${window.name || 'TopFrame'}` +
        ` | newFrame: ${savedName}`
      );
    }
    window.top?.postMessage({ type: 'frameAdded', frameName: savedName }, '*');
  }, [savedName]);

  useEffect(() => {
    const updateSize = () => {
      const topEl = containerRefs['TopFrame']?.current;
      if (!topEl) return;
      const { width, height } = topEl.getBoundingClientRect();
      setSize({ width: width / 2, height: height / 2 });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [containerRefs]);

  useEffect(() => {
    if (!isIframeReady) return;

    function collectNested(
      frameName: string,
      map: Record<string, FrameElement[]>,
      visited = new Set<string>()
    ): Record<string, FrameElement[]> {
      if (visited.has(frameName)) return {};
      visited.add(frameName);
      const items = map[frameName] || [];
      const result: Record<string, FrameElement[]> = { [frameName]: items };
      for (const el of items) {
        if (el.isFrameOrContainer) {
          Object.assign(result, collectNested(el.id, map, visited));
        }
      }
      return result;
    }

    const target = iframeRef.current?.contentWindow;
    if (!target) return;

    const nested = collectNested(savedName, frameElementsMap);
    const syncData = {
      TopFrame: nested[savedName] || [],
      ...Object.fromEntries(
        Object.entries(nested).filter(([k]) => k !== savedName)
      ),
    };

    if (POST_MESSAGE_LOG_ENABLED) {
      console.log(
        `[PostMessage Send] syncFrame` +
        ` | from: ${window.name || 'TopFrame'}` +
        ` | frame: ${savedName}`,
        syncData
      );
    }

    target.postMessage({ type: 'syncFrame', frameName: savedName, elements: syncData }, '*');
  }, [frameElementsMap, isIframeReady, savedName, containerRefs]);

  return (
    <Box sx={{ border: 'dashed', display: 'flex' }}>
      <iframe
        ref={iframeRef}
        name={savedName}
        src="/iframeSD"
        width={size.width}
        height={size.height}
        style={{ border: 'none', flex: '0 0 auto' }}
      />
    </Box>
  );
}
