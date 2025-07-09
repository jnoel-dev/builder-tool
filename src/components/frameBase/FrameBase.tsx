'use client';

import * as React from "react";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { useFrame } from '@/components/frameManager/FrameManager';
import componentRegistry from "@/components/frameManager/componentRegistry";
import ElementController from "../addableElements/elementController/ElementController";

interface FrameBaseProps {
  frameName: string;
}

export default function FrameBase({ frameName }: FrameBaseProps) {
  const theme = useTheme();
  const { allFrameElements, frameContainerRefs } = useFrame();
  const elements = allFrameElements[frameName] || [];

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-block',
        width: '80%',
        height: '80%',
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{
          position: 'absolute',
          top: '-30px',
          left: '0px',
          fontSize: '20px',
          color: theme.palette.secondary.main,
        }}
      >
        {frameName}
      </Typography>

      <Box
        id={frameName}
        ref={frameContainerRefs[frameName]}
        sx={{
          position: 'relative',
          overflow: 'hidden',
          width: '100%',
          height: '100%',
          border: 'dashed',
          color: theme.palette.secondary.main,
        }}
      >
        {elements.map(element => {
          const ComponentToRender = componentRegistry[element.componentName];
          return (
            <ElementController
              key={element.id}
              elementId={element.id}
              xPercent={element.xPercent}
              yPercent={element.yPercent}
            >
              {ComponentToRender ? <ComponentToRender /> : null}
            </ElementController>
          );
        })}
      </Box>
    </div>
  );
}
