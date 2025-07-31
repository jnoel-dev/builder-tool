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
    const framesQuery = frameList.join(",");
    const entries = frameList.map((frame) => {
      const items = (frameElementsMap[frame] || []).map((el) => {
        const xInt = Math.round(el.xPercent * 100);
        const yInt = Math.round(el.yPercent * 100);
        return [el.id, el.componentName, xInt, yInt, el.isFrameOrContainer].join(",");
      });
      return `${frame}:${items.join("|")}`;
    });
    const elementsQuery = entries.join(";");
    const params = new URLSearchParams({ frames: framesQuery, elements: elementsQuery });
    const url = `${window.location.origin}${window.location.pathname}?${params}`;
    window.history.replaceState(null, "", url);
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
    if (!frame.isFrameOrContainer) return;
    const idsToRemove: string[] = [];

	// recursive search to ensure all frames are found, this ensures frames in frames are removed from frame list
    function collect(id: string) {
      idsToRemove.push(id);
      (frameElementsMap[id] || [])
        .filter((el) => el.isFrameOrContainer)
        .forEach((el) => collect(el.id));
    }
    collect(frame.id);

    setFrameList((names) => names.filter((n) => !idsToRemove.includes(n)));
    idsToRemove.forEach((id) => delete refs.current[id]);
    setFrameElementsMap((prev) => {
      const copy = { ...prev };
      idsToRemove.forEach((id) => delete copy[id]);
      return copy;
    });
    setCurrentFrame(DEFAULT_FRAME);
  }

  function addElementToCurrentFrame(
    componentName: string,
    isFrameOrContainer: boolean
  ): string {
    const allElements = Object.values(frameElementsMap).flat();
    const suffixes = allElements
      .filter((el) => el.componentName === componentName)
      .map((el) => parseInt(el.id.split("-").pop() || "0", 10))
      .filter((n) => !isNaN(n));

    const nextIndex = suffixes.length ? Math.max(...suffixes) + 1 : 1;
    const newId = `${componentName}-${nextIndex}`;
    const newElement: FrameElement = {
      id: newId,
      componentName,
      xPercent: 50,
      yPercent: 50,
      isFrameOrContainer,
    };

    setFrameElementsMap((prev) => ({
      ...prev,
      [currentFrame]: [...(prev[currentFrame] || []), newElement],
    }));
    return newId;
  }

  function removeElementFromFrame(elementId: string, frameName: string) {
    setFrameElementsMap((prev) => ({
      ...prev,
      [frameName]: (prev[frameName] || []).filter((el) => el.id !== elementId),
    }));
  }

  function updateElementPosition(
    elementId: string,
    xPercent: number,
    yPercent: number,
    frameName: string
  ) {
    setFrameElementsMap((prev) => ({
      ...prev,
      [frameName]: (prev[frameName] || []).map((el) =>
        el.id === elementId ? { ...el, xPercent, yPercent } : el
      ),
    }));
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
