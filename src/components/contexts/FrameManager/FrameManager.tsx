// FrameManager.tsx
"use client";

import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  ReactNode,
  createRef,
  RefObject,
} from "react";

import {
  FrameElement,
  DEFAULT_FRAME_NAME,
  DEFAULT_PAGE_NAME,
  parseElementsParam,
} from "./frameUtils";

import {
  FrameStateRefs,
  registerFrame as registerFrameCore,
  addElementToFrame,
  removeElementFromFrame as removeElementFromFrameCore,
  updateElementPosition as updateElementPositionCore,
  recordMaxSuffixFromElements,
} from "./frameState";

import {
  loadFromUrlAndSession,
  DebouncedSaver,
  buildMergedParams,
  buildChildrenGraphAcrossAllPages,
  collectDescendantFrameIds,
  removeFramesAcrossAllPages,
  rebuildIdCountersFromAllSessionPages,
} from "./framePersistence";

import {
  attachTopWindowMessaging,
  attachChildWindowMessaging,
  attachChildPageChangeNotifier,
  postSyncFrame,
  TopWindowMessagingCallbacks,
  ChildWindowMessagingCallbacks,
} from "./frameMessaging";

export const POST_MESSAGE_LOG_ENABLED = true;

export interface FrameContextValue {
  currentFrameName: string;
  setCurrentFrameName: (frameName: string) => void;
  frameNameList: string[];
  replaceFrameElements: (frameName: string, elements: FrameElement[]) => void;
  registerFrame: (frameName: string) => void;
  unregisterFrame: (frame: FrameElement) => void;
  addElementToCurrentFrame: (
    componentName: string,
    isFrameOrContainer: boolean,
    customProps?: Record<string, any>
  ) => string;
  removeElementFromFrame: (elementId: string, frameName: string) => void;
  updateElementPosition: (
    elementId: string,
    xPercent: number,
    yPercent: number,
    frameName: string
  ) => void;
  frameElementsByFrameName: Record<string, FrameElement[]>;
  containerRefs: Record<string, RefObject<HTMLDivElement | null>>;
}

const FrameContext = createContext<FrameContextValue | undefined>(undefined);

