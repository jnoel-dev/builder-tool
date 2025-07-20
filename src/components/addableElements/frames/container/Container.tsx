import React, { useEffect } from 'react';
import Box from "@mui/material/Box";
import ContainerBase from "@/components/addableElements/frames/containerBase/ContainerBase";
import { useFrame } from "@/components/contexts/frameManager/FrameManager";


interface ContainerProps {
  containerType: string;
  savedName: string;
}



export default function Container({
  containerType = "vertical",
  savedName,
}: ContainerProps) {
  const { allFrameElements } = useFrame();
  const hasChildren = allFrameElements[savedName]?.length > 0;



  return (
    <Box
      sx={{
        border: '1px solid',
        display: 'flex', 
        flexDirection: containerType === "horizontal" ? "row" : "column",
        maxWidth: '100%',
      }}
    >
      <ContainerBase frameName={savedName} disableElementControlsForChildren={true} />
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
