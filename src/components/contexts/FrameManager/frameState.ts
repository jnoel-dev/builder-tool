import type { RefObject } from "react";
import {
  FrameElement,
  DEFAULT_PAGE_NAME,
  findParentFrameName,
} from "./frameUtils";

import { getMaxSuffixForComponentAcrossAllPages } from "./framePersistence";

export interface FrameStateRefs {
  frameElementsByFrameNameRef: RefObject<Record<string, FrameElement[]>>;
  frameNameListRef: RefObject<string[]>;
  framePageByFrameNameRef: RefObject<Record<string, string>>;
  idMaxSuffixByComponentRef: RefObject<Record<string, number>>;
  containerRefsRef: RefObject<Record<string, RefObject<HTMLDivElement | null>>>;
  markFrameDirty: (frameName: string) => void;
}

/**
 * Maintain suffix counters across all pages so element IDs remain stable after navigation.
 */
export function recordMaxSuffixFromElements(
  elements: FrameElement[],
  idMaxSuffixByComponentRef: RefObject<Record<string, number>>
): void {
  const counters = idMaxSuffixByComponentRef.current;
  if (!counters) return;

  for (const element of elements) {
    const parts = element.id.split("-");
    const lastPart = parts[parts.length - 1];
    const suffixNumber = parseInt(lastPart || "0", 10);
    if (!Number.isFinite(suffixNumber)) continue;

    const currentMax = counters[element.componentName] || 0;
    if (suffixNumber > currentMax) {
      counters[element.componentName] = suffixNumber;
    }
  }
}

/**
 * Register a frame and assign its owning page (inherit from parent when possible).
 */
export function registerFrame(frameName: string, refs: FrameStateRefs): void {
  const {
    frameNameListRef,
    containerRefsRef,
    framePageByFrameNameRef,
    frameElementsByFrameNameRef,
  } = refs;

  const frameNames = frameNameListRef.current;
  const containerRefs = containerRefsRef.current;
  const pageByFrame = framePageByFrameNameRef.current;
  const elementsByFrame = frameElementsByFrameNameRef.current;

  if (!frameNames || !containerRefs || !pageByFrame || !elementsByFrame) return;

  if (!frameNames.includes(frameName)) {
    frameNameListRef.current = [...frameNames, frameName];
  }

  if (!containerRefs[frameName]) {
    containerRefs[frameName] = { current: null };
  }

  const currentPageName = window.location.pathname.slice(1) || DEFAULT_PAGE_NAME;
  if (!pageByFrame[frameName]) {
    const parentName = findParentFrameName(frameName, elementsByFrame);
    const inheritedPageName = parentName ? pageByFrame[parentName] : undefined;
    pageByFrame[frameName] = inheritedPageName || currentPageName;
  }
}

/**
 * Create a new element with a stable, incrementing ID suffix per component type.
 */
export function addElementToFrame(
  currentFrameName: string,
  componentName: string,
  isFrameOrContainer: boolean,
  customProps: Record<string, any>,
  refs: FrameStateRefs
): string {
  const { frameElementsByFrameNameRef, idMaxSuffixByComponentRef, markFrameDirty } = refs;

  const elementsByFrame = frameElementsByFrameNameRef.current;
  const counters = idMaxSuffixByComponentRef.current;
  if (!elementsByFrame || !counters) return "";

  const globalMaxSuffix = getMaxSuffixForComponentAcrossAllPages(
    componentName,
    elementsByFrame
  );

  const nextSuffix = globalMaxSuffix === 0 ? 1 : globalMaxSuffix + 1;
  counters[componentName] = nextSuffix;

  const newElementId = `${componentName}-${nextSuffix}`;
  const newElement: FrameElement = {
    id: newElementId,
    componentName,
    xPercent: 50,
    yPercent: 50,
    isFrameOrContainer,
    customProps,
  };

  const currentList = elementsByFrame[currentFrameName] || [];
  frameElementsByFrameNameRef.current = {
    ...elementsByFrame,
    [currentFrameName]: [...currentList, newElement],
  };

  markFrameDirty(currentFrameName);
  return newElementId;
}


/**
 * Remove an element from a frame without disturbing other frames.
 */
export function removeElementFromFrame(
  frameName: string,
  elementId: string,
  refs: FrameStateRefs
): void {
  const { frameElementsByFrameNameRef, markFrameDirty } = refs;
  const elementsByFrame = frameElementsByFrameNameRef.current;
  if (!elementsByFrame) return;

  const currentList = elementsByFrame[frameName] || [];
  const updatedList = currentList.filter((element) => element.id !== elementId);

  frameElementsByFrameNameRef.current = {
    ...elementsByFrame,
    [frameName]: updatedList,
  };

  markFrameDirty(frameName);
}

/**
 * Update only the position fields to avoid clobbering other element props.
 */
export function updateElementPosition(
  frameName: string,
  elementId: string,
  xPercent: number,
  yPercent: number,
  refs: FrameStateRefs
): void {
  const { frameElementsByFrameNameRef, markFrameDirty } = refs;
  const elementsByFrame = frameElementsByFrameNameRef.current;
  if (!elementsByFrame) return;

  const currentList = elementsByFrame[frameName] || [];
  const updatedList = currentList.map((element) =>
    element.id === elementId ? { ...element, xPercent, yPercent } : element
  );

  frameElementsByFrameNameRef.current = {
    ...elementsByFrame,
    [frameName]: updatedList,
  };

  markFrameDirty(frameName);
}
