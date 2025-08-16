'use client';

import React, { useEffect, useState, useRef } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme } from '@mui/material/styles';

import { useFrame, POST_MESSAGE_LOG_ENABLED } from '@/components/contexts/FrameManager/FrameManager';
import { FrameElement } from '@/components/contexts/FrameManager/frameUtils';

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
  function gatherFrames(frameId: string, visited = new Set<string>()): Record<string, FrameElement[]> {
    if (visited.has(frameId)) return {};
    visited.add(frameId);
    const elements = allElements[frameId] || [];
    const result: Record<string, FrameElement[]> = { [frameId]: elements };
    for (const element of elements) {
      if (element.isFrameOrContainer) Object.assign(result, gatherFrames(element.id, visited));
    }
    return result;
  }

  const collected = gatherFrames(startingFrame);
  const topLevel = collected[startingFrame] || [];
  const nested: Record<string, FrameElement[]> = {};
  for (const [id, els] of Object.entries(collected)) if (id !== startingFrame) nested[id] = els;
  return { TopFrame: topLevel, ...nested };
}

export default function Frame({ savedName, frameType }: FrameProps) {
  const { containerRefs, registerFrame, frameElementsByFrameName } = useFrame();
  const [iframeSize, setIframeSize] = useState({ width: 0, height: 0 });
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const popupWindowRef = useRef<Window | null>(null);
  const [isIframeDomLoaded, setIsIframeDomLoaded] = useState(false);
  const lastIframePayloadJsonRef = useRef<string>('');
  const lastPopupPayloadJsonRef = useRef<string>('');
  const registeredFramesRef = useRef<Set<string>>(new Set());
  const isPopup = frameType === 'popupSameDomain' || frameType === 'popupCrossDomain';
  const isSameDomain = frameType === 'sameDomain' || frameType === 'popupSameDomain';
  const isDev = process.env.NODE_ENV === 'development';
  const theme = useTheme();

  const iframeSrc = isSameDomain
    ? `${SAME_DOMAIN_PATH}${savedName}`
    : `${isDev ? LOCAL_CROSS_DOMAIN_ORIGIN : PROD_CROSS_DOMAIN_ORIGIN}${SAME_DOMAIN_PATH}${savedName}`;

  const openPopup = () => {
    const popupWidth = window.innerWidth / 2;
    const popupHeight = window.innerHeight / 2;
    const popup = window.open(iframeSrc, savedName, `width=${popupWidth},height=${popupHeight}`);
    popupWindowRef.current = popup;
    lastPopupPayloadJsonRef.current = '';
  };

  useEffect(() => {
    if (!savedName) return;
    if (registeredFramesRef.current.has(savedName)) return;
    registeredFramesRef.current.add(savedName);
    registerFrame(savedName);
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
    lastIframePayloadJsonRef.current = '';
    lastPopupPayloadJsonRef.current = '';
    setIsIframeDomLoaded(false);
    registeredFramesRef.current.delete(savedName);
  }, [savedName]);

  const handleIframeLoad = () => {
    setIsIframeDomLoaded(true);

    const win = iframeRef.current?.contentWindow;
    if (!win) return;

    const startLoading = () => {
      setIsIframeDomLoaded(false);
    };

    try {
      win.addEventListener('beforeunload', startLoading);
    } catch {}
  };

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

  const showSpinner = !isIframeDomLoaded;

  return (
    <Box>
      <Box
        ref={containerRefs[savedName]}
        id="iframeContainer"
        sx={{ border: 'dashed', display: 'flex', position: 'relative' }}
      >
        {showSpinner && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
              background: 'rgba(0,0,0,0.5)',
            }}
          >
            <CircularProgress />
          </Box>
        )}
        <iframe
          ref={iframeRef}
          name={savedName}
          src={iframeSrc}
          width={iframeSize.width}
          height={iframeSize.height}
          onLoad={handleIframeLoad}
          style={{ border: 'none', flex: '0 0 auto' }}
        />
      </Box>
    </Box>
  );
}
