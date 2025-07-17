import React from "react";
import Box from "@mui/material/Box";
import FrameBase from "@/components/frameBase/FrameBase";
import { useFrame } from "@/components/frameManager/FrameManager";

interface ContainerProps {
  containerType: string;
  savedName: string;
}

export default function Container({
  containerType = "vertical",
  savedName,
}: ContainerProps) {
  const { frameContainerRefs, allFrameElements } = useFrame();
  const hasChildren = allFrameElements[savedName]?.length > 0;

  return (
    <Box
      ref={frameContainerRefs[savedName]}
      sx={{
        border: '1px solid',
        display: 'flex', 
        flexDirection: containerType === "horizontal" ? "row" : "column",
        maxWidth: '100%',
      }}
    >
      <FrameBase frameName={savedName} disableElementControlsForChildren={true} />
      {!hasChildren && (
        <Box
          sx={{
            wordBreak: 'break-word',
            textAlign: 'center',
            width: 200,
          }}
        >
          Add elements here by selecting container in Elements menu
        </Box>
      )}
    </Box>
  );
}
