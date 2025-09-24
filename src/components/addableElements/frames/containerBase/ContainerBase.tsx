"use client";

import React, { ReactNode, useEffect, useState, useRef } from "react";
import Collapse from "@mui/material/Collapse";
import { useFrame, POST_MESSAGE_LOG_ENABLED } from "@/components/contexts/FrameManager/FrameManager";
import componentRegistry from "@/components/contexts/FrameManager/componentRegistry";
import ElementController from "../../elementController/ElementController";
import { SAME_ORIGIN_TARGET,getFrameProperties } from "@/components/contexts/FrameManager/framePersistence";
import { usePathname } from "next/navigation";
import { FrameProperties } from "@/components/contexts/FrameManager/frameUtils";
import { FramesByName } from "@/components/contexts/FrameManager/frameMessaging";
import FramePropertiesDisplay from "./framePropertiesDisplay/FramePropertiesDisplay";
import { DEFAULT_FRAME_NAME } from "@/components/contexts/FrameManager/frameUtils";


const LOCAL_SAME_DOMAIN_ORIGIN = 'http://localhost:3000';
const PROD_SAME_DOMAIN_ORIGIN = 'https://build.jonnoel.dev';


interface ContainerBaseProps {
  connectedFrameName: string;
  disableElementControlsForChildren?: boolean;
}

function CollapseWrapper({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => setIsOpen(true), []);
  return <Collapse in={isOpen} timeout={200}>{children}</Collapse>;
}

export default function ContainerBase({
  connectedFrameName,
  disableElementControlsForChildren = false
}: ContainerBaseProps) {
  const { frameElementsByFrameName, containerRefs, replaceFrameElements,registerFrame,receivedFirebaseResponse} = useFrame();
  const elementListForFrame = frameElementsByFrameName[connectedFrameName] || [];
  const fallbackRef = useRef<HTMLDivElement | null>(null);
  const containerRefForFrame = containerRefs[connectedFrameName] ?? fallbackRef;

  

 

  const replaceFrameElementsRef = useRef(replaceFrameElements);
  const pathname = usePathname();
  const [topFrameProperties, setTopFrameProperties] = useState<FrameProperties>();


useEffect(() => {
 
  registerFrame(connectedFrameName)

}, []);




  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.source !== window.top && event.source !== window.top?.opener) return;
      let sourceWindow = "TopFrame";
      if (event.source === window.top?.opener){
        sourceWindow = "Main Window";
      }
      const data = event.data as { type?: string; frames?: FramesByName };
      if (!data || data.type !== "syncFrame" || !data.frames) return;

      if (POST_MESSAGE_LOG_ENABLED) {
        console.log(
          `[PostMessage Receive] at "${window.name}" from "${sourceWindow}" | type: syncFrame | content:`,
          data
        );
      }

      const incoming = data.frames as FramesByName;
      const externalRootName = window.name || "";

      
      
      
      for (const incomingFrameName of Object.keys(incoming)) {
  
        const localFrameName = incomingFrameName === externalRootName ? "TopFrame" : incomingFrameName;
        replaceFrameElementsRef.current(localFrameName, incoming[incomingFrameName].elements as any);
        
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

function sendRequestSync(frameName: string) {
  const targetWindow = window.top?.opener ? window.top.opener : window.top;
  const nameForTop = frameName === "TopFrame" ? window.name : frameName;
  const segments = document.location.pathname.split("/").filter(Boolean);
  const pageName = segments[1] === "frame" ? (segments[3] || "HomePage") : (segments[1] || "HomePage");
  const message = { type: "requestSync", frameName: nameForTop, pageName };

  if (POST_MESSAGE_LOG_ENABLED) {
    console.log(
      `[PostMessage Send] from "${window.name}" to "TopFrame" | type: requestSync | content:`,
      message
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
        readyPayload
      );
    }
    parentWindow?.postMessage(readyPayload, '*');
  };


  sendChildReady();

}, [pathname]);

useEffect(() => {
  if (window !== window.top && !window.opener) return;
  const isLocalSameOrigin = (window.location.origin) === LOCAL_SAME_DOMAIN_ORIGIN || (window.location.origin) === PROD_SAME_DOMAIN_ORIGIN ;
  if (isLocalSameOrigin) return;

  const targetWindow = window.opener;
  const message = { type: "requestPropertiesSync", frameName: window.name };

  if (POST_MESSAGE_LOG_ENABLED) {
    console.log(
      `[PostMessage Send] from "${window.name}" to "TopFrame" | type: requestPropertiesSync | content:`,
      message
    );
  }
  targetWindow?.postMessage(message, SAME_ORIGIN_TARGET);
}, []);

useEffect(() => {
  if (window !== window.top) return;
   const isLocalSameOrigin = (window.location.origin) === LOCAL_SAME_DOMAIN_ORIGIN || (window.location.origin) === PROD_SAME_DOMAIN_ORIGIN ;

  if (isLocalSameOrigin) {
     const frameName = window.opener ? window.name : DEFAULT_FRAME_NAME;
    const props = getFrameProperties(frameName);
    setTopFrameProperties(props);
    return;
  }

  function onMessage(event: MessageEvent) {
    if (event.source !== window.top && event.source !== window.top?.opener) return;
    const data = event.data as { type?: string; properties?: FrameProperties };
    if (!data || data.type !== "syncFrameProperties" || !data.properties) return;

    if (POST_MESSAGE_LOG_ENABLED) {
      const from = event.source === window.top?.opener ? "Main Window" : "TopFrame";
      console.log(
        `[PostMessage Receive] at "${window.name}" from "${from}" | type: syncFrameProperties | content:`,
        data
      );
    }
    setTopFrameProperties(data.properties);

  }

  window.addEventListener("message", onMessage);
  return () => window.removeEventListener("message", onMessage);
}, [receivedFirebaseResponse]);


return (
  <div >
    <FramePropertiesDisplay properties={topFrameProperties}/>
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
          connectedFrameOrContainerName={connectedFrameName}
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
  </div>
);

}
