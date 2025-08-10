"use client";

import React, { useState, useEffect } from "react";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import ContainerBase from "../containerBase/ContainerBase";
import { useFrame } from "@/components/contexts/FrameManager/FrameManager";
import { useTheme } from "@mui/material";

interface FragmentProps {
  fragmentType?: string;
  savedName: string;
}

export default function Fragment({
  savedName,
  fragmentType = "vertical",
}: FragmentProps) {
  const { containerRefs } = useFrame();
  const theme = useTheme();

  const closedFlagKey = `fragment:${savedName}:closedThisSession`;

  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const closed = sessionStorage.getItem(closedFlagKey) === "1";
    return closed ? false : true; // default open so frameReady runs
  });

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  function updateSize(): void {
    const isTopWindow = typeof window !== "undefined" && window.top === window;

    if (isTopWindow) {
      const topFrameElement = containerRefs["TopFrame"]?.current;
      if (topFrameElement) {
        const rect = topFrameElement.getBoundingClientRect();
        setDimensions({ width: rect.width / 2, height: rect.height / 2 });
        return;
      }
    }

    const w = document.documentElement.clientWidth || window.innerWidth || 0;
    const h = document.documentElement.clientHeight || window.innerHeight || 0;
    setDimensions({ width: w / 2, height: h / 2 });
  }

  useEffect(() => {
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [containerRefs]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // persist open/closed for this session
    sessionStorage.setItem(closedFlagKey, isExpanded ? "0" : "1");

    // add hash on open, remove on close
    const next = isExpanded
      ? `${window.location.pathname}${window.location.search}#${savedName}`
      : `${window.location.pathname}${window.location.search}`;
    window.history.replaceState(null, "", next);
  }, [isExpanded, savedName]);

  // Clear session flag and hash if this fragment owned it
  useEffect(() => {
    return () => {
      try {
        sessionStorage.removeItem(closedFlagKey);
        if (typeof window !== "undefined" && window.location.hash === `#${savedName}`) {
          const next = `${window.location.pathname}${window.location.search}`;
          window.history.replaceState(null, "", next);
        }
      } catch {}
    };
  }, [closedFlagKey, savedName]);

  function handleToggle(): void {
    setIsExpanded(prev => !prev);
  }

  return (
    <Box
      sx={{
        width: dimensions.width,
        height: dimensions.height,
        position: "relative",
      }}
    >
      <Button
        variant="contained"
        onClick={handleToggle}
        sx={{
          position: "absolute",
          width: "100%",
          zIndex: 1,
        }}
      >
        {isExpanded ? `Hide ${savedName}` : `Show ${savedName}`}
      </Button>

      {isExpanded && (
        <Box
          ref={containerRefs[savedName]}
          sx={{
            width: dimensions.width,
            height: dimensions.height,
            backgroundColor: theme.palette.background.default,
            overflow: "auto",
            display: "flex",
            flexDirection: fragmentType === "horizontal" ? "row" : "column",
            justifyContent: "center",
            alignItems: "center",
            paddingTop: 15,
            paddingLeft: 5,
          }}
        >
          <ContainerBase
            frameName={savedName}
            disableElementControlsForChildren={true}
          />
        </Box>
      )}
    </Box>
  );
}
