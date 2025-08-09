// framePersistence.ts
import type { RefObject } from "react";
import {
  FrameElement,
  DEFAULT_FRAME_NAME,
  DEFAULT_PAGE_NAME,
  FRAMES_PARAM_PREFIX,
  ELEMENTS_PARAM_PREFIX,
  parseElementsParam,
  serializeElementsParam,
} from "./frameUtils";

export interface PersistenceRefs {
  frameElementsByFrameNameRef: RefObject<Record<string, FrameElement[]>>;
  frameNameListRef: RefObject<string[]>;
  framePageByFrameNameRef: RefObject<Record<string, string>>;
  dirtyFrameNamesRef: RefObject<Set<string>>;
}

export interface LoadCallbacks {
  applyLoadedState: (opts: {
    frameNames: string[];
    elementsByFrame: Record<string, FrameElement[]>;
    currentFrameName: string;
    pageName: string;
  }) => void;
  recordMaxSuffixFromElements: (elements: FrameElement[]) => void;
}

/**
 * Read current page name from top window location. Kept here to keep all persistence path logic in one place.
 */
export function getCurrentTopPageName(): string {
  return window.location.pathname.slice(1) || DEFAULT_PAGE_NAME;
}

/**
 * Merge URL params into sessionStorage so a full snapshot survives navigation and back/forward.
 * We always keep sessionStorage as the canonical, merged snapshot.
 */
function mergeUrlIntoSessionStorage(): URLSearchParams {
  const sessionParams = new URLSearchParams(sessionStorage.getItem("savedPageParams") || "");
  const urlParams = new URLSearchParams(window.location.search);

  for (const [key, value] of urlParams.entries()) {
    sessionParams.set(key, value);
  }

  sessionStorage.setItem("savedPageParams", sessionParams.toString());
  return sessionParams;
}

/**
 * Load the current page’s frames/elements from URL or sessionStorage (fallback).
 * Ensures TopFrame exists and returns a clean, ready-to-apply snapshot.
 */
export function loadFromUrlAndSession(callbacks: LoadCallbacks): void {
  const pageName = getCurrentTopPageName();

  const urlParams = new URLSearchParams(window.location.search);
  const sessionParams = new URLSearchParams(sessionStorage.getItem("savedPageParams") || "");

  const framesParam =
    urlParams.get(`${FRAMES_PARAM_PREFIX}${pageName}`) ??
    sessionParams.get(`${FRAMES_PARAM_PREFIX}${pageName}`);

  const elementsParam =
    urlParams.get(`${ELEMENTS_PARAM_PREFIX}${pageName}`) ??
    sessionParams.get(`${ELEMENTS_PARAM_PREFIX}${pageName}`);

  if (!framesParam || !elementsParam) {
    // Nothing explicit in URL; unify and store so back/forward does not drop state.
    mergeUrlIntoSessionStorage();
    return;
  }

  const parsedFrameNames = framesParam.split(",").filter(Boolean);
  const parsedElementsByFrame = parseElementsParam(elementsParam);

  if (!parsedFrameNames.includes(DEFAULT_FRAME_NAME)) {
    parsedFrameNames.unshift(DEFAULT_FRAME_NAME);
  }
  if (!parsedElementsByFrame[DEFAULT_FRAME_NAME]) {
    parsedElementsByFrame[DEFAULT_FRAME_NAME] = [];
  }

  // Keep ID suffix counters consistent across navigation.
  for (const frameName of Object.keys(parsedElementsByFrame)) {
    callbacks.recordMaxSuffixFromElements(parsedElementsByFrame[frameName] || []);
  }

  callbacks.applyLoadedState({
    frameNames: parsedFrameNames.length ? parsedFrameNames : [DEFAULT_FRAME_NAME],
    elementsByFrame:
      Object.keys(parsedElementsByFrame).length
        ? parsedElementsByFrame
        : { [DEFAULT_FRAME_NAME]: [] },
    currentFrameName: parsedFrameNames[0] || DEFAULT_FRAME_NAME,
    pageName,
  });

  // Store a merged view so sessionStorage always has the full snapshot.
  mergeUrlIntoSessionStorage();
}

/**
 * Build a single params object containing all touched pages.
 * We update only pages that have at least one known frame ownership entry.
 */
