'use client';

import React, {
  ReactNode,
  useRef,
  useEffect,
  useState,
  CSSProperties,
} from 'react';
import {
  useFrame,
  POST_MESSAGE_LOG_ENABLED,
} from '@/components/contexts/FrameManager/FrameManager';
import { FrameElement } from '@/components/contexts/FrameManager/FrameManager';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme } from '@mui/material';

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
  const theme = useTheme();
  const {
    updateElementPosition,
    removeElementFromFrame,
    unregisterFrame,
  } = useFrame();

  const wrapperRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragOffsetPercent = useRef({ x: 0, y: 0 });

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

  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

  function onDragStart(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    const containerEl = containerRef.current;
    if (!containerEl) return;
    const containerRect = containerEl.getBoundingClientRect();

    const clickPercentX =
      ((event.clientX - containerRect.left) / containerRect.width) * 100;
    const clickPercentY =
      ((event.clientY - containerRect.top) / containerRect.height) * 100;
    dragOffsetPercent.current = {
      x: clickPercentX - positionPercent.x,
      y: clickPercentY - positionPercent.y,
    };

    isDragging.current = true;
  }

  function onDragMove(event: MouseEvent) {
    if (!isDragging.current) return;
    const containerEl = containerRef.current;
    if (!containerEl) return;
    const containerRect = containerEl.getBoundingClientRect();

    const wrapperEl = wrapperRef.current;
    if (!wrapperEl) return;
    const wrapperRect = wrapperEl.getBoundingClientRect();

    const widthPercent = (wrapperRect.width / containerRect.width) * 100;
    const heightPercent = (wrapperRect.height / containerRect.height) * 100;

    const cursorPercentX =
      ((event.clientX - containerRect.left) / containerRect.width) * 100;
    const cursorPercentY =
      ((event.clientY - containerRect.top) / containerRect.height) * 100;

    const newX = cursorPercentX - dragOffsetPercent.current.x;
    const newY = cursorPercentY - dragOffsetPercent.current.y;

    setPositionPercent({
      x: clamp(newX, widthPercent / 2, 100 - widthPercent / 2),
      y: clamp(newY, heightPercent / 2, 100 - heightPercent / 2),
    });
  }

  function onDragEnd() {
    if (!isDragging.current) return;
    isDragging.current = false;

    if (window.top !== window || window.top.opener) {
      const frameNameForTop =
        connectedFrameOrContainerName === 'TopFrame'
          ? (window.name)
          : connectedFrameOrContainerName;
      const targetWindow = window.top?.opener ? window.top.opener : window.top;
      const segments = document.location.pathname.split("/").filter(Boolean);
      const pageName = segments[0] === "frame" ? (segments[2] || "HomePage") : (segments[0] || "HomePage");
      const msg = {
        type: 'updateElementPosition',
        frameName: frameNameForTop,
        elementId: elementToControl.id,
        xPercent: positionPercent.x,
        yPercent: positionPercent.y,
        pageName: pageName
      };

      if (POST_MESSAGE_LOG_ENABLED) {
        console.log(
          `[PostMessage Send] from "${window.name}" to "TopFrame" | type: updateElementPosition | content:`,
          msg
        );
      }

      targetWindow.postMessage(msg, '*');

    }

    // Top window mutation
    updateElementPosition(
      elementToControl.id,
      positionPercent.x,
      positionPercent.y,
      connectedFrameOrContainerName
    );
  }

  useEffect(() => {
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
    return () => {
      document.removeEventListener('mousemove', onDragMove);
      document.removeEventListener('mouseup', onDragEnd);
    };
  }, [positionPercent]);

  function onRemoveClick() {
    if (window.top !== window || window.top.opener) {
      const frameNameForTop =
        connectedFrameOrContainerName === 'TopFrame'
          ? (window.name)
          : connectedFrameOrContainerName;

      const targetWindow = window.top?.opener ? window.top.opener : window.top;
      const segments = document.location.pathname.split("/").filter(Boolean);
      const pageName = segments[0] === "frame" ? (segments[2] || "HomePage") : (segments[0] || "HomePage");
      const msg = {
        type: 'removeElement',
        frameName: frameNameForTop,
        elementId: elementToControl.id,
        isFrameOrContainer: elementToControl.isFrameOrContainer,
        pageName: pageName
      };

      if (POST_MESSAGE_LOG_ENABLED) {
        console.log(
          `[PostMessage Send] from "${window.name}" to "TopFrame" | type: removeElement | content:`,
          msg
        );
      }

      targetWindow.postMessage(msg, '*');

    }

    // Top window mutation
    removeElementFromFrame(elementToControl.id, connectedFrameOrContainerName);
    if (elementToControl.isFrameOrContainer) {
      unregisterFrame(elementToControl);
    }
  }

  const wrapperStyle: CSSProperties = controlsDisabled
    ? { position: 'relative', width: 'fit-content' }
    : {
        position: 'absolute',
        left: `${positionPercent.x}%`,
        top: `${positionPercent.y}%`,
        transform: 'translate(-50%, -50%)',
      };

  return (
    <div
      id={elementToControl.id}
      ref={wrapperRef}
      style={{
        ...wrapperStyle,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        width: 'max-content',
      }}
    >
      <Stack direction="row-reverse" sx={{ color: theme.palette.text.primary }}>
        <IconButton size="small" onClick={onRemoveClick} sx={{ padding: 0 }}>
          <CloseIcon />
        </IconButton>
        {!controlsDisabled && (
          <IconButton
            disableRipple
            size="small"
            onMouseDown={onDragStart}
            sx={{
              padding: 0,
              cursor: 'grab',
              '&:hover': { cursor: 'grab' },
              '&:active': { cursor: 'grabbing' },
            }}
          >
            <DragIndicatorIcon />
          </IconButton>
        )}
        {elementToControl.id}
      </Stack>
      {children}
    </div>
  );
}
