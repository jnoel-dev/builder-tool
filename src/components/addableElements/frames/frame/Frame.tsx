'use client';

import React, { useEffect, useState, useRef } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';

import {
  useFrame,
  FrameElement,
  POST_MESSAGE_LOG_ENABLED,
} from '@/components/contexts/FrameManager/FrameManager';

interface FrameProps {
  savedName: string;
  frameType: 'sameDomain' | 'crossDomain' | 'popupSameDomain' | 'popupCrossDomain';
}

const LOCAL_CROSS_DOMAIN_ORIGIN = 'http://localhost:3001';
const PROD_CROSS_DOMAIN_ORIGIN = 'https://frame.jonnoel.dev';
const SAME_DOMAIN_PATH = '/frame/';

function getSyncPayload(
  startingFrame: string,
  allElements: Record<string, FrameElement[]>
): Record<string, FrameElement[]> {
  function gatherFrames(
    frameId: string,
    visited = new Set<string>()
  ): Record<string, FrameElement[]> {
    if (visited.has(frameId)) return {};
    visited.add(frameId);
    const elements = allElements[frameId] || [];
    const result: Record<string, FrameElement[]> = { [frameId]: elements };
    for (const element of elements) {
      if (element.isFrameOrContainer) {
        Object.assign(result, gatherFrames(element.id, visited));
      }
    }
    return result;
  }

  const collectedFrames = gatherFrames(startingFrame);
  const topLevelElements = collectedFrames[startingFrame] || [];
  const nestedFrames: Record<string, FrameElement[]> = {};
  for (const [frameId, elements] of Object.entries(collectedFrames)) {
    if (frameId !== startingFrame) nestedFrames[frameId] = elements;
  }
  return { TopFrame: topLevelElements, ...nestedFrames };
}

export default function Frame({ savedName, frameType }: FrameProps) {
  const { containerRefs, registerFrame, frameElementsMap } = useFrame();
  const [iframeSize, setIframeSize] = useState({ width: 0, height: 0 });
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [isIframeReady, setIsIframeReady] = useState(false);
  const popupWindowRef = useRef<Window | null>(null);
  const isPopup = frameType === 'popupSameDomain' || frameType === 'popupCrossDomain';
  const isSameDomain = frameType === 'sameDomain' || frameType === 'popupSameDomain';
  const isDev = process.env.NODE_ENV === 'development';
  const theme = useTheme();

  const iframeSrc = isSameDomain
    ? `${SAME_DOMAIN_PATH}${savedName}`
    : `${isDev ? LOCAL_CROSS_DOMAIN_ORIGIN : PROD_CROSS_DOMAIN_ORIGIN}${SAME_DOMAIN_PATH}${savedName}`;

  const openPopup = () => {
    const width = window.innerWidth / 2;
    const height = window.innerHeight;
    const popup = window.open(
      iframeSrc,
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

      if (isPopup) {
        const popup = popupWindowRef.current;
        if (!popup) return;
        const payload = getSyncPayload(savedName, frameElementsMap);
        if (POST_MESSAGE_LOG_ENABLED) {
          console.log(`[PostMessage Send] syncFrame → popup | frame: ${savedName}`, payload);
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
    if (!isPopup || !isIframeReady) return;
    const popup = popupWindowRef.current;
    if (!popup) return;
    const payload = getSyncPayload(savedName, frameElementsMap);
    if (POST_MESSAGE_LOG_ENABLED) {
      console.log(`[PostMessage Send] syncFrame → popup | frame: ${savedName}`, payload);
    }
    popup.postMessage(
      { type: 'syncFrame', frameName: savedName, elements: payload },
      '*'
    );
  }, [frameElementsMap, isIframeReady, isPopup, savedName]);

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
      console.log(`[PostMessage Send] syncFrame → iframe | frame: ${savedName}`, payload);
    }
    childWindow.postMessage(
      { type: 'syncFrame', frameName: savedName, elements: payload },
      '*'
    );
  }, [isIframeReady, frameElementsMap, savedName]);

  if (isPopup) {
    return (
        <Box
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.text.primary,
            padding: 2,
          }}
        >
         
            
            <Button
              variant="contained"
              onClick={openPopup}
              color="secondary"
              sx={{ color: theme.palette.text.primary, width: '100%', px: 5 }}
            >
              Open Popup Window
            </Button>
     
        </Box>
    );
  }

  return (
    <Box ref={containerRefs[savedName]} id="iframeContainer" sx={{ border: 'dashed', display: 'flex' }}>
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
