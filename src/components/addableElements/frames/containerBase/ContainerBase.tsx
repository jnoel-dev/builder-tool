"use client";

import React, { ReactNode, useEffect, useState } from "react";
import Collapse from "@mui/material/Collapse";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
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
  const { frameElementsByFrameName, containerRefs, registerFrame } = useFrame();
  const elements = frameElementsByFrameName[frameName] || [];

  const [displayName, setDisplayName] = React.useState("");


  useEffect(() => {
    if (frameName) registerFrame(frameName);
  }, [frameName]);

  useEffect(() => {
    const targetWindow = window.opener ?? window.top;
    if (targetWindow === window) return;
    if (POST_MESSAGE_LOG_ENABLED) {
      console.log(
        `[PostMessage Send] frameAdded | from: ${window.name || "TopFrame"} | newFrame: ${frameName}`
      );
    }
    targetWindow.postMessage(
      { type: "frameAdded", frameName: frameName },
      "*"
    );
  }, [frameName]);

useEffect(() => {
  const segments = document.location.pathname.split("/").filter(Boolean);

  let page = "Home";

  // Case: Top frame (e.g., /Page1)
  if (segments[0] !== "frame") {
    page = segments[0] || "";
  }

  // Case: Iframe (e.g., /frame/name/Page1)
  if (segments[0] === "frame") {
    page = segments[2] || ""; // segments[2] is the page name in iframe, or empty if just /frame/name/
  }

  setDisplayName(page.charAt(0).toUpperCase() + page.slice(1));
}, []);



  return (
    <>
      <Box sx={{ mb: 1 }}>
        <Typography variant="h6" fontWeight="bold">
          {displayName}
        </Typography>
      </Box>

      {elements.map((element) => {
        const registryEntry = componentRegistry[element.componentName];
        if (!registryEntry) return null;

        const { component: Component, neededProps = {} } = registryEntry;
        const instanceProps = element.customProps || {};
        const extraProps = element.isFrameOrContainer ? { savedName: element.id } : {};

        const containerRef = containerRefs[frameName];

        return (
          <ElementController
            key={element.id}
            elementToControl={element}
            controlsDisabled={disableElementControlsForChildren}
            shouldShowName={element.isFrameOrContainer}
            containerRef={containerRef}
            connectedFrameOrContainerName={frameName}
          >
            <CollapseWrapper>
              <Component
                {...neededProps}
                {...instanceProps}
                {...extraProps}
                ref={containerRef}
              />
            </CollapseWrapper>
          </ElementController>
        );
      })}
    </>
  );
}
