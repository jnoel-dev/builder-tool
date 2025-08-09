"use client";

import React, {
  createContext,
  useState,
  useContext,
  useRef,
  useEffect,
  ReactNode,
  createRef,
} from "react";

/* ===============================
   Constants and Types
   =============================== */

export const POST_MESSAGE_LOG_ENABLED = true;
const DEFAULT_FRAME_NAME = "TopFrame";

export interface FrameElement {
  id: string;
  componentName: string;
  xPercent: number;
  yPercent: number;
  isFrameOrContainer: boolean;
  customProps: Record<string, any>;
}

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
  containerRefs: Record<string, React.RefObject<HTMLDivElement | null>>;
}

const FrameContext = createContext<FrameContextValue | undefined>(undefined);

/* ===============================
   URL Serialization Utilities
   =============================== */

function parseElementsParam(elementsParam: string): Record<string, FrameElement[]> {
  const parsedMap: Record<string, FrameElement[]> = {};
  if (!elementsParam) return parsedMap;

  const frameEntries = elementsParam.split(";");
  for (const frameEntry of frameEntries) {
    if (!frameEntry) continue;

    const parts = frameEntry.split(":");
    const frameName = parts[0];
    const serializedList = parts[1] || "";

    if (!frameName) continue;

    const elementList: FrameElement[] = [];
    const elementEntries = serializedList.split("|");
    for (const elementEntry of elementEntries) {
      if (!elementEntry) continue;

      const fields = elementEntry.split(",");
      if (fields.length < 6) continue;

      const id = fields[0];
      const componentName = fields[1];
      const xPercent = Number(fields[2]) / 100;
      const yPercent = Number(fields[3]) / 100;
      const isFrameOrContainer = fields[4] === "true";

      let customProps: Record<string, any> = {};
      try {
        customProps = fields[5] ? JSON.parse(decodeURIComponent(fields[5])) : {};
      } catch {
        customProps = {};
      }

      elementList.push({
        id,
        componentName,
        xPercent,
        yPercent,
        isFrameOrContainer,
        customProps,
      });
    }

    parsedMap[frameName] = elementList;
  }

  return parsedMap;
}

function serializeElementsParam(mapByFrameName: Record<string, FrameElement[]>): string {
  const frameEntries: string[] = [];

  const frameNames = Object.keys(mapByFrameName);
  for (const frameName of frameNames) {
    const elements = mapByFrameName[frameName] || [];

    const serializedElements = elements.map((element) => {
      const roundedX = Math.round(element.xPercent * 100);
      const roundedY = Math.round(element.yPercent * 100);
      const encodedProps = encodeURIComponent(
        JSON.stringify(element.customProps || {})
      );
      return [
        element.id,
        element.componentName,
        roundedX,
        roundedY,
        element.isFrameOrContainer,
        encodedProps,
      ].join(",");
    });

    frameEntries.push(`${frameName}:${serializedElements.join("|")}`);
  }

  return frameEntries.join(";");
}

/* ===============================
   Small Helpers
   =============================== */

function isSameOrigin(event: MessageEvent): boolean {
  return event.origin === window.location.origin;
}

function findParentFrameName(
  childFrameId: string,
  elementsByFrameName: Record<string, FrameElement[]>
): string | null {
  const frameNames = Object.keys(elementsByFrameName);
  for (const frameName of frameNames) {
    const elements = elementsByFrameName[frameName] || [];
    const containsChild =
      elements.findIndex(
        (element) => element.isFrameOrContainer && element.id === childFrameId
      ) !== -1;
    if (containsChild) return frameName;
  }
  return null;
}

/* ===============================
   FrameManager (State and Basic APIs)
   =============================== */

