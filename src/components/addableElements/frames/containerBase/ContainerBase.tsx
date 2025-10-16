"use client";

import { ReactNode, useEffect, useState, useRef, ComponentType } from "react";
import Collapse from "@mui/material/Collapse";
import {
  useFrame,
  POST_MESSAGE_LOG_ENABLED,
} from "@/components/contexts/FrameManager/FrameManager";
import componentRegistry from "@/components/contexts/FrameManager/componentRegistry";
import ElementController from "../../elementController/ElementController";
import {
  SAME_ORIGIN_TARGET,
  getFrameProperties,
} from "@/components/contexts/FrameManager/framePersistence";
import { usePathname } from "next/navigation";
import { FrameProperties } from "@/components/contexts/FrameManager/frameUtils";
import { FramesByName } from "@/components/contexts/FrameManager/frameMessaging";
import FramePropertiesDisplay from "./framePropertiesDisplay/FramePropertiesDisplay";

type ComponentName = keyof typeof componentRegistry;

function isComponentName(name: string): name is ComponentName {
  return name in componentRegistry;
}

interface ContainerBaseProps {
  connectedFrameName: string;
  disableElementControlsForChildren?: boolean;
  shouldDisplayInfo?: boolean;
}

function CollapseWrapper({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => setIsOpen(true), []);
  return (
    <Collapse in={isOpen} timeout={200}>
      {children}
    </Collapse>
  );
}

export default function ContainerBase({
  connectedFrameName,
  disableElementControlsForChildren = false,
  shouldDisplayInfo = false,
}: ContainerBaseProps) {
  const {
    frameElementsByFrameName,
    containerRefs,
    replaceFrameElements,
    registerFrame,
    receivedFirebaseResponse,
  } = useFrame();
  const elementListForFrame =
    frameElementsByFrameName[connectedFrameName] || [];
  const fallbackRef = useRef<HTMLDivElement | null>(null);
  const containerRefForFrame = containerRefs[connectedFrameName] ?? fallbackRef;

  const replaceFrameElementsRef = useRef(replaceFrameElements);
  const pathname = usePathname();
  const [frameProperties, setFrameProperties] = useState<FrameProperties>();

  const lastRegisteredFrameNameRef = useRef<string | null>(null);
  useEffect(() => {
    if (lastRegisteredFrameNameRef.current === connectedFrameName) return;
    registerFrame(connectedFrameName);
    lastRegisteredFrameNameRef.current = connectedFrameName;
  }, [connectedFrameName, registerFrame]);

  useEffect(() => {
    if (window === window.top && !window.opener) {
      setFrameProperties(getFrameProperties(connectedFrameName));
      return;
    }
    function onMessage(event: MessageEvent) {
      if (event.source !== window.top && event.source !== window.top?.opener)
        return;

      let sourceWindow = "TopFrame";
      if (event.source === window.top?.opener) {
        sourceWindow = "Main Window";
      }
      const data = event.data as {
        type?: string;
        frames?: FramesByName;
        frameProperties?: FrameProperties;
      };
      if (!data || data.type !== "syncFrame" || !data.frames) return;

      if (POST_MESSAGE_LOG_ENABLED) {
        console.log(
          `[PostMessage Receive] at "${window.name}" from "${sourceWindow}" | type: syncFrame | content:`,
          data,
        );
      }

      setFrameProperties(data.frameProperties);

      const incoming = data.frames as FramesByName;
      const externalRootName = window.name || "";

      for (const incomingFrameName of Object.keys(incoming)) {
        const localFrameName =
          incomingFrameName === externalRootName
            ? "TopFrame"
            : incomingFrameName;
        const incomingElementsForName = incoming[incomingFrameName]
          .elements as (typeof incoming)[string]["elements"];
        replaceFrameElementsRef.current(
          localFrameName,
          incomingElementsForName,
        );
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [receivedFirebaseResponse, connectedFrameName]);

  function sendRequestSync(frameName: string) {
    const targetWindow = window.top?.opener
      ? window.top.opener.top
      : window.top;
    const nameForTop = frameName === "TopFrame" ? window.name : frameName;
    const segments = document.location.pathname.split("/").filter(Boolean);
    const pageName =
      segments[1] === "frame"
        ? segments[3] || "HomePage"
        : segments[1] || "HomePage";
    const message = { type: "requestSync", frameName: nameForTop, pageName };

    if (POST_MESSAGE_LOG_ENABLED) {
      console.log(
        `[PostMessage Send] from "${window.name}" to "TopFrame" | type: requestSync | content:`,
        message,
      );
    }
    targetWindow?.postMessage(message, SAME_ORIGIN_TARGET);
  }

  useEffect(() => {
    if (!window.name) return;

    const onPopState = () => {
      if (sessionStorage.getItem("navigation:SPAreplace")) return;
      sendRequestSync(connectedFrameName);
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [connectedFrameName]);

  useEffect(() => {
    if (!window.name) return;
    if (sessionStorage.getItem("navigation:SPAreplace")) return;
    sendRequestSync(connectedFrameName);
  }, [pathname, connectedFrameName]);

  useEffect(() => {
    if (!window.name) return;
    const parentWindow = window.parent;

    const sendChildReady = () => {
      const readyPayload = { type: "child:ready", frameName: window.name };
      if (POST_MESSAGE_LOG_ENABLED) {
        console.log(
          `[PostMessage Send] from "${window.name}" to "Parent" | type: child:ready | content:`,
          readyPayload,
        );
      }
      parentWindow?.postMessage(readyPayload, "*");
    };

    sendChildReady();
  }, [pathname]);

  return (
    <div>
      {shouldDisplayInfo ? (
        <FramePropertiesDisplay properties={frameProperties} />
      ) : null}
      {elementListForFrame.map((element) => {
        if (!isComponentName(element.componentName)) return null;

        const entry = componentRegistry[element.componentName];
        const RegistryComponent = entry.component as ComponentType<
          Record<string, unknown>
        >;

        const baseProps =
          "neededProps" in entry && entry.neededProps
            ? (entry.neededProps as Record<string, unknown>)
            : {};
        const instanceProps = (element.customProps ?? {}) as Record<
          string,
          unknown
        >;
        const extraProps = element.isFrameOrContainer
          ? ({ savedName: element.id } as Record<string, unknown>)
          : {};

        const mergedProps: Record<string, unknown> = {
          ...baseProps,
          ...instanceProps,
          ...extraProps,
        };

        return (
          <ElementController
            key={element.id}
            elementToControl={element}
            controlsDisabled={disableElementControlsForChildren}
            shouldShowName={element.isFrameOrContainer}
            containerRef={containerRefForFrame}
            connectedFrameOrContainerName={connectedFrameName}
          >
            <CollapseWrapper>
              <RegistryComponent {...mergedProps} />
            </CollapseWrapper>
          </ElementController>
        );
      })}
    </div>
  );
}
