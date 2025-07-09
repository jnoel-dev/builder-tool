'use client';

import { ReactNode, useRef, useEffect, useState } from "react";
import { useFrame } from "@/components/frameManager/FrameManager";

interface ElementControllerProps {
  elementId: string;
  xPercent: number;
  yPercent: number;
  children: ReactNode;
}

export default function ElementController({
  elementId,
  xPercent,
  yPercent,
  children,
}: ElementControllerProps) {
  const {
    updateElementPosition,
    removeElementFromFrame,
    frameContainerRefs,
    selectedFrameName,
  } = useFrame();

  const isDraggingRef = useRef(false);
  const dragOffsetPercentRef = useRef({ xOffsetPercent: 0, yOffsetPercent: 0 });

  // ✅ Add local position state for smooth dragging
  const [elementPositionPercent, setElementPositionPercent] = useState({
    xPercent,
    yPercent,
  });

  // ✅ Sync props to local state if they change externally
  useEffect(() => {
    setElementPositionPercent({ xPercent, yPercent });
  }, [xPercent, yPercent]);

  function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  function handleMouseDown(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();

    const currentFrameContainer = frameContainerRefs[selectedFrameName]?.current;
    if (!currentFrameContainer) return;

    const frameBoundingRect = currentFrameContainer.getBoundingClientRect();
    const clickXPercent = ((event.clientX - frameBoundingRect.left) / frameBoundingRect.width) * 100;
    const clickYPercent = ((event.clientY - frameBoundingRect.top) / frameBoundingRect.height) * 100;

    dragOffsetPercentRef.current = {
      xOffsetPercent: clickXPercent - elementPositionPercent.xPercent,
      yOffsetPercent: clickYPercent - elementPositionPercent.yPercent,
    };

    isDraggingRef.current = true;
  }

  function handleMouseMove(event: MouseEvent) {
    if (!isDraggingRef.current) return;

    const currentFrameContainer = frameContainerRefs[selectedFrameName]?.current;
    if (!currentFrameContainer) return;

    const frameBoundingRect = currentFrameContainer.getBoundingClientRect();

    const elementNode = document.getElementById(elementId);
    if (!elementNode) return;

    const elementBoundingRect = elementNode.getBoundingClientRect();

    const elementWidthPercent = (elementBoundingRect.width / frameBoundingRect.width) * 100;
    const elementHeightPercent = (elementBoundingRect.height / frameBoundingRect.height) * 100;

    const cursorXPercent = ((event.clientX - frameBoundingRect.left) / frameBoundingRect.width) * 100;
    const cursorYPercent = ((event.clientY - frameBoundingRect.top) / frameBoundingRect.height) * 100;

    const unclampedXPercent = cursorXPercent - dragOffsetPercentRef.current.xOffsetPercent;
    const unclampedYPercent = cursorYPercent - dragOffsetPercentRef.current.yOffsetPercent;

    const minXPercent = elementWidthPercent / 2;
    const maxXPercent = 100 - (elementWidthPercent / 2);

    const minYPercent = elementHeightPercent / 2;
    const maxYPercent = 100 - (elementHeightPercent / 2);

    const clampedXPercent = clamp(unclampedXPercent, minXPercent, maxXPercent);
    const clampedYPercent = clamp(unclampedYPercent, minYPercent, maxYPercent);

    // ✅ Update local state only
    setElementPositionPercent({
      xPercent: clampedXPercent,
      yPercent: clampedYPercent,
    });
  }

  function handleMouseUp() {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    // ✅ Commit final position to global FrameManager
    updateElementPosition(
      elementId,
      elementPositionPercent.xPercent,
      elementPositionPercent.yPercent
    );
  }

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [elementPositionPercent]);

  function handleRemoveElement() {
    removeElementFromFrame(elementId);
  }

  return (
    <div
      id={elementId}
      style={{
        position: "absolute",
        left: `${elementPositionPercent.xPercent}%`,
        top: `${elementPositionPercent.yPercent}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <button
        type="button"
        onMouseDown={handleMouseDown}
        className="p-1 bg-gray-200 rounded"
      >
        Drag
      </button>
      <button
        type="button"
        onClick={handleRemoveElement}
        className="p-1 bg-gray-200 rounded ml-2"
      >
        Remove
      </button>
      {children}
    </div>
  );
}
