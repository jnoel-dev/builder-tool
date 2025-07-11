'use client';

import React, { useEffect } from 'react';
import { useFrame } from '@/components/frameManager/FrameManager';
import componentRegistry from '@/components/frameManager/componentRegistry';
import ElementController from '../addableElements/elementController/ElementController';

interface FrameBaseProps {
  frameName: string;
  disableElementControlsForChildren?: boolean;
}

export default function FrameBase({ frameName, disableElementControlsForChildren=false }: FrameBaseProps) {
  const { allFrameElements, addFrame, removeFrame, frameContainerRefs} = useFrame();
  const elements = allFrameElements[frameName] || [];

  useEffect(() => {
    addFrame(frameName);
    
  }, [frameName]);

 


  return (
    <>
      {elements.map(el => {
        const entry = componentRegistry[el.componentName];
        if (!entry) return null;
        const { component: Component, neededProps = {} } = entry;
        console.log("IS THIS A FRAME?: ", frameName)
        
        
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
            <Component {...neededProps} {...extraProps} />
          </ElementController>
        );
      })}
    </>
  );
}
