'use client';

import React, { useEffect } from 'react';
import { useFrame } from '@/components/frameManager/FrameManager';
import componentRegistry from '@/components/frameManager/componentRegistry';
import ElementController from '../addableElements/elementController/ElementController';

interface FrameBaseProps {
  frameName: string;
}

export default function FrameBase({ frameName }: FrameBaseProps) {
  const { allFrameElements, addFrame, removeFrame } = useFrame();
  const elements = allFrameElements[frameName] || [];

  useEffect(() => {
    addFrame(frameName);
    return () => removeFrame(frameName);
  }, []); 

  return (
    <>
      {elements.map(el => {
        const entry = componentRegistry[el.componentName];
        if (!entry) return null;

        const { component: Component, neededProps = {} } = entry;
        //change later
        const isFrameOrContainer =
          el.id.includes('Frame') || el.id.includes('Container');
        const extraProps = isFrameOrContainer
          ? { savedName: el.id }
          : {};

        return (
          <ElementController
            key={el.id}
            elementId={el.id}
            xPercent={el.xPercent}
            yPercent={el.yPercent}
            showName={isFrameOrContainer}
            connectedFrameOrContainerName={frameName}
          >
            <Component {...neededProps} {...extraProps} />
          </ElementController>
        );
      })}
    </>
  );
}
