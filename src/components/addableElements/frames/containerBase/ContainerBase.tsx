"use client";

import React, { ReactNode, useEffect } from "react";
import Collapse from "@mui/material/Collapse";
import {
  useFrame,
  POST_MESSAGE_LOG_ENABLED,
} from "@/components/contexts/FrameManager/FrameManager";
import componentRegistry from "@/components/contexts/FrameManager/componentRegistry";
import ElementController from "../../elementController/ElementController";

interface ContainerBaseProps {
  frameName: string;
  disableElementControlsForChildren?: boolean;
}

function CollapseWrapper({ children }: { children: ReactNode }) {
  const [open, setOpen] = React.useState(false);
  useEffect(() => setOpen(true), []);
  return <Collapse in={open} timeout={200}>{children}</Collapse>;
}

export default function ContainerBase({
  frameName,
  disableElementControlsForChildren = false,
}: ContainerBaseProps) {
  const { frameElementsMap, containerRefs, registerFrame } = useFrame();
  const elements = frameElementsMap[frameName] || [];

  useEffect(() => {
    if (frameName) registerFrame(frameName);
  }, [frameName]);

useEffect(() => {
  const targetWindow = window.opener ?? window.top
  if (targetWindow === window) return
  if (POST_MESSAGE_LOG_ENABLED) {
    console.log(
      `[PostMessage Send] frameAdded | from: ${window.name || 'TopFrame'} | newFrame: ${frameName}`
    )
  }
  targetWindow.postMessage(
    { type: 'frameAdded', frameName: frameName },
    '*'
  )
}, [frameName])

  return (
    <>
      {elements.map((el) => {
        const registryEntry = componentRegistry[el.componentName];
        if (!registryEntry) return null;

        const { component: Component, neededProps = {} } = registryEntry;
        const extraProps = el.isFrameOrContainer ? { savedName: el.id } : {};
        const containerRef = containerRefs[frameName];

        return (
          <ElementController
            key={el.id}
            elementToControl={el}
            controlsDisabled={disableElementControlsForChildren}
            shouldShowName={el.isFrameOrContainer}
            containerRef={containerRef}
            connectedFrameOrContainerName={frameName}
          >
            <CollapseWrapper>
              <Component {...neededProps} {...extraProps} ref={containerRef} />
            </CollapseWrapper>
          </ElementController>
        );
      })}
    </>
  );
}
