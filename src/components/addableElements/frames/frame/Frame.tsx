'use client';

import React, { useEffect, useState, useRef } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme } from '@mui/material/styles';
import { useFrame } from '@/components/contexts/FrameManager/FrameManager';
import { POST_MESSAGE_LOG_ENABLED } from '@/components/contexts/FrameManager/FrameManager';
import { SAME_ORIGIN_TARGET } from '@/components/contexts/FrameManager/framePersistence';
import { FrameProperties } from '@/components/contexts/FrameManager/frameUtils';
import FramePropertiesDisplay from '../containerBase/framePropertiesDisplay/FramePropertiesDisplay';

interface FrameProps {
  savedName: string;
  frameType: 'sameDomain' | 'crossDomain' | 'popupSameDomain' | 'popupCrossDomain';
}

const LOCAL_SAME_DOMAIN_ORIGIN = 'http://localhost:3000';
const PROD_SAME_DOMAIN_ORIGIN = 'https://build.jonnoel.dev';
const LOCAL_CROSS_DOMAIN_ORIGIN = 'http://localhost:3001';
const PROD_CROSS_DOMAIN_ORIGIN = 'https://frame.jonnoel.dev';
const FRAME_PATH = '/frame/';

const MESSAGE_CHILD_READY = 'child:ready';
const MESSAGE_CHILD_NAVIGATING = 'child:navigating';

export default function Frame({ savedName, frameType }: FrameProps) {
  const { containerRefs, registerFrame } = useFrame();
  const [iframeSize, setIframeSize] = useState({ width: 0, height: 0 });
  const [isIframeReady, setIsIframeReady] = useState(false);
  const [canRenderIframe, setCanRenderIframe] = useState(false);
  const [useCspParam, setUseCspParam] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const popupWindowRef = useRef<Window | null>(null);
  const lastPopupPayloadJsonRef = useRef<string>('');
  const registeredFramesRef = useRef<Set<string>>(new Set());

  const isPopup = frameType === 'popupSameDomain' || frameType === 'popupCrossDomain';
  const isSameDomain = frameType === 'sameDomain' || frameType === 'popupSameDomain';
  const isDevelopment = process.env.NODE_ENV === 'development';
  const theme = useTheme();

  const childOrigin = isSameDomain
    ? (isDevelopment ? LOCAL_SAME_DOMAIN_ORIGIN : PROD_SAME_DOMAIN_ORIGIN)
    : (isDevelopment ? LOCAL_CROSS_DOMAIN_ORIGIN : PROD_CROSS_DOMAIN_ORIGIN);

  const [frameProperties, setFrameProperties] = useState<FrameProperties>();
  const iframeSrc = `${childOrigin}${FRAME_PATH}${savedName}${useCspParam ? '?csp' : ''}`;

  const openPopup = () => {
    const popupWidth = window.innerWidth / 2;
    const popupHeight = window.innerHeight / 2;
    const popupUrl = `${childOrigin}${FRAME_PATH}${savedName}${useCspParam ? '?csp' : ''}`;
    const popup = window.open(popupUrl, savedName, `width=${popupWidth},height=${popupHeight}`);
    popupWindowRef.current = popup || null;
    lastPopupPayloadJsonRef.current = '';
  };

  useEffect(() => {
    if (!savedName) return;
    if (registeredFramesRef.current.has(savedName)) return;
    registeredFramesRef.current.add(savedName);
    registerFrame(savedName);
  }, []);

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
    function handleChildMessage(messageEvent: MessageEvent) {
      const isFromIframeWindow =
        iframeRef.current?.contentWindow &&
        messageEvent.source === iframeRef.current.contentWindow;
      if (!isFromIframeWindow) return;
      if (messageEvent.origin !== childOrigin) return;

      const receivedMessage = messageEvent.data as { type?: string; frameName?: string };
      const messageType = receivedMessage?.type;
      const messageFrameName = receivedMessage?.frameName;

      const isLoadingMessage =
        messageType === MESSAGE_CHILD_READY || messageType === MESSAGE_CHILD_NAVIGATING;
      if (!isLoadingMessage) return;

      if (messageFrameName !== savedName) return;

      if (POST_MESSAGE_LOG_ENABLED) {
        console.log(
          `[PostMessage Receive] at "Parent" from "Iframe" | type: ${messageType} | content:`,
          receivedMessage
        );
      }

      if (messageType === MESSAGE_CHILD_READY) {
        setIsIframeReady(true);
      } else {
        setIsIframeReady(false);
      }
    }

    window.addEventListener("message", handleChildMessage);
    return () => window.removeEventListener("message", handleChildMessage);
  }, []);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.source !== window.top && event.source !== window.top?.opener) return;
      const data = event.data as { type?: string; properties?: FrameProperties };
      if (!data || data.type !== "syncFrameProperties" || !data.properties) return;

      if (POST_MESSAGE_LOG_ENABLED) {
        const from = event.source === window.top?.opener ? "Main Window" : "TopFrame";
        console.log(
          `[PostMessage Receive] at "${savedName}" from "${from}" | type: syncFrameProperties | content:`,
          data
        );
      }

      setCanRenderIframe(true);
      setFrameProperties(data.properties);

      const hasCspInHeaders = Object.prototype.hasOwnProperty.call(data.properties as object, 'CspInHeaders');
      setUseCspParam(hasCspInHeaders);
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    const targetWindow = window.top?.opener ? window.top.opener : window.top;
    const message = { type: "requestPropertiesSync", frameName: savedName };

    if (POST_MESSAGE_LOG_ENABLED) {
      console.log(
        `[PostMessage Send] from "${window.name}" to "TopFrame" | type: requestPropertiesSync | content:`,
        message
      );
    }
    targetWindow?.postMessage(message, SAME_ORIGIN_TARGET);
  }, []);

  if (isPopup) {
    return (
      <Box sx={{ backgroundColor: theme.palette.primary.main, color: theme.palette.text.primary, padding: 2 }}>
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

  const showSpinner = !canRenderIframe || !isIframeReady;

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
        {canRenderIframe && (
         
    <div style={{ position: "relative" }}>
      <Box sx={{ position: "absolute", top: 0, left: 0, zIndex: 2 }}>
        <FramePropertiesDisplay properties={frameProperties} />
      </Box>

      <iframe
        ref={iframeRef}
        name={savedName}
        src={iframeSrc}
        width={iframeSize.width}
        height={iframeSize.height}
        style={{ border: "none", flex: "0 0 auto" }}
      />
    </div>


       
        )}
      </Box>
    </Box>
  );
}
