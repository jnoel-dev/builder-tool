'use client';

import { ReactNode, useRef, useEffect, useState, CSSProperties } from "react";
import { FrameElement, useFrame } from "@/components/contexts/FrameManager/FrameManager";
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import CloseIcon from '@mui/icons-material/Close';


interface ElementControllerProps {
  elementToControl: FrameElement;
  controlsDisabled: boolean;
  shouldShowName: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  connectedFrameOrContainerName: string;
  children: ReactNode;
}

export default function ElementController({
  elementToControl,
  controlsDisabled,
  shouldShowName,
  containerRef,
  connectedFrameOrContainerName,
  children,
}: ElementControllerProps) {
  const {
    updateElementPosition,
    removeElementFromFrame,
    removeFrame,
    frameContainerRefs,

  } = useFrame();

  const isDraggingRef = useRef(false);
  const dragOffsetPercentRef = useRef({ xOffsetPercent: 0, yOffsetPercent: 0 });
 
  const [elementPositionPercent, setElementPositionPercent] = useState({
    xPercent: elementToControl.xPercent,
    yPercent: elementToControl.yPercent
  });


  useEffect(() => {
    setElementPositionPercent({ xPercent: elementToControl.xPercent, yPercent: elementToControl.yPercent });
  }, [elementToControl.xPercent, elementToControl.yPercent ]);

  function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  function handleMouseDown(event: React.MouseEvent<HTMLButtonElement>) {

    event.preventDefault();
  

    const currentFrameContainer = containerRef.current;
    if (!currentFrameContainer) return;

    const frameRect = currentFrameContainer.getBoundingClientRect();
    const clickXPercent = ((event.clientX - frameRect.left) / frameRect.width) * 100;
    const clickYPercent = ((event.clientY - frameRect.top) / frameRect.height) * 100;

    dragOffsetPercentRef.current = {
      xOffsetPercent: clickXPercent - elementPositionPercent.xPercent,
      yOffsetPercent: clickYPercent - elementPositionPercent.yPercent,
    };
    isDraggingRef.current = true;
  }

  function handleMouseMove(event: MouseEvent) {
    if (!isDraggingRef.current) return;
    const currentFrameContainer = containerRef.current;
    if (!currentFrameContainer) return;

    const frameRect = currentFrameContainer.getBoundingClientRect();
    const elNode = document.getElementById(elementToControl.id);
    if (!elNode) return;

    const elRect = elNode.getBoundingClientRect();
    const widthPercent = (elRect.width / frameRect.width) * 100;
    const heightPercent = (elRect.height / frameRect.height) * 100;
    const cursorXPercent = ((event.clientX - frameRect.left) / frameRect.width) * 100;
    const cursorYPercent = ((event.clientY - frameRect.top) / frameRect.height) * 100;

    const unclampedX = cursorXPercent - dragOffsetPercentRef.current.xOffsetPercent;
    const unclampedY = cursorYPercent - dragOffsetPercentRef.current.yOffsetPercent;
    const minX = widthPercent / 2;
    const maxX = 100 - (widthPercent / 2);
    const minY = heightPercent / 2;
    const maxY = 100 - (heightPercent / 2);

    setElementPositionPercent({
      xPercent: clamp(unclampedX, minX, maxX),
      yPercent: clamp(unclampedY, minY, maxY),
    });
  }

function handleMouseUp() {
  console.log(frameContainerRefs)
  if (!isDraggingRef.current) return;
  isDraggingRef.current = false;

  updateElementPosition(
    elementToControl.id,
    elementPositionPercent.xPercent,
    elementPositionPercent.yPercent,
    connectedFrameOrContainerName
  );


  // Only send postMessage if inside an iframe
  if (window.top !== window) {
 
    window.top?.postMessage(
      {
        type: 'updateElementPosition',
        frameName: window.name,
        elementId: elementToControl.id,
        xPercent: elementPositionPercent.xPercent,
        yPercent: elementPositionPercent.yPercent,
      },
      '*'
    );
  }
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
    removeElementFromFrame(elementToControl.id, connectedFrameOrContainerName);

    if (elementToControl.isFrameOrContainer) {
      removeFrame(elementToControl);
    }

    // Only send postMessage if inside an iframe
    if (window.top !== window) {
   
      window.top?.postMessage(
        {
          type: 'removeElement',
          elementId: elementToControl.id,
          frameName: window.name,
        },
        '*'
      );
    }
  }


  const containerStyle: CSSProperties = controlsDisabled
    ? { position: 'relative', width: 'fit-content' }
    : {
        position: 'absolute',
        left: `${elementPositionPercent.xPercent}%`,
        top: `${elementPositionPercent.yPercent}%`,
        transform: 'translate(-50%, -50%)',
      };

      

  return (
    <div id={elementToControl.id} style={containerStyle}>
      <Stack direction="row-reverse">
        <IconButton size="small" onClick={handleRemoveElement} sx={{ padding: 0 }}>
          <CloseIcon />
        </IconButton>

        {!controlsDisabled && (
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
        )}

        {elementToControl.id}
        {/* change later idk */}
        {/* {shouldShowName && elementToControl.id} */}
      </Stack>
      {children}
    </div>
  );
}
