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

import { installTopMessageHandler, sendSyncFrameToChild, getKnownChildWindowInfoByFrameName } from "./frameMessaging";
import { loadInitialState, persistStateToSession, setPersistenceKnownFrameOrigins, getFrameProperties } from "./framePersistence";
import { usePathname } from "next/navigation";

import { Snackbar, Alert } from '@mui/material';


import {
  AppState,
  FrameElement,
  PageState,
  FrameNode,
  DEFAULT_FRAME_NAME,
  DEFAULT_PAGE_NAME,
  getMaxSuffixFromId,
  rebuildIdCountersFromState,
  pageNameFromPath,
  getElementsForFrame,
  getCurrentPageFromFrameName,
  FrameProperties,
} from "./frameUtils";

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
  getElementsForFrameAtPage: (frameName: string, pageName: string) => FrameElement[];
  rootPageName: string;
  getFrameCreatedOnPage: (frameName: string) => string;
  defaultFrameName: string;
  receivedFirebaseResponse: boolean;
  firebaseID: string;
  knownFrameOrigins: string[];

}



const FrameContext = createContext<FrameContextValue | undefined>(undefined);

export function FrameManager({ children }: { children: ReactNode }) {
  const isTopWindow = typeof window !== "undefined" && window.top === window && !window.opener;
  const pathname = usePathname();
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
  const stateKey = React.useMemo(() => JSON.stringify(applicationState), [applicationState]);
  const idCountersByComponentRef = useRef<Record<string, number>>({});
  const containerRefsRef = useRef<Record<string, RefObject<HTMLDivElement | null>>>({
    [DEFAULT_FRAME_NAME]: createRef<HTMLDivElement | null>(),
  });
  const lastRequestedPageByFrameRef = useRef<Record<string, string>>({});
  const hasHydratedRef = useRef(false);
  const [shareNoticeOpen, setShareNoticeOpen] = useState(false);
  const [receivedFirebaseResponse, setReceivedFirebaseResponse] = useState(false);
  const [firebaseID, setFirebaseID] = React.useState<string>("");
  const [knownFrameOrigins, setKnownFrameOrigins] = React.useState<string[]>([]);





useEffect(() => {
  const segments = typeof window !== "undefined" ? window.location.pathname.split("/").filter(Boolean) : [];
  const firstSegment = segments[0] ?? "";
  const idFromUrl = /^[A-Za-z0-9]{20}$/.test(firstSegment) ? firstSegment : "";
  if (idFromUrl) setFirebaseID(idFromUrl);
  setKnownOriginsForFirebaseID(idFromUrl);

  let cancelled = false;

  (async () => {
    const isTopWindow = typeof window !== "undefined" && window === window.top && !window.opener;
    const firstFrameName = isTopWindow ? DEFAULT_FRAME_NAME : window.name;
    const loadedState = await loadInitialState(firstFrameName, DEFAULT_FRAME_NAME, DEFAULT_PAGE_NAME);

    const initialState = loadedState || applicationState;
    const derivedRootPage = pageNameFromPath(window.location.pathname);
    const initialWithPage: AppState = { ...initialState, rootPage: derivedRootPage, currentFrame: DEFAULT_FRAME_NAME };
    if (cancelled) return;

    setApplicationState(initialWithPage);
    setReceivedFirebaseResponse(true);
    idCountersByComponentRef.current = rebuildIdCountersFromState(initialWithPage);
    for (const frameName of Object.keys(initialWithPage.frames)) {
      if (!containerRefsRef.current[frameName]) {
        containerRefsRef.current[frameName] = createRef<HTMLDivElement | null>();
      }
    }
    hasHydratedRef.current = true;

    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      const existingRegistration = await navigator.serviceWorker.getRegistration();
      if (!existingRegistration) {
        await navigator.serviceWorker.register("/serviceWorker.js", { scope: "/" });
      }
    }
  })();

  return () => {
    cancelled = true;
  };
}, [setFirebaseID]);








