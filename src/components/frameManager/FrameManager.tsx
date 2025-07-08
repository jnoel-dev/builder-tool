"use client";

import React, { createContext, useState, useContext, useRef } from "react";
import ElementController from "../addableElements/elementController/ElementController";

type FrameElement = {
  id: string;
  component: React.ReactNode;
  xPercent: number;
  yPercent: number;
};

type FrameContextType = {
  selectedFrameName: string;
  setSelectedFrameName: (frameName: string) => void;
  frameNames: string[];
  addFrame: (frameName: string) => void;
  addElementToFrame: (elementComponent: React.ReactNode) => string;
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
  const nextElementIdCounterRef = useRef(0);

  const frameContainerRefs: { [frameName: string]: React.RefObject<HTMLDivElement | null> } = {};
  frameNames.forEach(function(frameName) {
    if (!frameContainerRefs[frameName]) {
      frameContainerRefs[frameName] = useRef<HTMLDivElement | null>(null);
    }
  });

  function addFrame(frameName: string) {
    setFrameNames(function(previousFrameNames) {
      if (previousFrameNames.includes(frameName)) {
        return previousFrameNames;
      }
      return previousFrameNames.concat(frameName);
    });
  }

  function addElementToFrame(elementComponent: React.ReactNode): string {
    const ElementWrapperController: any = ElementController;
    let newlyCreatedElementId: string | undefined;

    function updateFrameElements(previousFrameElements: { [frameName: string]: FrameElement[] }) {
      const updatedFrameElements = { ...previousFrameElements };
      const currentFrameElementList = updatedFrameElements[selectedFrameName] || [];

      const existingElement = currentFrameElementList.find(function(frameElement) {
        const wrappedComponent = frameElement.component as React.ReactElement<any>;
        return wrappedComponent.props.children === elementComponent;
      });

      if (existingElement) {
        newlyCreatedElementId = existingElement.id;
        return previousFrameElements;
      }

      const newElementId = `custom-${nextElementIdCounterRef.current++}`;
      newlyCreatedElementId = newElementId;

      const wrappedElementComponent = (
        <ElementWrapperController elementId={newElementId}>
          {elementComponent}
        </ElementWrapperController>
      );

      const newFrameElement: FrameElement = {
        id: newElementId,
        component: wrappedElementComponent,
        xPercent: 50,
        yPercent: 50,
      };

      updatedFrameElements[selectedFrameName] = currentFrameElementList.concat(newFrameElement);
      return updatedFrameElements;
    }

    setAllFrameElements(updateFrameElements);
    return newlyCreatedElementId!;
  }

  function removeElementFromFrame(elementId: string) {
    function updateFrameElements(previousFrameElements: { [frameName: string]: FrameElement[] }) {
      const updatedFrameElements = { ...previousFrameElements };
      const currentFrameElementList = updatedFrameElements[selectedFrameName] || [];
      updatedFrameElements[selectedFrameName] = currentFrameElementList.filter(function(frameElement) {
        return frameElement.id !== elementId;
      });
      return updatedFrameElements;
    }

    setAllFrameElements(updateFrameElements);
  }

  function updateElementPosition(elementId: string, absoluteX: number, absoluteY: number) {
    const currentFrameRef = frameContainerRefs[selectedFrameName];
    if (!currentFrameRef.current) return;

    const frameBoundingRect = currentFrameRef.current.getBoundingClientRect();
    const relativeX = absoluteX - frameBoundingRect.left;
    const relativeY = absoluteY - frameBoundingRect.top;
    const xPercent = (relativeX / frameBoundingRect.width) * 100;
    const yPercent = (relativeY / frameBoundingRect.height) * 100;

    function updateFrameElements(previousFrameElements: { [frameName: string]: FrameElement[] }) {
      const updatedFrameElements = { ...previousFrameElements };
      const currentFrameElementList = updatedFrameElements[selectedFrameName] || [];

      updatedFrameElements[selectedFrameName] = currentFrameElementList.map(function(frameElement) {
        if (frameElement.id === elementId) {
          return { ...frameElement, xPercent, yPercent };
        }
        return frameElement;
      });

      return updatedFrameElements;
    }

    setAllFrameElements(updateFrameElements);
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
