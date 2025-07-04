"use client";

import React, { createContext, useState, useContext, useRef } from "react";

type FrameElement = {
  component: React.ReactNode;
  xPct: number;
  yPct: number;
};

type FrameContextType = {
  selectedFrame: string;
  setSelectedFrame: (frame: string) => void;
  frames: string[];
  addFrame: (frame: string) => void;
  addElementToFrame: (component: React.ReactNode) => void;
  updatePosition: (component: React.ReactNode, x: number, y: number) => void;
  frameElements: { [frame: string]: FrameElement[] };
  frameRefs: { [frame: string]: React.RefObject<HTMLDivElement | null> };
};

const FrameContext = createContext<FrameContextType | undefined>(undefined);

export const FrameProvider = ({ children }: { children: React.ReactNode }) => {
  const [frames, setFrames] = useState<string[]>(["TopFrame"]);
  const [selectedFrame, setSelectedFrame] = useState("TopFrame");
  const [frameElements, setFrameElements] = useState<{ [frame: string]: FrameElement[] }>({});

  // build refs for every frame
  const frameRefs: { [frame: string]: React.RefObject<HTMLDivElement | null> } = {};
  frames.forEach((frame) => {
    if (!frameRefs[frame]) {
      frameRefs[frame] = useRef<HTMLDivElement | null>(null);
    }
  });

  const addFrame = (frame: string) => {
    setFrames((prev) => (prev.includes(frame) ? prev : [...prev, frame]));
  };

  const addElementToFrame = (component: React.ReactNode) => {
    const frameRef = frameRefs[selectedFrame];
    let xPct = 50, yPct = 50;

    if (frameRef?.current) {
      const { width, height } = frameRef.current.getBoundingClientRect();
      xPct = (width / 2 / width) * 100;  
      yPct = (height / 2 / height) * 100; 
    }

    setFrameElements((prev) => {
      const updated = { ...prev };
      if (!updated[selectedFrame]) updated[selectedFrame] = [];

      const exists = updated[selectedFrame].some((el) => el.component === component);
      if (!exists) {
        updated[selectedFrame] = [
          ...updated[selectedFrame],
          { component, xPct, yPct },
        ];
      }
      return updated;
    });
  };

  const updatePosition = (component: React.ReactNode, x: number, y: number) => {
    setFrameElements((prev) => {
      const updated = { ...prev };
      if (!updated[selectedFrame] || !frameRefs[selectedFrame]?.current) return prev;

      const { width, height } = frameRefs[selectedFrame]!.current!.getBoundingClientRect();
      updated[selectedFrame] = updated[selectedFrame].map((el) =>
        el.component === component
          ? { 
              ...el, 
              xPct: (x / width) * 100, 
              yPct: (y / height) * 100 
            }
          : el
      );
      return updated;
    });
  };

  return (
    <FrameContext.Provider
      value={{
        selectedFrame,
        setSelectedFrame,
        frames,
        addFrame,
        addElementToFrame,
        updatePosition,
        frameElements,
        frameRefs,
      }}
    >
      {children}
    </FrameContext.Provider>
  );
};

export const useFrame = () => {
  const context = useContext(FrameContext);
  if (!context) throw new Error("useFrame must be used within a FrameProvider");
  return context;
};