export function FrameManager({ children }: { children: ReactNode }) {
  const [frameNameList, setFrameNameList] = useState<string[]>([DEFAULT_FRAME_NAME]);
  const [currentFrameName, setCurrentFrameName] = useState<string>(DEFAULT_FRAME_NAME);
  const [frameElementsByFrameName, setFrameElementsByFrameName] = useState<
    Record<string, FrameElement[]>
  >({ [DEFAULT_FRAME_NAME]: [] });

  const containerRefsRef = useRef<Record<string, RefObject<HTMLDivElement | null>>>({
    [DEFAULT_FRAME_NAME]: createRef<HTMLDivElement | null>(),
  });

  // Internal refs mutated by core modules; mirrored into React state after each change.
  const frameNameListRef = useRef<string[]>(frameNameList);
  const frameElementsByFrameNameRef = useRef<Record<string, FrameElement[]>>(
    frameElementsByFrameName
  );
  const framePageByFrameNameRef = useRef<Record<string, string>>({});
  const idMaxSuffixByComponentRef = useRef<Record<string, number>>({});
  const dirtyFrameNamesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    frameNameListRef.current = frameNameList;
  }, [frameNameList]);

  useEffect(() => {
    frameElementsByFrameNameRef.current = frameElementsByFrameName;
  }, [frameElementsByFrameName]);

  function markFrameDirty(frameName: string): void {
    dirtyFrameNamesRef.current.add(frameName);
  }

  const stateRefs: FrameStateRefs = {
    frameElementsByFrameNameRef,
    frameNameListRef,
    framePageByFrameNameRef,
    idMaxSuffixByComponentRef,
    containerRefsRef,
    markFrameDirty,
  };

  const saver = useRef<DebouncedSaver | null>(null);

  function syncReactStateFromRefs(): void {
    setFrameNameList([...frameNameListRef.current]);
    setFrameElementsByFrameName({ ...frameElementsByFrameNameRef.current });
  }

  function registerFrame(frameName: string): void {
    registerFrameCore(frameName, stateRefs);
    setCurrentFrameName(frameName);
    syncReactStateFromRefs();
    saver.current?.trigger();
  }

  function replaceFrameElements(frameName: string, elements: FrameElement[]): void {
    frameElementsByFrameNameRef.current = {
      ...frameElementsByFrameNameRef.current,
      [frameName]: elements,
    };
    markFrameDirty(frameName);
    syncReactStateFromRefs();
    saver.current?.trigger();
  }

  // Used when loading/syncing from storage; does not mark dirty.
  function replaceFrameElementsFromStorage(frameName: string, elements: FrameElement[]): void {
    frameElementsByFrameNameRef.current = {
      ...frameElementsByFrameNameRef.current,
      [frameName]: elements,
    };
    setFrameElementsByFrameName({ ...frameElementsByFrameNameRef.current });
  }

  function addElementToCurrentFrame(
    componentName: string,
    isFrameOrContainer: boolean,
    customProps: Record<string, any> = {}
  ): string {
    const newId = addElementToFrame(
      currentFrameName,
      componentName,
      isFrameOrContainer,
      customProps,
      stateRefs
    );
    syncReactStateFromRefs();
    saver.current?.trigger();
    return newId;
  }

  function removeElementFromFrame(elementId: string, frameName: string): void {
    removeElementFromFrameCore(frameName, elementId, stateRefs);
    syncReactStateFromRefs();
    saver.current?.trigger();
  }

  function updateElementPosition(
    elementId: string,
    xPercent: number,
    yPercent: number,
    frameName: string
  ): void {
    updateElementPositionCore(frameName, elementId, xPercent, yPercent, stateRefs);
    syncReactStateFromRefs();
    saver.current?.trigger();
  }

  function unregisterFrame(frameToRemove: FrameElement): void {
    if (!frameToRemove.isFrameOrContainer) return;

    const frameIdToRemove = frameToRemove.id;

    const mergedParams = buildMergedParams();
    const childrenGraph = buildChildrenGraphAcrossAllPages(mergedParams);
    const frameIdsToRemove = collectDescendantFrameIds(
      frameIdToRemove,
      childrenGraph,
      frameElementsByFrameNameRef.current
    );

    // Remove from in-memory registries/maps.
    frameNameListRef.current = frameNameListRef.current.filter(
      (registeredFrameName) => !frameIdsToRemove.has(registeredFrameName)
    );

    for (const removedFrameId of frameIdsToRemove) {
      delete containerRefsRef.current[removedFrameId];
      delete framePageByFrameNameRef.current[removedFrameId];
    }

    const nextElementsByFrameName: Record<string, FrameElement[]> = {
      ...frameElementsByFrameNameRef.current,
    };

    for (const removedFrameId of frameIdsToRemove) {
      delete nextElementsByFrameName[removedFrameId];
    }

    for (const [frameName, elementListForFrame] of Object.entries(nextElementsByFrameName)) {
      const filteredElementList = (elementListForFrame || []).filter(
        (element) => !(element.isFrameOrContainer && frameIdsToRemove.has(element.id))
      );
      if (filteredElementList.length !== (elementListForFrame || []).length) {
        nextElementsByFrameName[frameName] = filteredElementList;
        markFrameDirty(frameName);
      }
    }

    frameElementsByFrameNameRef.current = nextElementsByFrameName;

    // Drop counters for component types no longer present.
    (function resetMissingComponentCounters() {
      const elementsByFrame = frameElementsByFrameNameRef.current;
      const counters = idMaxSuffixByComponentRef.current;
      if (!elementsByFrame || !counters) return;

      const componentNamesInUse = new Set<string>();
      for (const elementList of Object.values(elementsByFrame)) {
        for (const element of elementList || []) {
          componentNamesInUse.add(element.componentName);
        }
      }

      for (const componentName of Object.keys(counters)) {
        if (!componentNamesInUse.has(componentName)) {
          delete counters[componentName];
        }
      }
    })();

    setCurrentFrameName(DEFAULT_FRAME_NAME);
    syncReactStateFromRefs();

    // Remove from URL + sessionStorage immediately so the state can't resurrect.
    removeFramesAcrossAllPages(frameIdsToRemove);

    saver.current?.trigger();
  }

  // Load on mount (top only)
  useEffect(function initializeFromPersistence() {
    if (window.top !== window) return;

    saver.current = new DebouncedSaver(
      {
        frameElementsByFrameNameRef,
        frameNameListRef,
        framePageByFrameNameRef,
        dirtyFrameNamesRef,
      },
      140
    );

    function applyLoadedState(opts: {
      frameNames: string[];
      elementsByFrame: Record<string, FrameElement[]>;
      currentFrameName: string;
      pageName: string;
    }): void {
      setFrameNameList(opts.frameNames);
      setFrameElementsByFrameName(opts.elementsByFrame);
      setCurrentFrameName(opts.currentFrameName);

      frameNameListRef.current = opts.frameNames;
      frameElementsByFrameNameRef.current = opts.elementsByFrame;

      for (const frameName of opts.frameNames) {
        framePageByFrameNameRef.current[frameName] = opts.pageName;
      }
    }

    loadFromUrlAndSession({
      applyLoadedState,
      recordMaxSuffixFromElements: (elements) =>
        recordMaxSuffixFromElements(elements, idMaxSuffixByComponentRef),
    });

    // Keep ID suffix counters aligned with any other pages present in session.
    rebuildIdCountersFromAllSessionPages((elements) =>
      recordMaxSuffixFromElements(elements, idMaxSuffixByComponentRef)
    );

    return () => {
      saver.current?.dispose();
      saver.current = null;
    };
  }, []);

  // Save on state changes (top only). Debounced write consolidates rapid edits.
  useEffect(function persistWhenStateChanges() {
    if (window.top !== window) return;
    saver.current?.trigger();
  }, [frameNameList, frameElementsByFrameName]);

  // Top window message dispatcher
  useEffect(function attachTopMessaging() {
    if (window.top !== window) return;

    const callbacks: TopWindowMessagingCallbacks = {
      onRemoveElement: (frameName, elementId, removedElement) => {
        removeElementFromFrame(elementId, frameName);
        if (removedElement && removedElement.isFrameOrContainer) {
          unregisterFrame(removedElement);
        }
      },
      onUpdateElementPosition: (frameName, elementId, xPercent, yPercent) => {
        updateElementPosition(elementId, xPercent, yPercent, frameName);
      },
      onRegisterFrame: (frameName) => {
        registerFrame(frameName);
      },
      onChildPageChanged: (frameName, pageName) => {
        // Child navigated: update the page mapping for this frame and load elements for that page.
        framePageByFrameNameRef.current[frameName] = pageName;

        const mergedParams = new URLSearchParams(sessionStorage.getItem("savedPageParams") || "");
        const urlParams = new URLSearchParams(window.location.search);
        for (const [key, value] of urlParams.entries()) mergedParams.set(key, value);

        const elementsParamForPage = mergedParams.get(`elements.${pageName}`);
        if (elementsParamForPage) {
          const elementsByFrameName = parseElementsParam(elementsParamForPage);
          const elementsForFrame = elementsByFrameName[frameName] || [];
          recordMaxSuffixFromElements(elementsForFrame, idMaxSuffixByComponentRef);
          replaceFrameElementsFromStorage(frameName, elementsForFrame);
        } else {
          replaceFrameElementsFromStorage(frameName, []);
        }

        // Sync the updated elements back into the child iframe explicitly.
        const iframeWindows = Array.from(window.frames) as Window[];
        const targetChildWindow = iframeWindows.find((win) => (win as any).name === frameName);
        if (targetChildWindow) {
          postSyncFrame(targetChildWindow, frameName, {
            [frameName]: frameElementsByFrameNameRef.current[frameName] || [],
          });
        }
      },
    };

    const detach = attachTopWindowMessaging(callbacks);
    return () => detach();
  }, []);

  // Child window: receive sync and announce ready
  useEffect(function attachChildMessaging() {
    const isChildWindow = window.parent !== window || Boolean(window.opener);
    if (!isChildWindow) return;

    const callbacks: ChildWindowMessagingCallbacks = {
      onApplySyncedElements: (elementsByFrame) => {
        frameElementsByFrameNameRef.current = {
          ...frameElementsByFrameNameRef.current,
          ...elementsByFrame,
        };
        syncReactStateFromRefs();
      },
    };

    const detach = attachChildWindowMessaging(callbacks);
    return () => detach();
  }, []);

  // Child window: notify parent when internal page changes
  useEffect(function attachChildPageNotifier() {
    if (window.top === window) return;

    function getChildPageName(): string {
      const normalizedPath = window.location.pathname.replace(/\/+$/, "");
      const frameRootPath = `/frame/${(window as any).name}`;
      if (!normalizedPath.startsWith(frameRootPath)) return DEFAULT_PAGE_NAME;

      const remainder = normalizedPath.slice(frameRootPath.length);
      if (remainder === "") return DEFAULT_PAGE_NAME;
      if (remainder.startsWith("/")) return decodeURIComponent(remainder.slice(1));
      return DEFAULT_PAGE_NAME;
    }

    const detach = attachChildPageChangeNotifier(getChildPageName);
    return () => detach();
  }, []);

  const containerRefs = containerRefsRef.current;

  return (
    <FrameContext.Provider
      value={{
        currentFrameName,
        setCurrentFrameName,
        frameNameList,
        replaceFrameElements,
        registerFrame,
        unregisterFrame,
        addElementToCurrentFrame,
        removeElementFromFrame,
        updateElementPosition,
        frameElementsByFrameName,
        containerRefs,
      }}
    >
      {children}
    </FrameContext.Provider>
  );
}

export function useFrame(): FrameContextValue {
  const context = useContext(FrameContext);
  if (!context) throw new Error("useFrame must be used within FrameManager");
  return context;
}
