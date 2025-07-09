"use client";

import React, { createContext, useState, useContext, useRef, useEffect } from "react";
import ElementController from "../addableElements/elementController/ElementController";
import LZString from "lz-string";
import componentRegistry from "./componentRegistry";

type FrameElement = {
  id: string;
  componentName: string;
  xPercent: number;
  yPercent: number;
};

type FrameContextType = {
  selectedFrameName: string;
  setSelectedFrameName: (frameName: string) => void;
  frameNames: string[];
  addFrame: (frameName: string) => void;
  addElementToFrame: (componentName: string) => string;
  removeElementFromFrame: (elementId: string) => void;
  updateElementPosition: (elementId: string, absoluteX: number, absoluteY: number) => void;
  allFrameElements: { [frameName: string]: FrameElement[] };
  frameContainerRefs: { [frameName: string]: React.RefObject<HTMLDivElement | null> };
};

const FrameContext = createContext<FrameContextType | undefined>(undefined);

export function FrameProvider({ children }: { children: React.ReactNode }) {
  const [frameNames, setFrameNames] = useState<string[]>(["TopFrame"]);
  const [selectedFrameName, setSelectedFrameName] = useState<string>("TopFrame");
  const [allFrameElements, setAllFrameElements] = useState<{ [frameName: string]: FrameElement[] }>({});
  const [nextElementIdCounter, setNextElementIdCounter] = useState(0);

  const frameContainerRefs: { [frameName: string]: React.RefObject<HTMLDivElement | null> } = {};
  frameNames.forEach(frameName => {
    if (!frameContainerRefs[frameName]) {
      frameContainerRefs[frameName] = useRef<HTMLDivElement | null>(null);
    }
  });

useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const compressed = urlParams.get("data");

  if (compressed) {
    try {
      const jsonString = LZString.decompressFromEncodedURIComponent(compressed);
      if (!jsonString) return;

      const saveData = JSON.parse(jsonString);

      if (saveData.frameNames && saveData.allFrameElements) {
        setFrameNames(saveData.frameNames);

        const rebuiltElements: { [frameName: string]: FrameElement[] } = {};
        let maxIdNumber = 0;

        for (const frameName of saveData.frameNames) {
          const elements = saveData.allFrameElements[frameName] || [];
          rebuiltElements[frameName] = elements.map((element: any) => {
            const [componentName, numericPart] = element.id.split("-");
            const num = parseInt(numericPart, 10);
            if (!isNaN(num) && num > maxIdNumber) {
              maxIdNumber = num;
            }

            return {
              id: element.id,
              componentName,
              xPercent: element.xPercent,
              yPercent: element.yPercent,
            };
          });
        }

        setAllFrameElements(rebuiltElements);
        setNextElementIdCounter(maxIdNumber);
      }
    } catch (error) {
      console.error("Failed to load data from URL:", error);
    }
  }
}, []);


useEffect(() => {
  const onlyDefaultFrame = frameNames.length === 1 && frameNames[0] === "TopFrame";
  const hasNoElements = !allFrameElements["TopFrame"] || allFrameElements["TopFrame"].length === 0;

  if (onlyDefaultFrame && hasNoElements) {
    // ✅ Remove data param from URL if site is back to default state
    const cleanUrl = `${window.location.origin}${window.location.pathname}`;
    window.history.replaceState(null, "", cleanUrl);
    return;
  }

  function buildSaveDataObject() {
    const saveObject: {
      frameNames: string[];
      allFrameElements: { [frameName: string]: { id: string; xPercent: number; yPercent: number }[] };
    } = {
      frameNames: frameNames,
      allFrameElements: {},
    };

    for (const frameName of frameNames) {
      const elements = allFrameElements[frameName] || [];
      saveObject.allFrameElements[frameName] = elements.map(element => ({
        id: element.id,
        xPercent: element.xPercent,
        yPercent: element.yPercent,
      }));
    }

    return saveObject;
  }

  const saveData = buildSaveDataObject();
  const jsonString = JSON.stringify(saveData);
  const compressed = LZString.compressToEncodedURIComponent(jsonString);

  const newUrl = `${window.location.origin}${window.location.pathname}?data=${compressed}`;
  window.history.replaceState(null, "", newUrl);

}, [frameNames, allFrameElements]);


  function addFrame(frameName: string) {
    setFrameNames(previousFrameNames =>
      previousFrameNames.includes(frameName)
        ? previousFrameNames
        : previousFrameNames.concat(frameName)
    );
  }

function addElementToFrame(componentName: string): string {
  const newElementId = `${componentName}-${nextElementIdCounter + 1}`;

  setNextElementIdCounter(prev => prev + 1);

  setAllFrameElements(previousFrameElements => {
    const updatedFrameElements = { ...previousFrameElements };
    const currentFrameElementList = updatedFrameElements[selectedFrameName] || [];

    const newFrameElement: FrameElement = {
      id: newElementId,
      componentName,
      xPercent: 50,
      yPercent: 50,
    };

    updatedFrameElements[selectedFrameName] = currentFrameElementList.concat(newFrameElement);
    return updatedFrameElements;
  });

  return newElementId;
}


  function removeElementFromFrame(elementId: string) {
    setAllFrameElements(previousFrameElements => {
      const updatedFrameElements = { ...previousFrameElements };
      const currentFrameElementList = updatedFrameElements[selectedFrameName] || [];

      updatedFrameElements[selectedFrameName] = currentFrameElementList.filter(frameElement => frameElement.id !== elementId);

      return updatedFrameElements;
    });
  }
function updateElementPosition(
  elementId: string,
  xPercent: number,
  yPercent: number
) {
  setAllFrameElements((previousFrameElements: { [frameName: string]: FrameElement[] }) => {
    const updatedFrameElements = { ...previousFrameElements };
    const currentFrameElementList = updatedFrameElements[selectedFrameName] || [];

    updatedFrameElements[selectedFrameName] = currentFrameElementList.map((frameElement: FrameElement) => {
      if (frameElement.id === elementId) {
        return { ...frameElement, xPercent, yPercent };
      }
      return frameElement;
    });

    return updatedFrameElements;
  });
}




  return (
    <FrameContext.Provider
      value={{
        selectedFrameName,
        setSelectedFrameName,
        frameNames,
        addFrame,
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
  const frameContextValue = useContext(FrameContext);
  if (!frameContextValue) {
    throw new Error("useFrame must be used within a FrameProvider");
  }
  return frameContextValue;
}
