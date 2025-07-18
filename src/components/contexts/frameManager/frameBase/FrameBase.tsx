'use client';

import React, { useEffect, useState } from 'react';
import Collapse from '@mui/material/Collapse';
import { useFrame } from '@/components/contexts/frameManager/FrameManager';
import componentRegistry from '@/components/contexts/frameManager/componentRegistry';
import ElementController from '../../../addableElements/elementController/ElementController';

interface FrameBaseProps {
  frameName: string;
  disableElementControlsForChildren?: boolean;
}

function CollapseWrapper({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(true);
  }, []);

  return <Collapse in={open} timeout={200}>{children}</Collapse>;
}

export default function FrameBase({ frameName, disableElementControlsForChildren = false }: FrameBaseProps) {
  const { allFrameElements, addFrame, removeFrame, frameContainerRefs } = useFrame();
  const elements = allFrameElements[frameName] || [];

  useEffect(() => {
    if (!frameName) return;
    addFrame(frameName);
  }, [frameName]);

  return (
    <>
      {elements.map(el => {
        const entry = componentRegistry[el.componentName];
        if (!entry) return null;
        const { component: Component, neededProps = {} } = entry;
        const extraProps = el.isFrameOrContainer ? { savedName: el.id } : {};

        return (
          <ElementController
            key={el.id}
            elementToControl={el}
            controlsDisabled={disableElementControlsForChildren}
            shouldShowName={el.isFrameOrContainer}
            containerRef={frameContainerRefs[frameName]}
            connectedFrameOrContainerName={frameName}
          >
            <CollapseWrapper>
              <Component {...neededProps} {...extraProps} />
            </CollapseWrapper>
          </ElementController>
        );
      })}
    </>
  );
}
