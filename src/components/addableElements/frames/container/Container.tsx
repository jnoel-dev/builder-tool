import React from "react";
import Box from "@mui/material/Box";
import ContainerBase from "@/components/addableElements/frames/containerBase/ContainerBase";
import { useFrame } from "@/components/contexts/FrameManager/FrameManager";

interface ContainerProps {
  containerType: string;
  savedName: string;
}

export default function Container({
  containerType = "vertical",
  savedName,
}: ContainerProps) {
  const { frameElementsByFrameName, containerRefs } = useFrame();
  const hasChildren = frameElementsByFrameName[savedName]?.length > 0;

  return (
    <Box
      ref={containerRefs[savedName]}
      sx={{
        border: "1px solid",
        maxWidth: "100%",
        padding: "10px",
      }}
    >
      <ContainerBase
        connectedFrameName={savedName}
        disableElementControlsForChildren={true}
        shouldDisplayInfo={false}
        parentFlexDirection={containerType === "horizontal" ? "row" : "column"}
      />
      {!hasChildren && (
        <Box
          sx={{
            wordBreak: "break-word",
            textAlign: "center",
            width: 200,
          }}
        >
          Add elements here by selecting container in elements menu
        </Box>
      )}
    </Box>
  );
}
