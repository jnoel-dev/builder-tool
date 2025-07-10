'use client';

import { ReactNode, useRef, useEffect, useState } from "react";
import { useFrame } from "@/components/frameManager/FrameManager";
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import CloseIcon from '@mui/icons-material/Close';

interface ElementControllerProps {
  elementId: string;
  xPercent: number;
  yPercent: number;
  showName: boolean;
  connectedFrameOrContainerName:string;
  children: ReactNode;
}

export default function ElementController({
  elementId,
  xPercent,
  yPercent,
  showName,
  connectedFrameOrContainerName,
  children,
}: ElementControllerProps) {
  const {
    updateElementPosition,
    removeElementFromFrame,
    frameContainerRefs,
  } = useFrame();

  const isDraggingRef = useRef(false);
  const dragOffsetPercentRef = useRef({ xOffsetPercent: 0, yOffsetPercent: 0 });

  const [elementPositionPercent, setElementPositionPercent] = useState({
    xPercent,
    yPercent,
  });

  useEffect(() => {
    setElementPositionPercent({ xPercent, yPercent });
  }, [xPercent, yPercent]);

  function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  function handleMouseDown(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();

    const currentFrameContainer = frameContainerRefs[connectedFrameOrContainerName]?.current;
    console.log(frameContainerRefs)
    console.log(elementId)
    console.log(currentFrameContainer)
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

    const currentFrameContainer = frameContainerRefs[connectedFrameOrContainerName]?.current;
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

    setElementPositionPercent({
      xPercent: clampedXPercent,
      yPercent: clampedYPercent,
    });
  }

  function handleMouseUp() {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

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
      <Stack direction="row-reverse">
        <IconButton
          size="small"
          onClick={handleRemoveElement}
          sx={{ padding: 0 }}
        >
          <CloseIcon />
        </IconButton>
        <IconButton
          disableRipple
          size="small"
          onMouseDown={handleMouseDown}
          sx={{
            padding: 0,
            cursor: "grab",
            "&:hover": { cursor: "grab" },
            "&:active": { cursor: "grabbing" },
          }}
        >
          <DragIndicatorIcon />
        </IconButton>
        {showName && elementId}
      </Stack>
      {children}
    </div>
  );
}
