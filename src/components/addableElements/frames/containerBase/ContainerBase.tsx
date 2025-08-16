"use client";

import React, { ReactNode, useEffect, useState, useRef } from "react";
import Collapse from "@mui/material/Collapse";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useFrame, POST_MESSAGE_LOG_ENABLED } from "@/components/contexts/FrameManager/FrameManager";
import componentRegistry from "@/components/contexts/FrameManager/componentRegistry";
import ElementController from "../../elementController/ElementController";

interface ContainerBaseProps {
  frameName: string;
  disableElementControlsForChildren?: boolean;
}

function CollapseWrapper({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => setIsOpen(true), []);
  return <Collapse in={isOpen} timeout={200}>{children}</Collapse>;
}

export default function ContainerBase({
  frameName,
  disableElementControlsForChildren = false,
}: ContainerBaseProps) {
  const { frameElementsByFrameName, containerRefs, registerFrame, replaceFrameElements } = useFrame();
  const elementListForFrame = frameElementsByFrameName[frameName] || [];
  const fallbackRef = useRef<HTMLDivElement | null>(null);
  const containerRefForFrame = containerRefs[frameName] ?? fallbackRef;

  const [pageDisplayName, setPageDisplayName] = useState("");

  const replaceFrameElementsRef = useRef(replaceFrameElements);
  useEffect(() => {
    replaceFrameElementsRef.current = replaceFrameElements;
  }, [replaceFrameElements]);

  useEffect(() => {
    const segments = document.location.pathname.split("/").filter(Boolean);
    let pageName = "Home";
    if (segments[0] !== "frame") pageName = segments[0] || "";
    if (segments[0] === "frame") pageName = segments[2] || "";
    setPageDisplayName(pageName.charAt(0).toUpperCase() + pageName.slice(1));
  }, []);

  useEffect(() => {
    if (!frameName) return;
    registerFrame(frameName);
  }, [frameName]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.source !== window.top) return;
      const data = event.data as { type?: string; frames?: Record<string, any[]> };
      if (!data || data.type !== "syncFrame" || !data.frames) return;

      if (POST_MESSAGE_LOG_ENABLED) {
        console.log(
          `[PostMessage Receive] at "${window.name || "ChildFrame"}" from "TopFrame" | type: syncFrame | content:`,
          data
        );
      }

      const incoming = data.frames as Record<string, any[]>;
      const externalRootName = window.name || "";
      for (const incomingFrameName of Object.keys(incoming)) {
        const localFrameName = incomingFrameName === externalRootName ? "TopFrame" : incomingFrameName;
        replaceFrameElementsRef.current(localFrameName, incoming[incomingFrameName] as any);
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (!window.name) return;
    const targetWindow = window.top;
    const nameForTop = frameName === "TopFrame" ? window.name : frameName;
    const segments = document.location.pathname.split("/").filter(Boolean);
    const pageName = segments[0] === "frame" ? (segments[2] || "HomePage") : (segments[0] || "HomePage");
    const message = { type: "requestSync", frameName: nameForTop, pageName };


    if (POST_MESSAGE_LOG_ENABLED) {
      console.log(
        `[PostMessage Send] from "${window.name}" to "TopFrame" | type: requestSync | content:`,
        message
      );
    }

    targetWindow?.postMessage(message, "*");
  }, [frameName]);

  return (
    <>
      <Box sx={{ mb: 1 }}>
        <Typography variant="h6" fontWeight="bold">
          {pageDisplayName}
        </Typography>
      </Box>

      {elementListForFrame.map((element) => {
        const registryEntry = componentRegistry[element.componentName];
        if (!registryEntry) return null;

        const { component: Component, neededProps = {} } = registryEntry;
        const instanceProps = element.customProps || {};
        const extraProps = element.isFrameOrContainer ? { savedName: element.id } : {};

        return (
          <ElementController
            key={element.id}
            elementToControl={element}
            controlsDisabled={disableElementControlsForChildren}
            shouldShowName={element.isFrameOrContainer}
            containerRef={containerRefForFrame}
            connectedFrameOrContainerName={frameName}
          >
            <CollapseWrapper>
              <Component
                {...neededProps}
                {...instanceProps}
                {...extraProps}
                ref={containerRefForFrame}
              />
            </CollapseWrapper>
          </ElementController>
        );
      })}
    </>
  );
}
