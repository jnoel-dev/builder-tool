"use client";

import React, {
  createContext,
  useState,
  useContext,
  useRef,
  useEffect,
  ReactNode,
  createRef,
} from "react";

export const POST_MESSAGE_LOG_ENABLED = true;

export interface FrameElement {
  id: string;
  componentName: string;
  xPercent: number;
  yPercent: number;
  isFrameOrContainer: boolean;
}

export interface FrameContextValue {
  currentFrame: string;
  setCurrentFrame: (frameName: string) => void;
  frameList: string[];
  replaceFrameElements: (frameName: string, elements: FrameElement[]) => void;
  registerFrame: (frameName: string) => void;
  unregisterFrame: (frame: FrameElement) => void;
  addElementToCurrentFrame: (
    componentName: string,
    isFrameOrContainer: boolean
  ) => string;
  removeElementFromFrame: (elementId: string, frameName: string) => void;
  updateElementPosition: (
    elementId: string,
    xPercent: number,
    yPercent: number,
    frameName: string
  ) => void;
  frameElementsMap: Record<string, FrameElement[]>;
  containerRefs: Record<string, React.RefObject<HTMLDivElement | null>>;
}

const DEFAULT_FRAME = "TopFrame";
const FrameContext = createContext<FrameContextValue | undefined>(undefined);

