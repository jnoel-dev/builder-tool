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

export const POST_MESSAGE_LOG_ENABLED = false;

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

      const [id, componentName, xString, yString, isFrameOrContainerString] = parts;
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
        ` | source: ${(event.source as Window)?.name || DEFAULT_FRAME}` +
        ` | targetFrame: ${frameName}` +
        ` | elementId: ${elementId}`
      );
    }
    removeElementFromFrame(elementId, frameName);
    if (element?.isFrameOrContainer) unregisterFrame(element);
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
        ` | source: ${(event.source as Window)?.name || DEFAULT_FRAME}` +
        ` | frame: ${frameName}` +
        ` | elementId: ${elementId}` +
        ` | x: ${xPercent}` +
        ` | y: ${yPercent}`
      );
    }
    updateElementPosition(elementId, xPercent, yPercent, frameName);
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
        ` | source: ${(event.source as Window)?.name || DEFAULT_FRAME}` +
        ` | frameName: ${data.frameName}` +
        ` | elements:`, data.elements
      );
    }
    setFrameElementsMap(data.elements);
  }

  useEffect(() => {
    if (window.top === window) return;
    window.addEventListener("message", handleSyncFrame);
	// this ensures iframe is fully loaded before sending any post messages from other frames...
    window.parent?.postMessage({ type: "iframeReady", frameName: window.name }, "*");
    if (POST_MESSAGE_LOG_ENABLED) {
      console.log(
        `[PostMessage Send] iframeReady` +
        ` | target: parent` +
        ` | source: ${window.name}`
      );
    }
    return () => window.removeEventListener("message", handleSyncFrame);
  }, []);

  // listen for frameAdded messages to register new frames
  function handleFrameAdded(event: MessageEvent) {
	if (window !== window.top) return;
    const data = event.data as Record<string, any>;
    if (data?.type !== "frameAdded" || !data.frameName) return;
    if (POST_MESSAGE_LOG_ENABLED) {
      console.log(
        `[PostMessage Receive] frameAdded` +
        ` | source: ${(event.source as Window)?.name || DEFAULT_FRAME}` +
        ` | newFrame: ${data.frameName}`
      );
    }
    registerFrame(data.frameName);
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
 

  setCurrentFrame((curr) => {
    return frameName;
  });

  if (!refs.current[frameName]) {
    refs.current[frameName] = createRef<HTMLDivElement | null>();
  }
}


function unregisterFrame(frame: FrameElement) {
  if (!frame.isFrameOrContainer) {
    return;
  }

  const frameIdsToRemove: string[] = [];

  // recursive search to ensure all frames are found, this ensures frames in frames are removed from frame list
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

  for (const id of frameIdsToRemove) {
    delete refs.current[id];
  }

  setFrameElementsMap(previousMap => {
    const updatedMap = { ...previousMap };
    for (const id of frameIdsToRemove) {
      delete updatedMap[id];
    }
    return updatedMap;
  });

  setCurrentFrame(DEFAULT_FRAME);
}

function addElementToCurrentFrame(
  componentName: string,
  isFrameOrContainer: boolean
): string {
  const allElements = Object.values(frameElementsMap).flat();
  const matchingElements = allElements.filter(
    element => element.componentName === componentName
  );

  const existingSuffixes = matchingElements.map(element => {
    const parts = element.id.split('-');
    const suffix = parts[parts.length - 1];
    const suffixNumber = parseInt(suffix, 10);
    return Number.isNaN(suffixNumber) ? 0 : suffixNumber;
  });

  const nextSuffix = existingSuffixes.length
    ? Math.max(...existingSuffixes) + 1
    : 1;

  const newElementId = `${componentName}-${nextSuffix}`;
  const newElement: FrameElement = {
    id: newElementId,
    componentName,
    xPercent: 50,
    yPercent: 50,
    isFrameOrContainer,
  };

  setFrameElementsMap(previousMap => {
    const currentElements = previousMap[currentFrame] || [];
    return {
      ...previousMap,
      [currentFrame]: [...currentElements, newElement],
    };
  });

  return newElementId;
}

function removeElementFromFrame(elementId: string, frameName: string) {
  setFrameElementsMap(previousMap => {
    const updatedElements = (previousMap[frameName] || []).filter(
      element => element.id !== elementId
    );
    return {
      ...previousMap,
      [frameName]: updatedElements,
    };
  });
}


function updateElementPosition(
  elementId: string,
  newXPercent: number,
  newYPercent: number,
  frameName: string
) {
  setFrameElementsMap(previousMap => {
    const currentElements = previousMap[frameName] || [];
    const updatedElements = currentElements.map(element => {
      if (element.id !== elementId) {
        return element;
      }
      return {
        ...element,
        xPercent: newXPercent,
        yPercent: newYPercent,
      };
    });

    return {
      ...previousMap,
      [frameName]: updatedElements,
    };
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
