"use client";

import React, { useState, useEffect, useCallback } from "react";
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
    return closed ? false : true;
  });

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const updateSize = useCallback((): void => {
    const isTopWindow = typeof window !== "undefined" && window.top === window;

    if (isTopWindow) {
      const topFrameElement = containerRefs["TopFrame"]?.current;
      if (topFrameElement) {
        const boundingRect = topFrameElement.getBoundingClientRect();
        setDimensions({
          width: boundingRect.width / 2,
          height: boundingRect.height / 2,
        });
        return;
      }
    }

    const viewportWidth =
      document.documentElement.clientWidth || window.innerWidth || 0;
    const viewportHeight =
      document.documentElement.clientHeight || window.innerHeight || 0;
    setDimensions({ width: viewportWidth / 2, height: viewportHeight / 2 });
  }, [containerRefs]);

  useEffect(() => {
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [updateSize]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(closedFlagKey, isExpanded ? "0" : "1");

    const nextUrl = isExpanded
      ? `${window.location.pathname}${window.location.search}#${savedName}`
      : `${window.location.pathname}${window.location.search}`;
    window.history.replaceState(null, "", nextUrl);
  }, [isExpanded, savedName, closedFlagKey]);

  useEffect(() => {
    return () => {
      try {
        sessionStorage.removeItem(closedFlagKey);
        if (
          typeof window !== "undefined" &&
          window.location.hash === `#${savedName}`
        ) {
          const nextUrl = `${window.location.pathname}${window.location.search}`;
          window.history.replaceState(null, "", nextUrl);
        }
      } catch {}
    };
  }, [closedFlagKey, savedName]);

  function handleToggle(): void {
    setIsExpanded((previous) => !previous);
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
            paddingTop: 5,
          }}
        >
          <ContainerBase
            connectedFrameName={savedName}
            disableElementControlsForChildren={true}
          />
        </Box>
      )}
    </Box>
  );
}
