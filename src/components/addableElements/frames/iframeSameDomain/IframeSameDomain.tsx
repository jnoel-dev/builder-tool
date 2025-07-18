import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import FrameBase from "@/components/contexts/frameManager/frameBase/FrameBase";
import { useFrame } from "@/components/contexts/frameManager/FrameManager";

interface IframeSameDomainProps {
  savedName: string;
}

export default function IframeSameDomain({
  savedName,
}: IframeSameDomainProps) {
  const { frameContainerRefs, allFrameElements } = useFrame();
  const hasChildren = allFrameElements[savedName]?.length > 0;

  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      const topFrameElement = frameContainerRefs['TopFrame']?.current;
      if (topFrameElement) {
        const topFrameRect = topFrameElement.getBoundingClientRect();
        setSize({
          width: topFrameRect.width * 0.5,
          height: topFrameRect.height * 0.5,
        });
      }
    };

    updateSize();

    window.addEventListener("resize", updateSize);

    return () => {
      window.removeEventListener("resize", updateSize);
    };
  }, [frameContainerRefs['TopFrame']]);

  return (
    <Box
      ref={frameContainerRefs[savedName]}
      sx={{
        border: '1px solid',
        display: 'flex',
        width: size.width,
        height: size.height,
      }}
    >
      <FrameBase frameName={savedName} />
      {!hasChildren && (
        <Box
          sx={{
            wordBreak: 'break-word',
            textAlign: 'center',
            width: 200,
          }}
        >
          Add elements here by selecting frame in Elements menu
        </Box>
      )}
    </Box>
  );
}
