'use client';

import React, { useEffect, useState } from 'react';
import Collapse from '@mui/material/Collapse';
import { useFrame, FrameElement } from '@/components/contexts/frameManager/FrameManager';
import componentRegistry from '@/components/contexts/frameManager/componentRegistry';
import ElementController from '../../elementController/ElementController';

interface ContainerBaseProps {
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

export default function ContainerBase({
  frameName,
  disableElementControlsForChildren = false,
}: ContainerBaseProps) {
  const {
    allFrameElements,
    frameContainerRefs,
    addFrame,
    replaceElementsInFrame,
  } = useFrame();

  const elements = allFrameElements[frameName] || [];

  useEffect(() => {
        if (!frameName) return;
        addFrame(frameName);
      }, [frameName]);


  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      console.log("found")
      if (
        !event.data ||
        typeof event.data !== 'object' ||
        event.data.type !== 'syncFrame' ||
        event.data.frameName !== window.name
      ) {
        
        return;
      }

      const incoming = event.data.elements;
      if (!Array.isArray(incoming)) return;
      console.log("syncing from container: ",window.name," event: ",event)
      replaceElementsInFrame('TopFrame', incoming as FrameElement[]);
    }

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [replaceElementsInFrame]);

  return (
    <>
      {elements.map((el) => {
      
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
