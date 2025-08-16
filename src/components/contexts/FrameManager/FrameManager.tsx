"use client";

import React,
{
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  ReactNode,
  createRef,
  RefObject,
} from "react";

import { installTopMessageHandler, sendSyncFrameToChild, getKnownChildWindowInfoByFrameName } from "./frameMessaging";
import { loadInitialState, persistStateToUrlAndSession } from "./framePersistence";

export const POST_MESSAGE_LOG_ENABLED = true;

export type FrameElement = {
  id: string;
  componentName: string;
  xPercent: number;
  yPercent: number;
  isFrameOrContainer: boolean;
  customProps?: Record<string, any>;
};

export type PageState = { elements: FrameElement[] };

export type FrameNode = {
  name: string;
  pages: Record<string, PageState>;
  createdOnPage: string;
};

export type AppState = {
  rootPage: string;
  frames: Record<string, FrameNode>;
  frameOrder: string[];
  currentFrame: string;
};

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
  getElementsForFrameAtPage: (frameName: string, pageName: string) => FrameElement[];
  rootPageName: string;
  getFrameCreatedOnPage: (frameName: string) => string;
  defaultFrameName: string;
}

const DEFAULT_FRAME_NAME = "TopFrame";
const DEFAULT_PAGE_NAME = "HomePage";

const FrameContext = createContext<FrameContextValue | undefined>(undefined);

function getMaxSuffixFromId(idValue: string): number {
  const parts = idValue.split("-");
  const lastPart = parts[parts.length - 1] || "";
  const parsed = parseInt(lastPart, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function rebuildIdCountersFromState(appState: AppState): Record<string, number> {
  const counters: Record<string, number> = {};
  for (const frameName of Object.keys(appState.frames)) {
    const frameNode = appState.frames[frameName];
    for (const pageName of Object.keys(frameNode.pages || {})) {
      const elements = frameNode.pages[pageName]?.elements || [];
      for (const element of elements) {
        const current = counters[element.componentName] || 0;
        const suffix = getMaxSuffixFromId(element.id);
        counters[element.componentName] = Math.max(current, suffix);
      }
    }
  }
  return counters;
}

function pageNameFromPath(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] === "frame") return segments[2] || DEFAULT_PAGE_NAME;
  return segments[0] || DEFAULT_PAGE_NAME;
}




