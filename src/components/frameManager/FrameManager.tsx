// src/components/frameManager/FrameManager.tsx
'use client';

import React, {
  createContext,
  useState,
  useContext,
  useRef,
  useEffect,
  useMemo,
} from "react";
import LZString from "lz-string";

export type FrameElement = {
  id: string;
  componentName: string;
  xPercent: number;
  yPercent: number;
};

export type FrameContextType = {
  selectedFrameName: string;
  setSelectedFrameName: (frameName: string) => void;
  frameNames: string[];
  addFrame: (frameName: string) => void;
  removeFrame: (frameName: string) => void;
  addElementToFrame: (componentName: string) => string;
  removeElementFromFrame: (elementId: string) => void;
  updateElementPosition: (
    elementId: string,
    xPercent: number,
    yPercent: number
  ) => void;
  allFrameElements: { [frameName: string]: FrameElement[] };
  frameContainerRefs: {
    [frameName: string]: React.RefObject<HTMLDivElement | null>;
  };
};

const FrameContext = createContext<FrameContextType | undefined>(undefined);

export function FrameManager({ children }: { children: React.ReactNode }) {
  const [frameNames, setFrameNames] = useState<string[]>([]);
  const [selectedFrameName, setSelectedFrameName] = useState<string>("");
  const [allFrameElements, setAllFrameElements] = useState<{
    [frameName: string]: FrameElement[];
  }>({});
  const [nextElementId, setNextElementId] = useState(0);

  const frameContainerRefs = useMemo(() => {
    const refs: {
      [key: string]: React.RefObject<HTMLDivElement | null>;
    } = {};
    for (const name of frameNames) {
      refs[name] = refs[name] ?? React.createRef<HTMLDivElement>();
    }
    return refs;
  }, [frameNames]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const compressed = params.get("data");
    if (!compressed) return;

    try {
      const json = LZString.decompressFromEncodedURIComponent(compressed);
      if (!json) return;
      const save = JSON.parse(json);
      if (save.frameNames && save.allFrameElements) {
        setFrameNames(save.frameNames);
        setAllFrameElements(save.allFrameElements);

        let maxId = 0;
        for (const arr of Object.values(save.allFrameElements)) {
          for (const el of arr as any[]) {
            const parts = el.id.split("-");
            const num = parseInt(parts[parts.length - 1], 10);
            if (!isNaN(num) && num > maxId) maxId = num;
          }
        }
        setNextElementId(maxId);

        if (save.frameNames.length > 0) {
          setSelectedFrameName(save.frameNames[0]);
        }
      }
    } catch {
    
    }
  }, []); 


  useEffect(() => {
    if (frameNames.length === 0) {

      window.history.replaceState(
        null,
        "",
        window.location.origin + window.location.pathname
      );
      return;
    }
    const payload = JSON.stringify({
      frameNames,
      allFrameElements,
    });
    const compressed = LZString.compressToEncodedURIComponent(payload);
    window.history.replaceState(
      null,
      "",
      `${window.location.origin}${window.location.pathname}?data=${compressed}`
    );
  }, [frameNames, allFrameElements]); 

  function addFrame(frameName: string) {
    console.log("adding frame: ",frameName)
    setFrameNames((prev) =>
      prev.includes(frameName) ? prev : [...prev, frameName]
    );
    
    setSelectedFrameName((prev) => (prev === "" ? frameName : prev));
  }
  function removeFrame(frameName: string) {
  setFrameNames(prev => prev.filter(name => name !== frameName));
  setAllFrameElements(prev => {
    const clone = { ...prev };
    delete clone[frameName];
    return clone;
  });
 
}

  function addElementToFrame(componentName: string) {
    const newId = `${componentName}-${nextElementId + 1}`;
    setNextElementId((n) => n + 1);

    setAllFrameElements((prev) => {
      const clone = { ...prev };
      const list = clone[selectedFrameName] || [];
      clone[selectedFrameName] = [
        ...list,
        { id: newId, componentName, xPercent: 50, yPercent: 50 },
      ];
      return clone;
    });

    return newId;
  }

  function removeElementFromFrame(elementId: string) {
    setAllFrameElements((prev) => {
      const clone = { ...prev };
      clone[selectedFrameName] = (clone[selectedFrameName] || []).filter(
        (e) => e.id !== elementId
      );
      return clone;
    });
  }

  function updateElementPosition(
    elementId: string,
    xPercent: number,
    yPercent: number
  ) {
    setAllFrameElements((prev) => {
      const clone = { ...prev };
      clone[selectedFrameName] = (clone[selectedFrameName] || []).map((e) =>
        e.id === elementId ? { ...e, xPercent, yPercent } : e
      );
      return clone;
    });
  }

  return (
    <FrameContext.Provider
      value={{
        selectedFrameName,
        setSelectedFrameName,
        frameNames,
        addFrame,
        removeFrame,
        addElementToFrame,
        removeElementFromFrame,
        updateElementPosition,
        allFrameElements,
        frameContainerRefs,
      }}
    >
      {children}
    </FrameContext.Provider>
  );
}

export function useFrame() {
  const ctx = useContext(FrameContext);
  if (!ctx) throw new Error("useFrame must be used within FrameManager");
  return ctx;
}