useEffect(() => {
  if (!isTopWindow) return;
 if (!hasHydratedRef.current) return;

  (async () => {
    await persistStateToSession(applicationState);
    
    
    console.log("TEST HERE NOW")
  })();
}, [isTopWindow, stateKey]);



useEffect(() => {
  if (window !== window.top) return;
  const nextRootPageName = pageNameFromPath(pathname);
  setApplicationState(prev =>
    prev.rootPage === nextRootPageName
      ? prev
      : { ...prev, rootPage: nextRootPageName, currentFrame: DEFAULT_FRAME_NAME }
  );
}, [pathname]);

  function ensureFrameExists(previousState: AppState, frameName: string): AppState {
    if (previousState.frames[frameName]) return previousState;
    let pageKey = getKnownChildWindowInfoByFrameName(frameName)?.currentPage;
    if (pageKey === undefined) pageKey = "HomePage";
    const createdFrameNode: FrameNode = {
      name: frameName,
      pages: { [pageKey]: { elements: [] } },
      createdOnPage: pageNameFromPath(window.location.pathname),
    };
    const nextFrames = { ...previousState.frames, [frameName]: createdFrameNode };
    const nextOrder = [...previousState.frameOrder, frameName];
    const nextState: AppState = { ...previousState, frames: nextFrames, frameOrder: nextOrder };
    if (!containerRefsRef.current[frameName]) {
      containerRefsRef.current[frameName] = createRef<HTMLDivElement | null>();
    }
    idCountersByComponentRef.current = rebuildIdCountersFromState(nextState);
    return nextState;
  }


  










  function setElementsForFrameAndCurrentPage(previousState: AppState, frameName: string, elements: FrameElement[]): AppState {
    const pageKey = getCurrentPageFromFrameName(frameName);
    const sourceFrameNode = previousState.frames[frameName] || { name: frameName, pages: {}, createdOnPage: pageKey };
    const nextPages = { ...sourceFrameNode.pages, [pageKey]: { elements } };
    const nextFrameNode: FrameNode = { ...sourceFrameNode, pages: nextPages };
    const nextFrames = { ...previousState.frames, [frameName]: nextFrameNode };
    const nextState: AppState = { ...previousState, frames: nextFrames };
    idCountersByComponentRef.current = rebuildIdCountersFromState(nextState);
    return nextState;
  }

  function resolvePageKeyForFrame(externalFrameName: string): string {
    const rememberedPageName = lastRequestedPageByFrameRef.current[externalFrameName];
    if (rememberedPageName) return rememberedPageName;
    return externalFrameName === DEFAULT_FRAME_NAME ? applicationState.rootPage : DEFAULT_PAGE_NAME;
  }

  function buildFramePayloadForChild(
    externalFrameName: string,
    nextState: AppState
  ): Record<string, { elements: FrameElement[]; properties: Record<string, unknown> }> {
    const frameNode = nextState.frames[externalFrameName];
    if (!frameNode) {
      return { [externalFrameName]: { elements: [], properties: {} } };
    }

    const pageKey = resolvePageKeyForFrame(externalFrameName);
    const elements = frameNode.pages[pageKey]?.elements ?? [];
    const properties = frameNode.properties ?? {};

    return { [externalFrameName]: { elements, properties } };
  }


  function updateElementPosition(elementId: string, xPercent: number, yPercent: number, frameName: string) {
    setApplicationState((previousState) => {
      const currentElements = getElementsForFrame(previousState, frameName);
      const updatedElements = currentElements.map((element) =>
        element.id === elementId ? { ...element, xPercent, yPercent } : element
      );
      const nextState = setElementsForFrameAndCurrentPage(previousState, frameName, updatedElements);

      return nextState;
    });
  }

  function removeElementFromFrame(elementId: string, frameName: string) {
    setApplicationState((previousState) => {
      const currentElements = getElementsForFrame(previousState, frameName);
      const remainingElements = currentElements.filter((element) => element.id !== elementId);
      const nextState = setElementsForFrameAndCurrentPage(previousState, frameName, remainingElements);

      return nextState;
    });
  }

  function cascadeUnregister(frameIdentifier: string) {
    setApplicationState((previousState) => {
      const framesCopy = { ...previousState.frames };
      const frameIdentifiersToDelete: string[] = [frameIdentifier];

      for (let loopIndex = 0; loopIndex < frameIdentifiersToDelete.length; loopIndex++) {
        const currentFrameIdentifier = frameIdentifiersToDelete[loopIndex];
        const currentFrameNode = framesCopy[currentFrameIdentifier];
        if (!currentFrameNode) continue;
        for (const pageName of Object.keys(currentFrameNode.pages)) {
          const pageElements = currentFrameNode.pages[pageName].elements || [];
          for (const pageElement of pageElements) {
            if (pageElement.isFrameOrContainer && framesCopy[pageElement.id] && !frameIdentifiersToDelete.includes(pageElement.id)) {
              frameIdentifiersToDelete.push(pageElement.id);
            }
          }
        }
      }

      const keptFrames: Record<string, FrameNode> = {};
      for (const frameName of Object.keys(framesCopy)) {
        if (frameIdentifiersToDelete.includes(frameName)) continue;
        const frameNode = framesCopy[frameName];
        const updatedPages: Record<string, PageState> = {};
        for (const pageName of Object.keys(frameNode.pages)) {
          const pageElements = frameNode.pages[pageName].elements || [];
          updatedPages[pageName] = { elements: pageElements.filter((element) => !frameIdentifiersToDelete.includes(element.id)) };
        }
        keptFrames[frameName] = { ...frameNode, pages: updatedPages };
      }

      const nextState: AppState = {
        ...previousState,
        frames: keptFrames,
        frameOrder: previousState.frameOrder.filter((name) => !frameIdentifiersToDelete.includes(name)),
        currentFrame: frameIdentifiersToDelete.includes(previousState.currentFrame) ? DEFAULT_FRAME_NAME : previousState.currentFrame,
      };

      for (const frameIdentifierToDelete of frameIdentifiersToDelete) {
        delete containerRefsRef.current[frameIdentifierToDelete];
      }

      idCountersByComponentRef.current = rebuildIdCountersFromState(nextState);

      return nextState;
    });
  }

  useEffect(() => {
    const storedJson = sessionStorage.getItem("navigation:SPAreplace");
    if (storedJson) {
      try {
        const stored = JSON.parse(storedJson) as { url: string; windowName?: string };
        const namesMatch = (stored.windowName ?? "") === (window.name ?? "");
        const sameOrigin = new URL(stored.url, window.location.href).origin === window.location.origin;
        if (stored.url && namesMatch && sameOrigin) {
          sessionStorage.removeItem("navigation:SPAreplace");
          history.replaceState(null, "", stored.url);
          window.dispatchEvent(new PopStateEvent("popstate"));
        }
        setApplicationState((previousState) => {
          if (previousState.currentFrame !== DEFAULT_FRAME_NAME) return { ...previousState, currentFrame: DEFAULT_FRAME_NAME };
          return previousState;
        });
      } catch {}
    }


  }, [applicationState.rootPage]);

  useEffect(() => {
    if (window.top !== window || window.top.opener) return;

    function getFramesForFrameName(externalFrameName: string, requestedPageName?: string) {
      if (requestedPageName) lastRequestedPageByFrameRef.current[externalFrameName] = requestedPageName;
      return buildFramePayloadForChild(externalFrameName, applicationState);
    }

    function registerFrameByName(externalFrameName: string) {
          setApplicationState((previousState) => {
      const nextState = ensureFrameExists(previousState, externalFrameName);
      return { ...nextState, currentFrame: externalFrameName };
    });
    }

    function unregisterFrameById(frameIdentifier: string) {
      cascadeUnregister(frameIdentifier);
    }

    const stopMessageHandler = installTopMessageHandler(
      (frameName, pageName) => getFramesForFrameName(frameName, pageName),
      registerFrameByName,
      updateElementPosition,
      removeElementFromFrame,
      unregisterFrameById
    );
    return stopMessageHandler;
  }, [applicationState]);

  function setCurrentFrameName(frameName: string): void {
    setApplicationState((previousState) => ({ ...previousState, currentFrame: frameName }));
  }

  function replaceFrameElements(frameName: string, elements: FrameElement[]): void {
    setApplicationState((previousState) => setElementsForFrameAndCurrentPage(previousState, frameName, [...elements]));
  }

  function registerFrame(frameName: string): void {
    setApplicationState((previousState) => {
      const nextState = ensureFrameExists(previousState, frameName);
      return { ...nextState, currentFrame: frameName };
    });
  }

  function getNextElementId(componentName: string): string {
    const currentCount = idCountersByComponentRef.current[componentName] || 0;
    const nextCount = currentCount + 1;
    idCountersByComponentRef.current[componentName] = nextCount;
    return `${componentName}-${nextCount}`;
  }

  function addElementToCurrentFrame(
    componentName: string,
    isFrameOrContainer: boolean,
    customProps: Record<string, any> = {}
  ): string {
    const newElementId = getNextElementId(componentName);


    setApplicationState((previousState) => {
      const frameName = previousState.currentFrame;
      const currentElements = getElementsForFrame(previousState, frameName);
      const createdElement: FrameElement = {
        id: newElementId,
        componentName,
        xPercent: 50,
        yPercent: 50,
        isFrameOrContainer,
        customProps,
      };
      const nextState = setElementsForFrameAndCurrentPage(previousState, frameName, [...currentElements, createdElement]);
      sendSyncFrameToChild(frameName, buildFramePayloadForChild(frameName, nextState));
  
      return nextState;
    });
    return newElementId;
  }

  function unregisterFrame(frameToRemove: FrameElement): void {
    if (!frameToRemove.isFrameOrContainer) return;
    cascadeUnregister(frameToRemove.id);
  }

  function getElementsForFrameAtPage(frameName: string, pageName: string): FrameElement[] {
    const frameNode = applicationState.frames[frameName];
    if (!frameNode) return [];
    return frameNode.pages[pageName]?.elements || [];
  }

  function getFrameCreatedOnPage(frameName: string): string {
    const frameNode = applicationState.frames[frameName];
    return frameNode ? frameNode.createdOnPage : DEFAULT_PAGE_NAME;
  }

  function setKnownOriginsForFirebaseID(firebaseID: string): void {
    if (!firebaseID) return;

    const origins =
      process.env.NODE_ENV === "development"
        ? [
            `localhost:3000/${firebaseID}/`,
            `localhost:3000/${firebaseID}/frame/`,
            `localhost:3001/${firebaseID}/frame/`,
          ]
        : [
            `build.jonnoel.dev/${firebaseID}/`,
            `build.jonnoel.dev/${firebaseID}/frame/`,
            `frame.jonnoel.dev/${firebaseID}/frame/`,
          ];

    setKnownFrameOrigins(origins);
    setPersistenceKnownFrameOrigins(knownFrameOrigins);
    
  }






  const frameNameList = applicationState.frameOrder;
  const currentFrameName = applicationState.currentFrame;
  const frameElementsByFrameName: Record<string, FrameElement[]> = {};
  for (const frameName of frameNameList) {
    frameElementsByFrameName[frameName] = getElementsForFrame(applicationState, frameName);
  }

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
        receivedFirebaseResponse,
        firebaseID,
        knownFrameOrigins

      }}
    > 

      {children}
      <Snackbar
  open={shareNoticeOpen}
  autoHideDuration={3000}
  onClose={() => setShareNoticeOpen(false)}
  anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
>
  <Alert onClose={() => setShareNoticeOpen(false)} severity="success" variant="filled">
    Successfully loaded!
  </Alert>
</Snackbar>

    </FrameContext.Provider>
  );
}

export function useFrame(): FrameContextValue {
  const context = useContext(FrameContext);
  if (!context) throw new Error("useFrame must be used within FrameManager");
  return context;
}