export function buildParamsToWrite(refs: PersistenceRefs): URLSearchParams {
  const sessionBase = new URLSearchParams(sessionStorage.getItem("savedPageParams") || "");
  const urlNow = new URLSearchParams(window.location.search);

  for (const [key, value] of urlNow.entries()) {
    sessionBase.set(key, value);
  }

  const paramsToWrite = new URLSearchParams(sessionBase.toString());
  const frameNames = refs.frameNameListRef.current || [];
  const elementsByFrameName = refs.frameElementsByFrameNameRef.current || {};
  const ownerPageByFrameName = refs.framePageByFrameNameRef.current || {};
  const dirtyFrameNames = refs.dirtyFrameNamesRef.current || new Set<string>();

  const touchedPages = new Set<string>();
  for (const frameName of frameNames) {
    const ownerPage = ownerPageByFrameName[frameName] || getCurrentTopPageName();
    touchedPages.add(ownerPage);
  }

  for (const pageName of touchedPages) {
    const existingElementsRaw =
      sessionBase.get(`${ELEMENTS_PARAM_PREFIX}${pageName}`) || "";
    const unionElementsByFrameName: Record<string, FrameElement[]> = {
      ...parseElementsParam(existingElementsRaw),
    };

    for (const frameName of frameNames) {
      // IMPORTANT: fallback to pageName here, not getCurrentTopPageName()
      const ownerPage = ownerPageByFrameName[frameName] || pageName;
      if (ownerPage !== pageName) continue;

      if (dirtyFrameNames.has(frameName)) {
        unionElementsByFrameName[frameName] = elementsByFrameName[frameName] || [];
      } else if (!(frameName in unionElementsByFrameName)) {
        unionElementsByFrameName[frameName] = [];
      }
    }

    if (!(DEFAULT_FRAME_NAME in unionElementsByFrameName)) {
      unionElementsByFrameName[DEFAULT_FRAME_NAME] = [];
    }

    const frameNamesForPage = Object.keys(unionElementsByFrameName);
    const hasTop = frameNamesForPage.includes(DEFAULT_FRAME_NAME);
    if (!hasTop) {
      frameNamesForPage.unshift(DEFAULT_FRAME_NAME);
    } else {
      const topIndex = frameNamesForPage.indexOf(DEFAULT_FRAME_NAME);
      if (topIndex > 0) {
        frameNamesForPage.splice(topIndex, 1);
        frameNamesForPage.unshift(DEFAULT_FRAME_NAME);
      }
    }

    paramsToWrite.set(`${FRAMES_PARAM_PREFIX}${pageName}`, frameNamesForPage.join(","));
    paramsToWrite.set(
      `${ELEMENTS_PARAM_PREFIX}${pageName}`,
      serializeElementsParam(unionElementsByFrameName)
    );
  }

  return paramsToWrite;
}



/**
 * Write params to sessionStorage and replace the current URL.
 */
function commitParams(paramsToWrite: URLSearchParams): void {
  sessionStorage.setItem("savedPageParams", paramsToWrite.toString());
  const newUrl =
    `${window.location.origin}${window.location.pathname}?` +
    `${paramsToWrite.toString()}${window.location.hash}`;
  window.history.replaceState(null, "", newUrl);
}

/**
 * Public: compute and persist the merged snapshot immediately.
 */
export function saveNow(refs: PersistenceRefs): void {
  const paramsToWrite = buildParamsToWrite(refs);
  // Clearing dirty frames here ensures subsequent saves only write real changes.
  refs.dirtyFrameNamesRef.current?.clear();
  commitParams(paramsToWrite);
}

export function buildMergedParams(): URLSearchParams {
  const sessionParams = new URLSearchParams(sessionStorage.getItem("savedPageParams") || "");
  const urlParams = new URLSearchParams(window.location.search);
  for (const [key, value] of urlParams.entries()) sessionParams.set(key, value);
  sessionStorage.setItem("savedPageParams", sessionParams.toString());
  return sessionParams;
}

export function buildChildrenGraphAcrossAllPages(
  allParams: URLSearchParams
): Record<string, string[]> {
  const childIdsByFrameName: Record<string, string[]> = {};

  for (const [key, value] of allParams.entries()) {
    if (!key.startsWith(ELEMENTS_PARAM_PREFIX)) continue;

    const elementsByFrameName = parseElementsParam(value || "");
    for (const [frameName, elementListForFrame] of Object.entries(elementsByFrameName)) {
      const childIdsForFrame = (elementListForFrame || [])
        .filter((element) => element.isFrameOrContainer)
        .map((element) => element.id);

      if (!childIdsByFrameName[frameName]) childIdsByFrameName[frameName] = [];
      childIdsByFrameName[frameName].push(...childIdsForFrame);
    }
  }

  return childIdsByFrameName;
}

export function collectDescendantFrameIds(
  rootFrameId: string,
  childrenGraph: Record<string, string[]>,
  inMemoryElementsByFrameName: Record<string, FrameElement[]>
): Set<string> {
  const idsToRemove = new Set<string>();
  const pendingFrameIds: string[] = [rootFrameId];

  while (pendingFrameIds.length > 0) {
    const nextFrameId = pendingFrameIds.pop() as string;
    if (idsToRemove.has(nextFrameId)) continue;
    idsToRemove.add(nextFrameId);

    const inMemoryChildren = (inMemoryElementsByFrameName[nextFrameId] || [])
      .filter((element) => element.isFrameOrContainer)
      .map((element) => element.id);

    const persistedChildren = childrenGraph[nextFrameId] || [];

    for (const childId of inMemoryChildren) pendingFrameIds.push(childId);
    for (const childId of persistedChildren) pendingFrameIds.push(childId);
  }

  return idsToRemove;
}