export function FrameManager({ children }: { children: ReactNode }) {
  const isTopWindow = typeof window !== "undefined" && window.top === window && !window.opener;

  const [applicationState, setApplicationState] = useState<AppState>({
    rootPage: DEFAULT_PAGE_NAME,
    frames: {
      [DEFAULT_FRAME_NAME]: {
        name: DEFAULT_FRAME_NAME,
        pages: { [DEFAULT_PAGE_NAME]: { elements: [] } },
        createdOnPage: DEFAULT_PAGE_NAME,
      },
    },
    frameOrder: [DEFAULT_FRAME_NAME],
    currentFrame: DEFAULT_FRAME_NAME,
  });

  const hasHydratedRef = useRef(false);
  const idCountersByComponentRef = useRef<Record<string, number>>({});
  const containerRefsRef = useRef<Record<string, RefObject<HTMLDivElement | null>>>({
    [DEFAULT_FRAME_NAME]: createRef<HTMLDivElement | null>(),
  });
  const lastRequestedPageByFrameRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!isTopWindow) return;
    const loaded = loadInitialState(DEFAULT_FRAME_NAME, DEFAULT_PAGE_NAME);
    const initial = loaded || applicationState;
    const derivedPage = pageNameFromPath(window.location.pathname);
    const initialWithPage: AppState = { ...initial, rootPage: derivedPage, currentFrame: DEFAULT_FRAME_NAME };
    setApplicationState(initialWithPage);
    idCountersByComponentRef.current = rebuildIdCountersFromState(initialWithPage);
    for (const frameName of Object.keys(initialWithPage.frames)) {
      if (!containerRefsRef.current[frameName]) {
        containerRefsRef.current[frameName] = createRef<HTMLDivElement | null>();
      }
    }
    hasHydratedRef.current = true;
  }, []);

  useEffect(() => {
    if (!hasHydratedRef.current) return;
    if (!isTopWindow) return;
    persistStateToUrlAndSession(applicationState);
  }, [isTopWindow, applicationState]);

  useEffect(() => {
    const onLocationChange = () => {
      const nextPage = pageNameFromPath(window.location.pathname);
      setApplicationState((prev) => {
        if (prev.rootPage === nextPage) return prev;
        return { ...prev, rootPage: nextPage, currentFrame: DEFAULT_FRAME_NAME };
      });
    };

    const origPush = window.history.pushState;
    const origReplace = window.history.replaceState;

    (window.history as any).pushState = function (...args: any[]) {
      const ret = origPush.apply(this, args as any);
      window.dispatchEvent(new Event("locationchange"));
      return ret;
    };

    (window.history as any).replaceState = function (...args: any[]) {
      const ret = origReplace.apply(this, args as any);
      window.dispatchEvent(new Event("locationchange"));
      return ret;
    };

    window.addEventListener("popstate", onLocationChange);
    window.addEventListener("locationchange", onLocationChange);
    onLocationChange();

    return () => {
      window.history.pushState = origPush;
      window.history.replaceState = origReplace;
      window.removeEventListener("popstate", onLocationChange);
      window.removeEventListener("locationchange", onLocationChange);
    };
  }, []);

  useEffect(() => {
    setApplicationState((prev) => {
      if (prev.currentFrame !== DEFAULT_FRAME_NAME) return { ...prev, currentFrame: DEFAULT_FRAME_NAME };
      return prev;
    });
  }, [applicationState.rootPage]);

  function ensureFrameExists(prev: AppState, frameName: string): AppState {
    if (prev.frames[frameName]) return prev;
    let pageKey = getKnownChildWindowInfoByFrameName(frameName)?.currentPage;
    if (pageKey === undefined) pageKey = "HomePage";
    const created: FrameNode = {
      name: frameName,
      pages: { [pageKey]: { elements: [] } },
      createdOnPage: pageNameFromPath(window.location.pathname),
    };
    const nextFrames = { ...prev.frames, [frameName]: created };
    const nextOrder = [...prev.frameOrder, frameName];
    const nextState: AppState = { ...prev, frames: nextFrames, frameOrder: nextOrder };
    if (!containerRefsRef.current[frameName]) {
      containerRefsRef.current[frameName] = createRef<HTMLDivElement | null>();
    }
    idCountersByComponentRef.current = rebuildIdCountersFromState(nextState);
    return nextState;
  }

  function setElementsForFrameAndCurrentPage(prev: AppState, frameName: string, elements: FrameElement[]): AppState {
    
    const pageKey = getCurrentPageFromFrameName(frameName)
    const source = prev.frames[frameName] || { name: frameName, pages: {}, createdOnPage: pageKey };
    const nextPages = { ...source.pages, [pageKey]: { elements } };
    const nextFrame: FrameNode = { ...source, pages: nextPages };
    const nextFrames = { ...prev.frames, [frameName]: nextFrame };
    const nextState: AppState = { ...prev, frames: nextFrames };
    idCountersByComponentRef.current = rebuildIdCountersFromState(nextState);
    return nextState;
  }

  function resolvePageKeyForFrame(externalFrameName: string): string {
    const remembered = lastRequestedPageByFrameRef.current[externalFrameName];
    if (remembered) return remembered;
    return externalFrameName === DEFAULT_FRAME_NAME ? applicationState.rootPage : DEFAULT_PAGE_NAME;
  }

  function buildFramePayloadForChild(externalFrameName: string, nextState: AppState): Record<string, FrameElement[]> {
    const node = nextState.frames[externalFrameName];
    if (!node) return { [externalFrameName]: [] };
    const pageKey = resolvePageKeyForFrame(externalFrameName);
    const elems = node.pages[pageKey]?.elements || [];
    return { [externalFrameName]: elems };
  }

  function updateElementPosition(
    elementId: string,
    xPercent: number,
    yPercent: number,
    frameName: string
  ) {
    setApplicationState((prev) => {
      const current = getElementsForFrame(prev, frameName);
      const updated = current.map((element) =>
        element.id === elementId ? { ...element, xPercent, yPercent } : element
      );
      const nextState = setElementsForFrameAndCurrentPage(prev, frameName, updated);
      // sendSyncFrameToChild(frameName, buildFramePayloadForChild(frameName));
      return nextState;
    });
  }

  function removeElementFromFrame(elementId: string, frameName: string) {
    setApplicationState((prev) => {
      const current = getElementsForFrame(prev, frameName);
      const remaining = current.filter((element) => element.id !== elementId);
      const nextState = setElementsForFrameAndCurrentPage(prev, frameName, remaining);
      // sendSyncFrameToChild(frameName, buildFramePayloadForChild(frameName));
      return nextState;
    });
  }

  function cascadeUnregister(frameId: string) {
    setApplicationState((previousState) => {
      const framesCopy = { ...previousState.frames };
      const frameIdsToDelete: string[] = [frameId];
      for (let index = 0; index < frameIdsToDelete.length; index++) {
        const currentFrameId = frameIdsToDelete[index];
        const currentFrameNode = framesCopy[currentFrameId];
        if (!currentFrameNode) continue;
        for (const pageName of Object.keys(currentFrameNode.pages)) {
          const pageElements = currentFrameNode.pages[pageName].elements || [];
          for (const pageElement of pageElements) {
            if (
              pageElement.isFrameOrContainer &&
              framesCopy[pageElement.id] &&
              !frameIdsToDelete.includes(pageElement.id)
            ) {
              frameIdsToDelete.push(pageElement.id);
            }
          }
        }
      }

      const keptFrames: Record<string, FrameNode> = {};
      for (const frameName of Object.keys(framesCopy)) {
        if (frameIdsToDelete.includes(frameName)) continue;
        const frameNode = framesCopy[frameName];
        const updatedPages: Record<string, PageState> = {};
        for (const pageName of Object.keys(frameNode.pages)) {
          const pageElements = frameNode.pages[pageName].elements || [];
          const filteredElements = pageElements.filter(
            (pageElement) => !frameIdsToDelete.includes(pageElement.id)
          );
          updatedPages[pageName] = { elements: filteredElements };
        }
        keptFrames[frameName] = { ...frameNode, pages: updatedPages };
      }

      const updatedFrameOrder = previousState.frameOrder.filter(
        (name) => !frameIdsToDelete.includes(name)
      );
      const updatedCurrentFrame = frameIdsToDelete.includes(previousState.currentFrame)
        ? DEFAULT_FRAME_NAME
        : previousState.currentFrame;

      for (const id of frameIdsToDelete) {
        delete containerRefsRef.current[id];
      }

      const nextState: AppState = {
        ...previousState,
        frames: keptFrames,
        frameOrder: updatedFrameOrder,
        currentFrame: updatedCurrentFrame,
      };

      idCountersByComponentRef.current = rebuildIdCountersFromState(nextState);
      return nextState;
    });
  }

  useEffect(() => {
    const isTop = typeof window !== "undefined" && window.top === window && !window.opener;
    if (!isTop) return;

    function getFramesForFrameName(externalFrameName: string, requestedPageName?: string) {
      if (requestedPageName) lastRequestedPageByFrameRef.current[externalFrameName] = requestedPageName;
      return buildFramePayloadForChild(externalFrameName,applicationState);
    }

    function registerFrameByName(externalFrameName: string) {
      setApplicationState((prev) => ensureFrameExists(prev, externalFrameName));
    }

    function unregisterFrameById(frameId: string) {
      cascadeUnregister(frameId);
    }

    const stop = installTopMessageHandler(
      (name, pageName) => getFramesForFrameName(name, pageName),
      registerFrameByName,
      updateElementPosition,
      removeElementFromFrame,
      unregisterFrameById
    );
    return stop;
  }, [applicationState]);

  function setCurrentFrameName(frameName: string): void {
    setApplicationState((prev) => ({ ...prev, currentFrame: frameName }));
  }

  function replaceFrameElements(frameName: string, elements: FrameElement[]): void {
    setApplicationState((prev) => setElementsForFrameAndCurrentPage(prev, frameName, [...elements]));
    // sendSyncFrameToChild(frameName, buildFramePayloadForChild(frameName));
  }

  function registerFrame(frameName: string): void {
    setApplicationState((prev) => {
      const next = ensureFrameExists(prev, frameName);
      // sendSyncFrameToChild(frameName, buildFramePayloadForChild(frameName));
      return { ...next, currentFrame: frameName };
    });
  }

  function getNextElementId(componentName: string): string {
    const current = idCountersByComponentRef.current[componentName] || 0;
    const next = current + 1;
    idCountersByComponentRef.current[componentName] = next;
    return `${componentName}-${next}`;
  }

  function addElementToCurrentFrame(
    componentName: string,
    isFrameOrContainer: boolean,
    customProps: Record<string, any> = {}
  ): string {
    const newId = getNextElementId(componentName);
    setApplicationState((prev) => {
      const frameName = prev.currentFrame;
      const current = getElementsForFrame(prev, frameName);
      const created: FrameElement = {
        id: newId,
        componentName,
        xPercent: 50,
        yPercent: 50,
        isFrameOrContainer,
        customProps,
      };
      const nextElements = [...current, created];
      const nextState = setElementsForFrameAndCurrentPage(prev, frameName, nextElements);
      sendSyncFrameToChild(frameName, buildFramePayloadForChild(frameName, nextState));
      return nextState;
    });
    return newId;
  }

  function unregisterFrame(frameToRemove: FrameElement): void {
    if (!frameToRemove.isFrameOrContainer) return;
    cascadeUnregister(frameToRemove.id);
  }

  function getElementsForFrameAtPage(frameName: string, pageName: string): FrameElement[] {
    const node = applicationState.frames[frameName];
    if (!node) return [];
    return node.pages[pageName]?.elements || [];
  }

  function getFrameCreatedOnPage(frameName: string): string {
    const node = applicationState.frames[frameName];
    return node ? node.createdOnPage : DEFAULT_PAGE_NAME;
  }

