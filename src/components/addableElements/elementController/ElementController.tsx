"use client";

import React, {
  ReactNode,
  useRef,
  useEffect,
  useState,
  CSSProperties,
} from "react";
import {
  FrameElement,
  useFrame,
  POST_MESSAGE_LOG_ENABLED,
} from "@/components/contexts/FrameManager/FrameManager";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import CloseIcon from "@mui/icons-material/Close";

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
    unregisterFrame,
  } = useFrame();

  const draggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const [positionPercent, setPositionPercent] = useState({
    x: elementToControl.xPercent,
    y: elementToControl.yPercent,
  });

  useEffect(() => {
    setPositionPercent({
      x: elementToControl.xPercent,
      y: elementToControl.yPercent,
    });
  }, [elementToControl.xPercent, elementToControl.yPercent]);

  const clampValue = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

  function onDragStart(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    const frameEl = containerRef.current;
    if (!frameEl) return;
    const rect = frameEl.getBoundingClientRect();
    const clickX = ((event.clientX - rect.left) / rect.width) * 100;
    const clickY = ((event.clientY - rect.top) / rect.height) * 100;

    dragOffsetRef.current = {
      x: clickX - positionPercent.x,
      y: clickY - positionPercent.y,
    };
    draggingRef.current = true;
  }

  function onDrag(event: MouseEvent) {
    if (!draggingRef.current) return;
    const frameEl = containerRef.current;
    if (!frameEl) return;

    const frameRect = frameEl.getBoundingClientRect();
    const elNode = document.getElementById(elementToControl.id);
    if (!elNode) return;

    const elRect = elNode.getBoundingClientRect();
    const widthPct = (elRect.width / frameRect.width) * 100;
    const heightPct = (elRect.height / frameRect.height) * 100;

    const cursorX = ((event.clientX - frameRect.left) / frameRect.width) * 100;
    const cursorY = ((event.clientY - frameRect.top) / frameRect.height) * 100;

    const rawX = cursorX - dragOffsetRef.current.x;
    const rawY = cursorY - dragOffsetRef.current.y;

    setPositionPercent({
      x: clampValue(rawX, widthPct / 2, 100 - widthPct / 2),
      y: clampValue(rawY, heightPct / 2, 100 - heightPct / 2),
    });
  }

  function onDragEnd() {
    if (!draggingRef.current) return;
    draggingRef.current = false;

    updateElementPosition(
      elementToControl.id,
      positionPercent.x,
      positionPercent.y,
      connectedFrameOrContainerName
    );

    if (window.top !== window && POST_MESSAGE_LOG_ENABLED) {
      console.log(
        `[PostMessage Send] updateElementPosition` +
        ` | from: ${window.name || "TopFrame"}` +
        ` | element: ${elementToControl.id}` +
        ` | x: ${positionPercent.x}` +
        ` | y: ${positionPercent.y}`
      );
    }

    if (window.top !== window) {
      window.top?.postMessage(
        {
          type: "updateElementPosition",
          frameName: window.name,
          elementId: elementToControl.id,
          xPercent: positionPercent.x,
          yPercent: positionPercent.y,
        },
        "*"
      );
    }
  }

  useEffect(() => {
    document.addEventListener("mousemove", onDrag);
    document.addEventListener("mouseup", onDragEnd);
    return () => {
      document.removeEventListener("mousemove", onDrag);
      document.removeEventListener("mouseup", onDragEnd);
    };
  }, [positionPercent]);

  function onRemove() {
    removeElementFromFrame(
      elementToControl.id,
      connectedFrameOrContainerName
    );
    if (elementToControl.isFrameOrContainer) {
      unregisterFrame(elementToControl);
    }

    if (window.top !== window && POST_MESSAGE_LOG_ENABLED) {
      console.log(
        `[PostMessage Send] removeElement` +
        ` | from: ${window.name || "TopFrame"}` +
        ` | element: ${elementToControl.id}`
      );
    }

    if (window.top !== window) {
      window.top?.postMessage(
        {
          type: "removeElement",
          elementId: elementToControl.id,
          frameName:
            connectedFrameOrContainerName === "TopFrame"
              ? window.name
              : connectedFrameOrContainerName,
          element: elementToControl,
        },
        "*"
      );
    }
  }

  const wrapperStyle: CSSProperties = controlsDisabled
    ? { position: "relative", width: "fit-content" }
    : {
        position: "absolute",
        left: `${positionPercent.x}%`,
        top: `${positionPercent.y}%`,
        transform: "translate(-50%, -50%)",
      };

  return (
    <div id={elementToControl.id} style={wrapperStyle}>
      <Stack direction="row-reverse">
        <IconButton size="small" onClick={onRemove} sx={{ padding: 0 }}>
          <CloseIcon />
        </IconButton>

        {!controlsDisabled && (
          <IconButton
            disableRipple
            size="small"
            onMouseDown={onDragStart}
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
        {/* change later idk */}
        {elementToControl.id}
        {/* {shouldShowName && elementToControl.id} */}
      </Stack>
      {children}
    </div>
  );
}
