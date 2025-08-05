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
  const [isExpanded, setIsExpanded] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const theme = useTheme();

  function updateSize(): void {
    const topFrameElement = containerRefs["TopFrame"]?.current;
    if (topFrameElement) {
      const rect = topFrameElement.getBoundingClientRect();
      setDimensions({ width: rect.width / 2, height: rect.height / 2 });
    }
  }

  useEffect(() => {
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [containerRefs]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isExpanded) {
      window.location.hash = savedName;
    } else {
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search
      );
    }
  }, [isExpanded, savedName]);

  function handleToggle(): void {
    setIsExpanded((prev) => !prev);
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
            flexDirection:
              fragmentType === "horizontal" ? "row" : "column",
            justifyContent: "center",
            alignItems: "center",
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