export function FrameManager({ children }: { children: ReactNode }) {
  const [frameNameList, setFrameNameList] = useState<string[]>([DEFAULT_FRAME_NAME]);
  const [currentFrameName, setCurrentFrameName] = useState<string>(DEFAULT_FRAME_NAME);
  const [frameElementsByFrameName, setFrameElementsByFrameName] = useState<
    Record<string, FrameElement[]>
  >({ [DEFAULT_FRAME_NAME]: [] });

  const containerRefsRef = useRef<Record<string, React.RefObject<HTMLDivElement | null>>>({
    [DEFAULT_FRAME_NAME]: createRef<HTMLDivElement | null>(),
  });
  const containerRefs = containerRefsRef.current;

  // page ownership (which "page" each frame belongs to)
  const framePageByFrameNameRef = useRef<Record<string, string>>({});

  // id counters (not persisted; rebuilt from stored content on load)
  const idMaxSuffixByComponentRef = useRef<Record<string, number>>({});

  // snapshots for message handlers
  const latestElementsMapRef = useRef(frameElementsByFrameName);
  const latestFrameNameListRef = useRef(frameNameList);
  useEffect(() => {
    latestElementsMapRef.current = frameElementsByFrameName;
  }, [frameElementsByFrameName]);
  useEffect(() => {
    latestFrameNameListRef.current = frameNameList;
  }, [frameNameList]);

  // track frames that changed this pass to avoid clobbering
  const dirtyFrameNamesRef = useRef<Set<string>>(new Set());
  function markFrameDirty(frameName: string): void {
    dirtyFrameNamesRef.current.add(frameName);
  }

  function recordMaxSuffixFromElements(elementList: FrameElement[]): void {
    for (const element of elementList) {
      const parts = element.id.split("-");
      const maybeSuffix = parseInt(parts[parts.length - 1] || "0", 10);
      if (!Number.isFinite(maybeSuffix)) continue;

      const currentMax = idMaxSuffixByComponentRef.current[element.componentName] || 0;
      if (maybeSuffix > currentMax) {
        idMaxSuffixByComponentRef.current[element.componentName] = maybeSuffix;
      }
    }
  }

  function rebuildIdCountersFromAllSessionPages(): void {
    const savedRaw = sessionStorage.getItem("savedPageParams") || "";
    const params = new URLSearchParams(savedRaw);
    for (const [key, value] of params.entries()) {
      if (!key.startsWith("elements.")) continue;
      const parsedMap = parseElementsParam(value || "");
      const frameNames = Object.keys(parsedMap);
      for (const frameName of frameNames) {
        recordMaxSuffixFromElements(parsedMap[frameName]);
      }
    }
  }

  function replaceFrameElements(frameName: string, elements: FrameElement[]): void {
    setFrameElementsByFrameName((previous) => {
      return { ...previous, [frameName]: elements };
    });
    markFrameDirty(frameName);
  }

  function replaceFrameElementsFromStorage(frameName: string, elements: FrameElement[]): void {
    setFrameElementsByFrameName((previous) => {
      return { ...previous, [frameName]: elements };
    });
    // not marking dirty: reading should not cause saving
  }

  function registerFrame(frameName: string): void {
    setFrameNameList((previous) => {
      if (previous.includes(frameName)) return previous;
      return [...previous, frameName];
    });
    setCurrentFrameName(frameName);

    if (!containerRefsRef.current[frameName]) {
      containerRefsRef.current[frameName] = createRef<HTMLDivElement | null>();
    }

    const currentTopPageName = window.location.pathname.slice(1) || "HomePage";
    if (!framePageByFrameNameRef.current[frameName]) {
      const parentFrameName = findParentFrameName(frameName, latestElementsMapRef.current);
      const inheritedPageName = parentFrameName
        ? framePageByFrameNameRef.current[parentFrameName]
        : undefined;
      framePageByFrameNameRef.current[frameName] = inheritedPageName || currentTopPageName;
    }
  }

  function addElementToCurrentFrame(
    componentName: string,
    isFrameOrContainer: boolean,
    customProps: Record<string, any> = {}
  ): string {
    const allElements = Object.values(latestElementsMapRef.current).flat();

    let maxSuffix = idMaxSuffixByComponentRef.current[componentName] || 0;
    for (const element of allElements) {
      if (element.componentName !== componentName) continue;
      const parts = element.id.split("-");
      const maybeSuffix = parseInt(parts[parts.length - 1] || "0", 10);
      if (Number.isFinite(maybeSuffix) && maybeSuffix > maxSuffix) {
        maxSuffix = maybeSuffix;
      }
    }
    const nextSuffix = maxSuffix + 1;
    idMaxSuffixByComponentRef.current[componentName] = nextSuffix;

    const newElementId = `${componentName}-${nextSuffix}`;
    const newElement: FrameElement = {
      id: newElementId,
      componentName,
      xPercent: 50,
      yPercent: 50,
      isFrameOrContainer,
      customProps,
    };

    setFrameElementsByFrameName((previous) => {
      const currentList = previous[currentFrameName] || [];
      const updatedList = [...currentList, newElement];
      return { ...previous, [currentFrameName]: updatedList };
    });
    markFrameDirty(currentFrameName);

    return newElementId;
  }

  function removeElementFromFrame(elementId: string, frameName: string): void {
    setFrameElementsByFrameName((previous) => {
      const currentList = previous[frameName] || [];
      const filtered = currentList.filter((element) => element.id !== elementId);
      return { ...previous, [frameName]: filtered };
    });
    markFrameDirty(frameName);
  }

  function updateElementPosition(
    elementId: string,
    xPercent: number,
    yPercent: number,
    frameName: string
  ): void {
    setFrameElementsByFrameName((previous) => {
      const currentList = previous[frameName] || [];
      const updatedList = currentList.map((element) => {
        if (element.id !== elementId) return element;
        return { ...element, xPercent, yPercent };
      });
      return { ...previous, [frameName]: updatedList };
    });
    markFrameDirty(frameName);
  }
  /* ===============================
     Unregister a frame (remove from all pages)
     =============================== */

  function unregisterFrame(frame: FrameElement): void {
    if (!frame.isFrameOrContainer) return;

    function buildMergedParams(): URLSearchParams {
      const sessionRaw = sessionStorage.getItem("savedPageParams") || "";
      const merged = new URLSearchParams(sessionRaw);
      const currentUrlParams = new URLSearchParams(window.location.search);
      for (const [key, value] of currentUrlParams.entries()) {
        merged.set(key, value);
      }
      return merged;
    }

    function buildChildrenGraphAcrossAllPages(allParams: URLSearchParams): Record<string, string[]> {
      const childrenByFrame: Record<string, string[]> = {};
      for (const [key, value] of allParams.entries()) {
        if (!key.startsWith("elements.")) continue;
        const perPageMap = parseElementsParam(value || "");
        for (const [frameName, elementList] of Object.entries(perPageMap)) {
          const childIds = (elementList || [])
            .filter((e) => e.isFrameOrContainer)
            .map((e) => e.id);
          if (!childrenByFrame[frameName]) childrenByFrame[frameName] = [];
          childrenByFrame[frameName].push(...childIds);
        }
      }
      return childrenByFrame;
    }

    function collectDescendantFrameIds(
      rootFrameId: string,
      childrenGraph: Record<string, string[]>
    ): Set<string> {
      const idsToRemove = new Set<string>();
      const stack: string[] = [rootFrameId];

      while (stack.length > 0) {
        const nextId = stack.pop() as string;
        if (idsToRemove.has(nextId)) continue;
        idsToRemove.add(nextId);

        const inMemoryChildren =
          (latestElementsMapRef.current[nextId] || [])
            .filter((e) => e.isFrameOrContainer)
            .map((e) => e.id);

        const persistedChildren = childrenGraph[nextId] || [];

        for (const childId of inMemoryChildren) stack.push(childId);
        for (const childId of persistedChildren) stack.push(childId);
      }

      return idsToRemove;
    }

    const mergedParams = buildMergedParams();
    const childrenGraph = buildChildrenGraphAcrossAllPages(mergedParams);
    const frameIdsToRemove = collectDescendantFrameIds(frame.id, childrenGraph);

    setFrameNameList((previous) => previous.filter((name) => !frameIdsToRemove.has(name)));

    for (const removedId of frameIdsToRemove) {
      delete containerRefsRef.current[removedId];
      delete framePageByFrameNameRef.current[removedId];
    }

    setFrameElementsByFrameName((previous) => {
      const nextMap: Record<string, FrameElement[]> = { ...previous };
      for (const removedId of frameIdsToRemove) {
        delete nextMap[removedId];
      }
      for (const [frameName, elementList] of Object.entries(nextMap)) {
        nextMap[frameName] = (elementList || []).filter(
          (e) => !(e.isFrameOrContainer && frameIdsToRemove.has(e.id))
        );
      }
      return nextMap;
    });

    setCurrentFrameName(DEFAULT_FRAME_NAME);

    const paramsToWrite = mergedParams;
    const pageNames = new Set<string>();
    for (const key of paramsToWrite.keys()) {
      if (key.startsWith("frames.") || key.startsWith("elements.")) {
        const pageName = key.split(".")[1];
        if (pageName) pageNames.add(pageName);
      }
    }

    for (const pageName of pageNames) {
      const framesKey = `frames.${pageName}`;
      const elementsKey = `elements.${pageName}`;
      const elementsRaw = paramsToWrite.get(elementsKey) || "";
      const mapByFrame = parseElementsParam(elementsRaw);

      for (const removedId of frameIdsToRemove) {
        delete mapByFrame[removedId];
      }
      for (const [frameName, elementList] of Object.entries(mapByFrame)) {
        mapByFrame[frameName] = (elementList || []).filter(
          (e) => !(e.isFrameOrContainer && frameIdsToRemove.has(e.id))
        );
      }

      const remainingFrameNames = Object.keys(mapByFrame);

      if (remainingFrameNames.length === 0) {
        paramsToWrite.delete(framesKey);
        paramsToWrite.delete(elementsKey);
      } else {
        // always keep TopFrame listed, even if empty
        if (!remainingFrameNames.includes(DEFAULT_FRAME_NAME)) {
          remainingFrameNames.unshift(DEFAULT_FRAME_NAME);
          if (!mapByFrame[DEFAULT_FRAME_NAME]) mapByFrame[DEFAULT_FRAME_NAME] = [];
        }
        paramsToWrite.set(framesKey, remainingFrameNames.join(","));
        paramsToWrite.set(elementsKey, serializeElementsParam(mapByFrame));
      }
    }

    sessionStorage.setItem("savedPageParams", paramsToWrite.toString());
    const newUrl =
      `${window.location.origin}${window.location.pathname}?` +
      `${paramsToWrite.toString()}${window.location.hash}`;
    window.history.replaceState(null, "", newUrl);
  }

  /* ===============================
     Message Handler: iframe page changed
     =============================== */

  function handleFramePageChanged(event: MessageEvent): void {
    const data = event.data as Record<string, any>;
    const isValid =
      data &&
      data.type === "framePageChanged" &&
      typeof data.frameName === "string" &&
      typeof data.pageName === "string";

    if (!isValid) return;

    const frameName = data.frameName as string;
    const pageName = data.pageName as string;

    if (!latestFrameNameListRef.current.includes(frameName)) return;

    framePageByFrameNameRef.current[frameName] = pageName;

    const sessionRaw = sessionStorage.getItem("savedPageParams") || "";
    const sessionParams = new URLSearchParams(sessionRaw);
    const elementsRawForPage = sessionParams.get(`elements.${pageName}`);

    if (elementsRawForPage) {
      const mapByFrame = parseElementsParam(elementsRawForPage);
      const elementsForFrame = mapByFrame[frameName] || [];
      recordMaxSuffixFromElements(elementsForFrame);
      replaceFrameElementsFromStorage(frameName, elementsForFrame);
    } else {
      replaceFrameElementsFromStorage(frameName, []);
    }

    const iframeWindows = Array.from(window.frames) as Window[];
    const targetWindow = iframeWindows.find((w) => (w as any).name === frameName);

    if (targetWindow) {
      const payloadForChild: Record<string, FrameElement[]> = {
        [frameName]: latestElementsMapRef.current[frameName] || [],
      };
      // IMPORTANT: use "*" so cross-domain children receive the sync
      targetWindow.postMessage(
        { type: "syncFrame", frameName, elements: payloadForChild },
        "*"
      );
    }
  }

  /* ===============================
     Load from URL on mount (top only)
     =============================== */

  useEffect(() => {
    if (window.top !== window) return;

    const currentPageName = window.location.pathname.slice(1) || "HomePage";

    const urlParams = new URLSearchParams(window.location.search);
    const sessionParams = new URLSearchParams(
      sessionStorage.getItem("savedPageParams") || ""
    );

    const framesParamFromUrl =
      urlParams.get(`frames.${currentPageName}`) ??
      sessionParams.get(`frames.${currentPageName}`);
    const elementsParamFromUrl =
      urlParams.get(`elements.${currentPageName}`) ??
      sessionParams.get(`elements.${currentPageName}`);

    if (!framesParamFromUrl || !elementsParamFromUrl) {
      const mergedNoop = new URLSearchParams(sessionParams.toString());
      for (const [key, value] of urlParams.entries()) {
        mergedNoop.set(key, value);
      }
      sessionStorage.setItem("savedPageParams", mergedNoop.toString());
      return;
    }

    const parsedFrameNames = framesParamFromUrl.split(",").filter(Boolean);
    const parsedElementsMap = parseElementsParam(elementsParamFromUrl);

    if (!parsedFrameNames.includes(DEFAULT_FRAME_NAME)) {
      parsedFrameNames.unshift(DEFAULT_FRAME_NAME);
    }
    if (!parsedElementsMap[DEFAULT_FRAME_NAME]) {
      parsedElementsMap[DEFAULT_FRAME_NAME] = [];
    }

    setFrameNameList(parsedFrameNames.length ? parsedFrameNames : [DEFAULT_FRAME_NAME]);
    setFrameElementsByFrameName(
      Object.keys(parsedElementsMap).length
        ? parsedElementsMap
        : { [DEFAULT_FRAME_NAME]: [] }
    );

    if (parsedFrameNames.length) {
      setCurrentFrameName(parsedFrameNames[0]);
    }

    for (const frameName of parsedFrameNames) {
      framePageByFrameNameRef.current[frameName] = currentPageName;
    }

    for (const frameName of Object.keys(parsedElementsMap)) {
      recordMaxSuffixFromElements(parsedElementsMap[frameName]);
    }
    rebuildIdCountersFromAllSessionPages();

    const merged = new URLSearchParams(sessionParams.toString());
    for (const [key, value] of urlParams.entries()) {
      merged.set(key, value);
    }
    sessionStorage.setItem("savedPageParams", merged.toString());
  }, []);

  /* ===============================
     Save to URL (top only, debounced)
     =============================== */

  const saveTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (window.top !== window) return;

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(() => {
      const currentTopPageName = window.location.pathname.slice(1) || "HomePage";

      const sessionParamsBase = new URLSearchParams(
        sessionStorage.getItem("savedPageParams") || ""
      );
      const urlParamsNow = new URLSearchParams(window.location.search);
      for (const [key, value] of urlParamsNow.entries()) {
        sessionParamsBase.set(key, value);
      }

      const paramsToWrite = new URLSearchParams(sessionParamsBase.toString());

      const touchedPageNames = new Set<string>();
      for (const frameName of latestFrameNameListRef.current) {
        const ownerPage =
          framePageByFrameNameRef.current[frameName] || currentTopPageName;
        touchedPageNames.add(ownerPage);
      }

      for (const pageName of touchedPageNames) {
        const existingElementsMap =
          parseElementsParam(sessionParamsBase.get(`elements.${pageName}`) || "");

        const unionElementsMap: Record<string, FrameElement[]> = { ...existingElementsMap };

        for (const frameName of latestFrameNameListRef.current) {
          const ownerPage =
            framePageByFrameNameRef.current[frameName] || currentTopPageName;
          if (ownerPage !== pageName) continue;

          if (dirtyFrameNamesRef.current.has(frameName)) {
            unionElementsMap[frameName] = latestElementsMapRef.current[frameName] || [];
          } else {
            if (!(frameName in unionElementsMap)) {
              unionElementsMap[frameName] = [];
            }
          }
        }

        if (!(DEFAULT_FRAME_NAME in unionElementsMap)) {
          unionElementsMap[DEFAULT_FRAME_NAME] = [];
        }

        const frameNamesForPage = Object.keys(unionElementsMap);
        const hasTopFrame = frameNamesForPage.includes(DEFAULT_FRAME_NAME);
        if (!hasTopFrame) {
          frameNamesForPage.unshift(DEFAULT_FRAME_NAME);
        } else {
          const topIndex = frameNamesForPage.indexOf(DEFAULT_FRAME_NAME);
          if (topIndex > 0) {
            frameNamesForPage.splice(topIndex, 1);
            frameNamesForPage.unshift(DEFAULT_FRAME_NAME);
          }
        }

        paramsToWrite.set(`frames.${pageName}`, frameNamesForPage.join(","));
        paramsToWrite.set(
          `elements.${pageName}`,
          serializeElementsParam(unionElementsMap)
        );
      }

      dirtyFrameNamesRef.current.clear();

      sessionStorage.setItem("savedPageParams", paramsToWrite.toString());
      const newUrl =
        `${window.location.origin}${window.location.pathname}?` +
        `${paramsToWrite.toString()}${window.location.hash}`;
      window.history.replaceState(null, "", newUrl);
    }, 140);

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [frameNameList, frameElementsByFrameName]);
  /* ===============================
     Remaining Message Handlers
     =============================== */

  function handleRemoveMessage(event: MessageEvent): void {
    if (!isSameOrigin(event)) return;

    const data = event.data as Record<string, any>;
    const isValid =
      data &&
      data.type === "removeElement" &&
      typeof data.elementId === "string" &&
      typeof data.frameName === "string";

    if (!isValid) return;

    const elementId = data.elementId as string;
    const frameName = data.frameName as string;
    const element = data.element as FrameElement | undefined;

    removeElementFromFrame(elementId, frameName);
    if (element && element.isFrameOrContainer) {
      unregisterFrame(element);
    }

    if (window.opener && window.top === window) {
      window.opener.postMessage(event.data, window.location.origin);
    }
  }

  function handlePositionMessage(event: MessageEvent): void {
    if (!isSameOrigin(event)) return;

    const data = event.data as Record<string, any>;
    const isValid =
      data &&
      data.type === "updateElementPosition" &&
      typeof data.elementId === "string" &&
      typeof data.frameName === "string" &&
      typeof data.xPercent === "number" &&
      typeof data.yPercent === "number";

    if (!isValid) return;

    updateElementPosition(
      data.elementId as string,
      data.xPercent as number,
      data.yPercent as number,
      data.frameName as string
    );

    if (window.opener && window.top === window) {
      window.opener.postMessage(event.data, window.location.origin);
    }
  }

  function handleFrameAdded(event: MessageEvent): void {
    if (!isSameOrigin(event)) return;

    const data = event.data as Record<string, any>;
    const isValid =
      data &&
      data.type === "frameAdded" &&
      typeof data.frameName === "string";

    if (!isValid) return;

    const frameName = data.frameName as string;
    if (frameName !== DEFAULT_FRAME_NAME) {
      registerFrame(frameName);
    }

    if (window.opener && window.top === window) {
      window.opener.postMessage(event.data, window.location.origin);
    }
  }

  function handleSyncFrame(event: MessageEvent): void {
    const data = event.data as Record<string, any>;
    const isValid =
      data &&
      data.type === "syncFrame" &&
      typeof data.frameName === "string" &&
      typeof data.elements === "object";

    if (!isValid) return;

    if (data.frameName !== (window as any).name) return;

    const elementsPayload = data.elements as Record<string, FrameElement[]>;
    setFrameElementsByFrameName((previous) => {
      return { ...previous, ...elementsPayload };
    });
  }


  /* ===============================
     Iframe: Watch Location and Notify Parent
     =============================== */

  useEffect(() => {
    if (window.top === window) return;

    function getCurrentPageNameFromChild(): string {
      const normalizedPath = window.location.pathname.replace(/\/+$/, "");
      const frameRootPath = `/frame/${(window as any).name}`;

      if (!normalizedPath.startsWith(frameRootPath)) return "HomePage";

      const remainder = normalizedPath.slice(frameRootPath.length);
      if (remainder === "") return "HomePage";
      if (remainder.startsWith("/")) return decodeURIComponent(remainder.slice(1));
      return "HomePage";
    }

    function notifyParentOfPageChange(): void {
      window.parent.postMessage(
        {
          type: "framePageChanged",
          frameName: (window as any).name,
          pageName: getCurrentPageNameFromChild(),
        },
        "*" 
      );
    }

    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    function wrappedPushState(
      this: History,
      state: any,
      title: string,
      url?: string | URL | null
    ) {
      const result = originalPushState.apply(this, [state, title, url as any]);
      notifyParentOfPageChange();
      return result;
    }

    function wrappedReplaceState(
      this: History,
      state: any,
      title: string,
      url?: string | URL | null
    ) {
      const result = originalReplaceState.apply(this, [state, title, url as any]);
      notifyParentOfPageChange();
      return result;
    }

    history.pushState = wrappedPushState as typeof history.pushState;
    history.replaceState = wrappedReplaceState as typeof history.replaceState;

    function handlePopState(): void {
      notifyParentOfPageChange();
    }

    function handleHashChange(): void {
      notifyParentOfPageChange();
    }

    notifyParentOfPageChange();
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("hashchange", handleHashChange);

    return () => {
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  /* ===============================
     Attach Listeners (top and child)
     =============================== */

  useEffect(() => {
    if (window.top !== window) return;
    window.addEventListener("message", handleFramePageChanged);
    return () => {
      window.removeEventListener("message", handleFramePageChanged);
    };
  }, []);

  useEffect(() => {
    if (window.top !== window) return;
    window.addEventListener("message", handleRemoveMessage);
    return () => {
      window.removeEventListener("message", handleRemoveMessage);
    };
  }, []);

  useEffect(() => {
    if (window.top !== window) return;
    window.addEventListener("message", handlePositionMessage);
    return () => {
      window.removeEventListener("message", handlePositionMessage);
    };
  }, []);

  useEffect(() => {
    if (window.top !== window) return;
    window.addEventListener("message", handleFrameAdded);
    return () => {
      window.removeEventListener("message", handleFrameAdded);
    };
  }, []);

  useEffect(() => {
    const isChildWindow = window.parent !== window || Boolean(window.opener);
    if (!isChildWindow) return;

    window.addEventListener("message", handleSyncFrame);

    const targetWindow = window.opener ?? window.parent;
    targetWindow.postMessage(
      { type: "iframeReady", frameName: (window as any).name },
      "*" 
    );

    return () => {
      window.removeEventListener("message", handleSyncFrame);
    };
  }, []);

  /* ===============================
     Provider
     =============================== */

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

/* ===============================
   Hook
   =============================== */

export function useFrame(): FrameContextValue {
  const context = useContext(FrameContext);
  if (!context) throw new Error("useFrame must be used within FrameManager");
  return context;
}
