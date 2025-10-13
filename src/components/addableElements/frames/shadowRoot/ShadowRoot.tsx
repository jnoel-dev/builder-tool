"use client";

import React, { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { CssBaseline } from "@mui/material";
import Box from "@mui/material/Box";
import ContainerBase from "@/components/addableElements/frames/containerBase/ContainerBase";
import { useFrame } from "@/components/contexts/FrameManager/FrameManager";
import createCache, { EmotionCache } from "@emotion/cache";
import { CacheProvider } from "@emotion/react";

interface ShadowRootProps {
  shadowRootType?: "open" | "closed";
  savedName: string;
}

export default function ShadowRoot({
  shadowRootType = "open",
  savedName,
}: ShadowRootProps) {
  const { frameElementsByFrameName, containerRefs } = useFrame();
  const shadowHostRef = useRef<HTMLDivElement>(null);
  const [shadowRootNode, setShadowRootNode] = useState<ShadowRoot | null>(null);
  const [emotionCache, setEmotionCache] = useState<EmotionCache>();
  const hasChildren = (frameElementsByFrameName[savedName] || []).length > 0;
  const hasAttachedShadowRootRef = useRef(false);

  useEffect(() => {
    const host = shadowHostRef.current;
    if (!host || hasAttachedShadowRootRef.current) return;

    const root = host.attachShadow({ mode: shadowRootType });
    hasAttachedShadowRootRef.current = true;

    const styleContainer = document.createElement("div");
    root.appendChild(styleContainer);

    //mui uses emotion to allow sx styling. this creates cache so our inline sx style is preserved in shadowroot
    const cache = createCache({
      key: "shadow",
      container: styleContainer,
    });
    setEmotionCache(cache);
    setShadowRootNode(root);
  }, [shadowRootType]);

  const portalContent = (
    <Box
      ref={containerRefs[savedName]}
      sx={{
        border: "1px solid MediumPurple",
        display: "flex",
        flexDirection: "column",
        maxWidth: "100%",
        padding: "10px",
      }}
    >
      <ContainerBase
        connectedFrameName={savedName}
        disableElementControlsForChildren
      />
      {!hasChildren && (
        <Box
          sx={{
            wordBreak: "break-word",
            textAlign: "center",
            width: 200,
          }}
        >
          Add elements here by selecting shadow root in elements menu
        </Box>
      )}
    </Box>
  );

  return (
    <div ref={shadowHostRef}>
      {shadowRootNode && emotionCache && (
        <CacheProvider value={emotionCache}>
          <CssBaseline />
          {createPortal(portalContent, shadowRootNode)}
        </CacheProvider>
      )}
    </div>
  );
}
