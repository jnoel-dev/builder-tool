'use client';

import React, {
  ReactNode,
  useRef,
  useEffect,
  useState,
  CSSProperties,
} from 'react';
import {
  FrameElement,
  useFrame,
  POST_MESSAGE_LOG_ENABLED,
} from '@/components/contexts/FrameManager/FrameManager';
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

function getTopAppWindow(): Window | null {
  if (window.opener && window.top === window) {
   
    return window.opener;
  }

  if (window.top !== window) {
    return window.top;
  }
  return null;
}





  useEffect(() => {
    console.log(elementToControl)
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
    const widthPercent =
      (wrapperRect.width / containerRect.width) * 100;
    const heightPercent =
      (wrapperRect.height / containerRect.height) * 100;

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

  updateElementPosition(
    elementToControl.id,
    positionPercent.x,
    positionPercent.y,
    connectedFrameOrContainerName
  );

  const targetWindow = getTopAppWindow();

  if (targetWindow) {
    if (POST_MESSAGE_LOG_ENABLED) {
      console.log(
        `[PostMessage Send] updateElementPosition` +
          ` | from: ${window.name || 'TopFrame'}` +
          ` | to: ${targetWindow === window.opener ? 'opener' : 'top'}` +
          ` | element: ${elementToControl.id}` +
          ` | x: ${positionPercent.x}` +
          ` | y: ${positionPercent.y}`
      );
    }

   

    targetWindow.postMessage(
      {
        type: 'updateElementPosition',
        frameName: window.name,
        elementId: elementToControl.id,
        xPercent: positionPercent.x,
        yPercent: positionPercent.y,
      },
      '*'
    );
  }
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
  removeElementFromFrame(
    elementToControl.id,
    connectedFrameOrContainerName
  );

  if (elementToControl.isFrameOrContainer) {
    unregisterFrame(elementToControl);
  }

  const targetWindow = getTopAppWindow();

  if (targetWindow) {
    if (POST_MESSAGE_LOG_ENABLED) {
      console.log(
        `[PostMessage Send] removeElement` +
          ` | from: ${window.name || 'TopFrame'}` +
          ` | to: ${targetWindow === window.opener ? 'opener' : 'top'}` +
          ` | element: ${elementToControl.id}`
      );
    }

    targetWindow.postMessage(
      {
        type: 'removeElement',
        elementId: elementToControl.id,
        frameName:
          connectedFrameOrContainerName === 'TopFrame'
            ? window.name
            : connectedFrameOrContainerName,
        element: elementToControl,
      },
      '*'
    );
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