export function removeFramesAcrossAllPages(frameIdsToRemove: Set<string>): void {
  const params = buildMergedParams();

  const pageNames = new Set<string>();
  for (const key of params.keys()) {
    if (key.startsWith(FRAMES_PARAM_PREFIX) || key.startsWith(ELEMENTS_PARAM_PREFIX)) {
      const [, pageName] = key.split(".");
      if (pageName) pageNames.add(pageName);
    }
  }

  for (const pageName of pageNames) {
    const framesKey = `${FRAMES_PARAM_PREFIX}${pageName}`;
    const elementsKey = `${ELEMENTS_PARAM_PREFIX}${pageName}`;
    const elementsRaw = params.get(elementsKey) || "";
    const elementsByFrameName = parseElementsParam(elementsRaw);

    for (const removedId of frameIdsToRemove) delete elementsByFrameName[removedId];

    for (const [frameName, elementListForFrame] of Object.entries(elementsByFrameName)) {
      const filteredElementList = (elementListForFrame || []).filter(
        (element) => !(element.isFrameOrContainer && frameIdsToRemove.has(element.id))
      );
      elementsByFrameName[frameName] = filteredElementList;
    }

    const remainingFrameNames = Object.keys(elementsByFrameName);

    if (remainingFrameNames.length === 0) {
      params.delete(framesKey);
      params.delete(elementsKey);
      continue;
    }

    if (!remainingFrameNames.includes(DEFAULT_FRAME_NAME)) {
      remainingFrameNames.unshift(DEFAULT_FRAME_NAME);
      if (!elementsByFrameName[DEFAULT_FRAME_NAME]) elementsByFrameName[DEFAULT_FRAME_NAME] = [];
    }

    params.set(framesKey, remainingFrameNames.join(","));
    params.set(elementsKey, serializeElementsParam(elementsByFrameName));
  }

  // Commit immediately so a stale URL/session doesn’t resurrect removed frames.
  const newUrl =
    `${window.location.origin}${window.location.pathname}?` +
    `${params.toString()}${window.location.hash}`;
  sessionStorage.setItem("savedPageParams", params.toString());
  window.history.replaceState(null, "", newUrl);
}

export function rebuildIdCountersFromAllSessionPages(
  recordMaxSuffix: (elements: FrameElement[]) => void
): void {
  const savedParams = new URLSearchParams(sessionStorage.getItem("savedPageParams") || "");
  for (const [key, value] of savedParams.entries()) {
    if (!key.startsWith(ELEMENTS_PARAM_PREFIX)) continue;
    const elementsByFrame = parseElementsParam(value || "");
    for (const elementsForFrame of Object.values(elementsByFrame)) {
      recordMaxSuffix(elementsForFrame || []);
    }
  }
}

export function getMaxSuffixForComponentAcrossAllPages(
  componentName: string,
  inMemoryElementsByFrameName: Record<string, FrameElement[]>
): number {
  let maxSuffix = 0;

  // in-memory
  for (const elementList of Object.values(inMemoryElementsByFrameName)) {
    for (const element of elementList || []) {
      if (element.componentName !== componentName) continue;
      const parts = element.id.split("-");
      const suffix = parseInt(parts[parts.length - 1] || "0", 10);
      if (Number.isFinite(suffix) && suffix > maxSuffix) maxSuffix = suffix;
    }
  }

  // sessionStorage (all pages)
  const savedParams = new URLSearchParams(sessionStorage.getItem("savedPageParams") || "");
  for (const [key, value] of savedParams.entries()) {
    if (!key.startsWith(ELEMENTS_PARAM_PREFIX)) continue;
    const elementsByFrame = parseElementsParam(value || "");
    for (const elementList of Object.values(elementsByFrame)) {
      for (const element of elementList || []) {
        if (element.componentName !== componentName) continue;
        const parts = element.id.split("-");
        const suffix = parseInt(parts[parts.length - 1] || "0", 10);
        if (Number.isFinite(suffix) && suffix > maxSuffix) maxSuffix = suffix;
      }
    }
  }

  return maxSuffix;
}

/**
 * Debounced saver to prevent excessive writes during rapid edits.
 */
export class DebouncedSaver {
  private timerId: number | null = null;
  private readonly delayMs: number;
  private readonly refs: PersistenceRefs;

  constructor(refs: PersistenceRefs, delayMs: number = 140) {
    this.refs = refs;
    this.delayMs = delayMs;
  }

  trigger(): void {
    if (this.timerId) {
      window.clearTimeout(this.timerId);
    }
    this.timerId = window.setTimeout(() => {
      this.timerId = null;
      saveNow(this.refs);
    }, this.delayMs);
  }

  dispose(): void {
    if (this.timerId) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
  }
}