function getElementsForFrame(appState: AppState, frameName: string): FrameElement[] {
  const frameNode = appState.frames[frameName];
  if (!frameNode) return [];

  const pageKey = getCurrentPageFromFrameName(frameName)
  const pageState = frameNode.pages[pageKey] || { elements: [] };
  return pageState.elements || [];
}

function getCurrentPageFromFrameName(frameName: string): string {
    if (typeof window === "undefined") {
    return "HomePage";
    } else if (frameName === "TopFrame") {
      return pageNameFromPath(window.location.pathname);
    } else {
      return getKnownChildWindowInfoByFrameName(frameName)?.currentPage || "HomePage";
    }
}


  const frameNameList = applicationState.frameOrder;
  const currentFrameName = applicationState.currentFrame;
  const frameElementsByFrameName: Record<string, FrameElement[]> = {};
  for (const frameName of frameNameList) {
    frameElementsByFrameName[frameName] = getElementsForFrame(applicationState, frameName);
  }

  // useEffect(() => {

      
  // for (const frameName of frameNameList) {
  //   frameElementsByFrameName[frameName] = getElementsForFrame(applicationState, frameName);
  // }

  // }, [applicationState]);


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
        getElementsForFrameAtPage,
        rootPageName: applicationState.rootPage,
        getFrameCreatedOnPage,
        defaultFrameName: DEFAULT_FRAME_NAME,
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