export function FrameManager({ children }: { children: ReactNode }) {
  const [frameList, setFrameList] = useState<string[]>([DEFAULT_FRAME]);
  const [currentFrame, setCurrentFrame] = useState<string>(DEFAULT_FRAME);
  const [frameElementsMap, setFrameElementsMap] = useState<
    Record<string, FrameElement[]>
  >({ [DEFAULT_FRAME]: [] });

  const refs = useRef<
    Record<string, React.RefObject<HTMLDivElement | null>>
  >({
    [DEFAULT_FRAME]: createRef<HTMLDivElement | null>(),
  });
  const containerRefs = refs.current;

  // load frames and elements from URL parameters
  useEffect(() => {
    if (window.top !== window) return;
    const params = new URLSearchParams(window.location.search);
    const framesParam = params.get("frames");
    const elementsParam = params.get("elements");
    if (!framesParam || !elementsParam) return;

    const parsedFrames = framesParam.split(",");
    const parsedMap: Record<string, FrameElement[]> = {};
    let maxId = 0;

    for (const entry of elementsParam.split(";")) {
      const [frame, list] = entry.split(":");
      if (!frame) continue;

      const elements: FrameElement[] = [];
      const serializedItems = list ? list.split("|") : [];
      for (const serializedItem of serializedItems) {
        if (!serializedItem) continue;
        const parts = serializedItem.split(",");
        if (parts.length !== 5) continue;
        const [
          id,
          componentName,
          xString,
          yString,
          isFrameOrContainerString,
        ] = parts;
        const xPercent = Number(xString) / 100;
        const yPercent = Number(yString) / 100;
        const isFrameOrContainer = isFrameOrContainerString === "true";

        elements.push({ id, componentName, xPercent, yPercent, isFrameOrContainer });

        const suffix = parseInt(id.split("-").pop() || "0", 10);
        if (!isNaN(suffix) && suffix > maxId) {
          maxId = suffix;
        }
      }

      parsedMap[frame] = elements;
    }

    setFrameList(parsedFrames);
    setFrameElementsMap(parsedMap);
    if (parsedFrames.length) setCurrentFrame(parsedFrames[0]);
  }, []);

  // save frames and elements to URL parameters
  useEffect(() => {
    const serializedFrameNames = frameList.join(',');
    const frameEntries = frameList.map(frameName => {
      const elementEntries = (frameElementsMap[frameName] || []).map(element => {
        const roundedX = Math.round(element.xPercent * 100);
        const roundedY = Math.round(element.yPercent * 100);
        return [element.id, element.componentName, roundedX, roundedY, element.isFrameOrContainer].join(',');
      });
      return `${frameName}:${elementEntries.join('|')}`;
    });
    const serializedFrameElements = frameEntries.join(';');
    const queryParameters = new URLSearchParams({
      frames: serializedFrameNames,
      elements: serializedFrameElements,
    });
    const newUrl = `${window.location.origin}${window.location.pathname}?${queryParameters}`;
    window.history.replaceState(null, '', newUrl);
  }, [frameList, frameElementsMap]);

function handleRemoveMessage(event: MessageEvent) {
  const data = event.data as Record<string, any>;
  if (data?.type !== "removeElement") return;

  const { elementId, frameName, element } = data;
  if (!elementId || !frameName) return;

  if (POST_MESSAGE_LOG_ENABLED) {
    console.log(
      `[PostMessage Receive] removeElement` +
        ` | frameName: ${frameName}` +
        ` | elementId: ${elementId}`
    );
  }

  removeElementFromFrame(elementId, frameName);
  if (element?.isFrameOrContainer) {
    unregisterFrame(element);
  }

 
  if (window.opener && window.top === window) {
    if (POST_MESSAGE_LOG_ENABLED) {
      console.log(
        `[PostMessage Forward] removeElement → opener` +
          ` | from: ${window.name}` +
          ` | to: TopFrame`
      );
    }

    window.opener.postMessage(event.data, "*");
  }
}


  useEffect(() => {
    if (window.top !== window) return;

    window.addEventListener("message", handleRemoveMessage);
    return () => window.removeEventListener("message", handleRemoveMessage);
  }, [frameElementsMap]);

  // listen for updateElementPosition messages and adjust positions
function handlePositionMessage(event: MessageEvent) {
  
  const data = event.data as Record<string, any>;
  if (data?.type !== "updateElementPosition") return;

  const { elementId, frameName, xPercent, yPercent } = data;
  if (!elementId || !frameName) return;

  if (POST_MESSAGE_LOG_ENABLED) {
    console.log(
      `[PostMessage Receive] updateElementPosition` +
        ` | frameName: ${frameName}` +
        ` | elementId: ${elementId}` +
        ` | x: ${xPercent}` +
        ` | y: ${yPercent}`
    );
  }

  updateElementPosition(elementId, xPercent, yPercent, frameName);


  if (window.opener && window.top === window) {
    if (POST_MESSAGE_LOG_ENABLED) {
      console.log(
        `[PostMessage Forward] updateElementPosition → opener` +
          ` | from: ${window.name}` +
          ` | to: TopFrame`
      );
    }

    window.opener.postMessage(event.data, "*");
  }
}


  useEffect(() => {
    if (window.top !== window) return;
    
    window.addEventListener("message", handlePositionMessage);
    return () => window.removeEventListener("message", handlePositionMessage);
  }, []);

  // listen for syncFrame messages to replace the entire elements map
  function handleSyncFrame(event: MessageEvent) {
    const data = event.data as Record<string, any>;
    if (data?.type !== "syncFrame" || data.frameName !== window.name) return;
    if (POST_MESSAGE_LOG_ENABLED) {
      console.log(
        `[PostMessage Receive] syncFrame` +
        ` | frameName: ${data.frameName}`
      );
    }
    setFrameElementsMap(data.elements);
  }

  useEffect(() => {
    const isChild = window.parent !== window || Boolean(window.opener);
    if (!isChild) return;
    window.addEventListener("message", handleSyncFrame);
    // this ensures iframe or popup is fully loaded before sending iframeReady
    const targetWindow = window.opener ?? window.parent;
    targetWindow.postMessage({ type: "iframeReady", frameName: window.name }, "*");
    if (POST_MESSAGE_LOG_ENABLED) {
      console.log(
        `[PostMessage Send] iframeReady` +
        ` | target: ${window.opener ? 'opener' : 'parent'}` +
        ` | source: ${window.name}`
      );
    }
    return () => window.removeEventListener("message", handleSyncFrame);
  }, []);


function handleFrameAdded(event: MessageEvent) {
  const data = event.data as Record<string, any>;
  if (data?.type !== "frameAdded" || !data.frameName) return;

  if (POST_MESSAGE_LOG_ENABLED) {
    console.log(
      `[PostMessage Receive] frameAdded` +
        ` | frameName: ${data.frameName}`
    );
  }

  if (data.frameName !== "TopFrame") {
    registerFrame(data.frameName);
  }


  if (window.opener && window.top === window) {
    if (POST_MESSAGE_LOG_ENABLED) {
      console.log(
        `[PostMessage Forward] frameAdded → opener` +
          ` | from: ${window.name}` +
          ` | to: TopFrame`
      );
    }

    window.opener.postMessage(event.data, "*");
  }
}


  useEffect(() => {
    if (window.top !== window) return;
    window.addEventListener("message", handleFrameAdded);
    return () => window.removeEventListener("message", handleFrameAdded);
  }, []);

  function replaceFrameElements(
    frameName: string,
    elements: FrameElement[]
  ) {
    setFrameElementsMap((prev) => ({ ...prev, [frameName]: elements }));
  }

  // register frame to show in menu 
  function registerFrame(frameName: string) {
    setFrameList(prev =>
      prev.includes(frameName) ? prev : [...prev, frameName]
    );
    setCurrentFrame(frameName);
    if (!refs.current[frameName]) {
      refs.current[frameName] = createRef<HTMLDivElement | null>();
    }
  }

  function unregisterFrame(frame: FrameElement) {
    if (!frame.isFrameOrContainer) return;
    const frameIdsToRemove: string[] = [];
    function gatherDescendantFrameIds(frameId: string) {
      frameIdsToRemove.push(frameId);
      const childElements = frameElementsMap[frameId] || [];
      for (const child of childElements) {
        if (child.isFrameOrContainer) {
          gatherDescendantFrameIds(child.id);
        }
      }
    }
    gatherDescendantFrameIds(frame.id);
    setFrameList(currentList =>
      currentList.filter(name => !frameIdsToRemove.includes(name))
    );
    for (const id of frameIdsToRemove) delete refs.current[id];
    setFrameElementsMap(previousMap => {
      const updatedMap = { ...previousMap };
      for (const id of frameIdsToRemove) delete updatedMap[id];
      return updatedMap;
    });
    setCurrentFrame(DEFAULT_FRAME);
  }

  function addElementToCurrentFrame(
    componentName: string,
    isFrameOrContainer: boolean
  ): string {
    const allEles = Object.values(frameElementsMap).flat();
    const matches = allEles.filter(e => e.componentName === componentName);
    const suffixes = matches.map(e => parseInt(e.id.split("-").pop()||"0",10));
    const nextSuffix = suffixes.length ? Math.max(...suffixes)+1 : 1;
    const newId = `${componentName}-${nextSuffix}`;
    const newElement: FrameElement = { id:newId, componentName, xPercent:50, yPercent:50, isFrameOrContainer };
    setFrameElementsMap(prev => {
      const curr = prev[currentFrame]||[];
      return { ...prev, [currentFrame]:[...curr,newElement] };
    });
    return newId;
  }

  function removeElementFromFrame(elementId: string, frameName: string) {
    setFrameElementsMap(prev => {
      const updated = (prev[frameName]||[]).filter(e=>e.id!==elementId);
      return {...prev, [frameName]: updated};
    });
  }

  function updateElementPosition(
    elementId: string,
    newXPercent: number,
    newYPercent: number,
    frameName: string
  ) {
    setFrameElementsMap(prev => {
      const updated = (prev[frameName]||[]).map(e=> e.id!==elementId?e:{...e,xPercent:newXPercent,yPercent:newYPercent});
      return {...prev,[frameName]:updated};
    });
  }

  return (
    <FrameContext.Provider
      value={{
        currentFrame,
        setCurrentFrame,
        frameList,
        replaceFrameElements,
        registerFrame,
        unregisterFrame,
        addElementToCurrentFrame,
        removeElementFromFrame,
        updateElementPosition,
        frameElementsMap,
        containerRefs,
      }}
    >
      {children}
    </FrameContext.Provider>
  );
}

export function useFrame() {
  const context = useContext(FrameContext);
  if (!context) throw new Error("useFrame must be used within FrameManager");
  return context;
}
