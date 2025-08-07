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
  customProps: Record<string, any>;
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
    isFrameOrContainer: boolean,
    customProps?: Record<string, any>
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

function getPageDataFromUrl(fullUrl: string, pageName: string): {
  frames: string | null;
  elements: string | null;
} {
  const search = fullUrl.split("?")[1]?.split("#")[0] || "";
  const params = new URLSearchParams(search);
  return {
    frames: params.get(`frames.${pageName}`),
    elements: params.get(`elements.${pageName}`),
  };
}


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

  const currentPage = window.location.pathname.slice(1) || "HomePage";
  const currentUrl = window.location.href;

  const lastSavedUrl = sessionStorage.getItem("lastSavedUrl");
  const landedUrl = sessionStorage.getItem("landedUrl");
  const savedSessionRaw = sessionStorage.getItem("savedPageParams") || "";
  let sessionParams = new URLSearchParams(savedSessionRaw);
  const urlParams = new URLSearchParams(window.location.search);

  const isSharedUrl = currentUrl !== lastSavedUrl && currentUrl !== landedUrl;

  // Shared URL handling — replace session storage entirely
  if (isSharedUrl) {
    const newSession = new URLSearchParams();
    for (const key of urlParams.keys()) {
      if (key.startsWith("frames.") || key.startsWith("elements.")) {
        const value = urlParams.get(key);
        if (value !== null) newSession.set(key, value);
      }
    }
    sessionParams = newSession;
    sessionStorage.setItem("savedPageParams", newSession.toString());
    sessionStorage.setItem("landedUrl", currentUrl);
  }



  const shouldPreferSavedParams =
    currentUrl === lastSavedUrl 

  let framesParam: string | null;
  let elementsParam: string | null;

  if (shouldPreferSavedParams) {
    framesParam = sessionParams.get(`frames.${currentPage}`);
    elementsParam = sessionParams.get(`elements.${currentPage}`);

    // Replace full URL with session version
    const fullUrl = `${window.location.origin}${window.location.pathname}?${sessionParams.toString()}${window.location.hash}`;
    window.history.replaceState(null, "", fullUrl);
  } else {
    framesParam = urlParams.get(`frames.${currentPage}`) || sessionParams.get(`frames.${currentPage}`);
    elementsParam = urlParams.get(`elements.${currentPage}`) || sessionParams.get(`elements.${currentPage}`);

    if (framesParam && elementsParam) {
      sessionParams.set(`frames.${currentPage}`, framesParam);
      sessionParams.set(`elements.${currentPage}`, elementsParam);
      sessionStorage.setItem("savedPageParams", sessionParams.toString());
    }
  }

  if (!framesParam || !elementsParam) return;

  const parsedFrames = framesParam.split(",");
  const parsedMap: Record<string, FrameElement[]> = {};

  for (const entry of elementsParam.split(";")) {
    const [frame, list] = entry.split(":");
    if (!frame) continue;

    const elementsList: FrameElement[] = [];

    for (const serializedItem of (list || "").split("|")) {
      if (!serializedItem) continue;
      const parts = serializedItem.split(",");
      if (parts.length < 6) continue;

      const [id, componentName, xString, yString, isFrameStr, propsStr] = parts;
      const xPercent = Number(xString) / 100;
      const yPercent = Number(yString) / 100;
      const isFrameOrContainer = isFrameStr === "true";
      let customProps: Record<string, any> = {};
      try {
        customProps = propsStr ? JSON.parse(decodeURIComponent(propsStr)) : {};
      } catch {}

      elementsList.push({
        id,
        componentName,
        xPercent,
        yPercent,
        isFrameOrContainer,
        customProps,
      });
    }

    parsedMap[frame] = elementsList;
  }

  setFrameList(parsedFrames);
  setFrameElementsMap(parsedMap);
  if (parsedFrames.length) setCurrentFrame(parsedFrames[0]);
}, []);























  // save frames and elements to URL parameters
useEffect(() => {
  if (window.top !== window) return;

  const currentPage = window.location.pathname.slice(1) || "HomePage";
  const serializedFrameNames = frameList.join(",");

  const frameEntries = frameList.map((frameName) => {
    const elementEntries = (frameElementsMap[frameName] || []).map((element) => {
      const roundedX = Math.round(element.xPercent * 100);
      const roundedY = Math.round(element.yPercent * 100);
      const encodedProps = encodeURIComponent(JSON.stringify(element.customProps || {}));
      return [
        element.id,
        element.componentName,
        roundedX,
        roundedY,
        element.isFrameOrContainer,
        encodedProps,
      ].join(",");
    });
    return `${frameName}:${elementEntries.join("|")}`;
  });

  const serializedFrameElements = frameEntries.join(";");

  const currentParams = new URLSearchParams(window.location.search);
  const savedRaw = sessionStorage.getItem("savedPageParams");
  const sessionParams = new URLSearchParams(savedRaw || "");

  for (const [key, value] of currentParams.entries()) {
    sessionParams.set(key, value);
  }

  sessionParams.set(`frames.${currentPage}`, serializedFrameNames);
  sessionParams.set(`elements.${currentPage}`, serializedFrameElements);
  sessionStorage.setItem("savedPageParams", sessionParams.toString());

  const newUrl = `${window.location.origin}${window.location.pathname}?${sessionParams.toString()}${window.location.hash}`;
  window.history.replaceState(null, "", newUrl);
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
    isFrameOrContainer: boolean,
    customProps: Record<string, any> = {}
  ): string {
    const allEles = Object.values(frameElementsMap).flat();
    const matches = allEles.filter(e => e.componentName === componentName);
    const suffixes = matches.map(e => parseInt(e.id.split("-").pop()||"0",10));
    const nextSuffix = suffixes.length ? Math.max(...suffixes)+1 : 1;
    const newId = `${componentName}-${nextSuffix}`;
    const newElement: FrameElement = { id:newId, componentName, xPercent:50, yPercent:50, isFrameOrContainer, customProps};

    

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
