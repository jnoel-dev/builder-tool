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

export const POST_MESSAGE_LOG_ENABLED = true;

export interface FrameElement {
  id: string;
  componentName: string;
  xPercent: number;
  yPercent: number;
  isFrameOrContainer: boolean;
  customProps: Record<string, any>;
}

export interface FrameContextValue {
  currentFrame: string;
  setCurrentFrameName: (frameName: string) => void;
  frameList: string[];
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
  frameElementsMap: Record<string, FrameElement[]>;
  containerRefs: Record<string, React.RefObject<HTMLDivElement | null>>;
}

const DEFAULT_FRAME = "TopFrame";
const FrameContext = createContext<FrameContextValue | undefined>(undefined);



export function FrameManager({ children }: { children: ReactNode }) {
  const [frameList, setFrameNamesList] = useState<string[]>([DEFAULT_FRAME]);
  const [currentFrame, setCurrentFrameName] = useState<string>(DEFAULT_FRAME);
  const [frameElementsMap, setFrameElementsMap] = useState<
    Record<string, FrameElement[]>
  >({ [DEFAULT_FRAME]: [] });

  const refs = useRef<
    Record<string, React.RefObject<HTMLDivElement | null>>
  >({
    [DEFAULT_FRAME]: createRef<HTMLDivElement | null>(),
  });
  const containerRefs = refs.current;
const frameOriginPageMapRef = useRef<Record<string, string>>({});
const idMaxRef = useRef<Record<string, number>>({});




function parseElementsParam(elementsParam: string): Record<string, FrameElement[]> {
  const map: Record<string, FrameElement[]> = {};
  for (const entry of elementsParam.split(";")) {
    const [frame, list] = entry.split(":");
    if (!frame) continue;
    const elements: FrameElement[] = [];
    for (const item of (list || "").split("|")) {
      if (!item) continue;
      const parts = item.split(",");
      if (parts.length < 6) continue;
      const [id, componentName, xStr, yStr, isFrameStr, propsStr] = parts;
      const xPercent = Number(xStr) / 100;
      const yPercent = Number(yStr) / 100;
      const isFrameOrContainer = isFrameStr === "true";
      let customProps: Record<string, any> = {};
      try {
        customProps = propsStr ? JSON.parse(decodeURIComponent(propsStr)) : {};
      } catch {}
      elements.push({ id, componentName, xPercent, yPercent, isFrameOrContainer, customProps });
    }
    map[frame] = elements;
  }
  return map;
}


function serializeElementsParam(map: Record<string, FrameElement[]>): string {
  const frameEntries: string[] = [];
  for (const frameName of Object.keys(map)) {
    const elements = map[frameName] || [];
    const elementEntries = elements.map(e => {
      const x = Math.round(e.xPercent * 100);
      const y = Math.round(e.yPercent * 100);
      const props = encodeURIComponent(JSON.stringify(e.customProps || {}));
      return [e.id, e.componentName, x, y, e.isFrameOrContainer, props].join(",");
    });
    frameEntries.push(`${frameName}:${elementEntries.join("|")}`);
  }
  return frameEntries.join(";");
}








  



// load frames and elements from URL parameters
useEffect(() => {
  if (window.top !== window) return;

  const currentPage = window.location.pathname.slice(1) || "HomePage";
  const currentUrl = window.location.href;

  const lastSavedUrl = sessionStorage.getItem("lastSavedUrl");
  const landedUrl = sessionStorage.getItem("landedUrl");
  const savedSessionRaw = sessionStorage.getItem("savedPageParams") || "";
  let sessionParams = new URLSearchParams(savedSessionRaw);
  const urlParams = new URLSearchParams(window.location.search);

  const isSharedUrl = currentUrl !== lastSavedUrl && currentUrl !== landedUrl;

  // Shared URL handling — replace session storage entirely
  if (isSharedUrl) {
    const newSession = new URLSearchParams();
    for (const key of urlParams.keys()) {
      if (key.startsWith("frames.") || key.startsWith("elements.")) {
        const value = urlParams.get(key);
        if (value !== null) newSession.set(key, value);
      }
    }
    sessionParams = newSession;
    sessionStorage.setItem("savedPageParams", newSession.toString());
    sessionStorage.setItem("landedUrl", currentUrl);
  }



  const shouldPreferSavedParams =
    currentUrl === lastSavedUrl 

  let framesParam: string | null;
  let elementsParam: string | null;

  if (shouldPreferSavedParams) {
    framesParam = sessionParams.get(`frames.${currentPage}`);
    elementsParam = sessionParams.get(`elements.${currentPage}`);

    // Replace full URL with session version
    const fullUrl = `${window.location.origin}${window.location.pathname}?${sessionParams.toString()}${window.location.hash}`;
    window.history.replaceState(null, "", fullUrl);
  } else {
    framesParam = urlParams.get(`frames.${currentPage}`) || sessionParams.get(`frames.${currentPage}`);
    elementsParam = urlParams.get(`elements.${currentPage}`) || sessionParams.get(`elements.${currentPage}`);

    if (framesParam && elementsParam) {
      sessionParams.set(`frames.${currentPage}`, framesParam);
      sessionParams.set(`elements.${currentPage}`, elementsParam);
      sessionStorage.setItem("savedPageParams", sessionParams.toString());
    }
  }

  if (!framesParam || !elementsParam) return;

  const parsedFrames = framesParam.split(",");
  const parsedMap: Record<string, FrameElement[]> = {};

  for (const entry of elementsParam.split(";")) {
    const [frame, list] = entry.split(":");
    if (!frame) continue;

    const elementsList: FrameElement[] = [];

    for (const serializedItem of (list || "").split("|")) {
      if (!serializedItem) continue;
      const parts = serializedItem.split(",");
      if (parts.length < 6) continue;

      const [id, componentName, xString, yString, isFrameStr, propsStr] = parts;
      const xPercent = Number(xString) / 100;
      const yPercent = Number(yString) / 100;
      const isFrameOrContainer = isFrameStr === "true";
      let customProps: Record<string, any> = {};
      try {
        customProps = propsStr ? JSON.parse(decodeURIComponent(propsStr)) : {};
      } catch {}

      elementsList.push({
        id,
        componentName,
        xPercent,
        yPercent,
        isFrameOrContainer,
        customProps,
      });
    }

    parsedMap[frame] = elementsList;
  }

  setFrameNamesList(parsedFrames);
  setFrameElementsMap(parsedMap);
  if (parsedFrames.length) setCurrentFrameName(parsedFrames[0]);
  for (const name of parsedFrames) {
  frameOriginPageMapRef.current[name] = currentPage;
}
for (const frameName of Object.keys(parsedMap)) {
  recordMaxFromElements(parsedMap[frameName]);
}
rebuildIdMaxFromSession();


}, []);























  // save frames and elements to URL parameters
useEffect(() => {
  if (window.top !== window) return;

  const currentTopPage = window.location.pathname.slice(1) || "HomePage";

  const savedRaw = sessionStorage.getItem("savedPageParams") || "";
  const baseParams = new URLSearchParams(savedRaw);
  const currentParams = new URLSearchParams(window.location.search);
  for (const [k, v] of currentParams.entries()) baseParams.set(k, v);

  function parseFramesList(value: string | null): string[] {
    if (!value) return [];
    return value.split(",").filter(Boolean);
  }

  function parseElementsValue(value: string | null): Record<string, FrameElement[]> {
    if (!value) return {};
    const map: Record<string, FrameElement[]> = {};
    for (const entry of value.split(";")) {
      const [frame, list] = entry.split(":");
      if (!frame) continue;
      const arr: FrameElement[] = [];
      for (const item of (list || "").split("|")) {
        if (!item) continue;
        const parts = item.split(",");
        if (parts.length < 6) continue;
        const [id, componentName, xStr, yStr, isFrameStr, propsStr] = parts;
        const xPercent = Number(xStr) / 100;
        const yPercent = Number(yStr) / 100;
        const isFrameOrContainer = isFrameStr === "true";
        let customProps: Record<string, any> = {};
        try {
          customProps = propsStr ? JSON.parse(decodeURIComponent(propsStr)) : {};
        } catch {}
        arr.push({ id, componentName, xPercent, yPercent, isFrameOrContainer, customProps });
      }
      map[frame] = arr;
    }
    return map;
  }

  function serializeElementsValue(map: Record<string, FrameElement[]>): string {
    const frameEntries: string[] = [];
    for (const frameName of Object.keys(map)) {
      const elements = map[frameName] || [];
      const elementEntries = elements.map(e => {
        const x = Math.round(e.xPercent * 100);
        const y = Math.round(e.yPercent * 100);
        const props = encodeURIComponent(JSON.stringify(e.customProps || {}));
        return [e.id, e.componentName, x, y, e.isFrameOrContainer, props].join(",");
      });
      frameEntries.push(`${frameName}:${elementEntries.join("|")}`);
    }
    return frameEntries.join(";");
  }

function collectReachableFrames(
  root: string,
  byFrame: Record<string, FrameElement[]>
): Set<string> {
  const seen = new Set<string>();
  const stack = [root];
  while (stack.length) {
    const f = stack.pop() as string;
    if (seen.has(f)) continue;
    seen.add(f);
    const els = byFrame[f] || [];
    for (const el of els) {
      if (el.isFrameOrContainer) stack.push(el.id);
    }
  }
  return seen;
}



  const updated = new URLSearchParams(baseParams.toString());

  const touchedPages = new Set<string>();
  for (const frameName of frameList) {
    const pageName = frameOriginPageMapRef.current[frameName] || currentTopPage;
    touchedPages.add(pageName);
  }

  for (const pageName of touchedPages) {
    const existingFrames = new Set(parseFramesList(baseParams.get(`frames.${pageName}`)));
    const existingElementsMap = parseElementsValue(baseParams.get(`elements.${pageName}`));

    for (const frameName of frameList) {
      const mapped = frameOriginPageMapRef.current[frameName] || currentTopPage;
      if (mapped !== pageName) continue;
      existingElementsMap[frameName] = frameElementsMap[frameName] || [];
      existingFrames.add(frameName);
    }

const reachable = collectReachableFrames(DEFAULT_FRAME, existingElementsMap);

const owners = new Set<string>();
for (const fname of frameList) {
  const mapped = frameOriginPageMapRef.current[fname] || currentTopPage;
  if (mapped === pageName) owners.add(fname);
}

const keep = new Set<string>([...reachable, ...owners]);

const filtered: Record<string, FrameElement[]> = {};
for (const fname of keep) {
  filtered[fname] = existingElementsMap[fname] || [];
}

updated.set(`frames.${pageName}`, Array.from(keep).join(","));
updated.set(`elements.${pageName}`, serializeElementsValue(filtered));


  }

  sessionStorage.setItem("savedPageParams", updated.toString());
  const newUrl = `${window.location.origin}${window.location.pathname}?${updated.toString()}${window.location.hash}`;
  window.history.replaceState(null, "", newUrl);
}, [frameList, frameElementsMap]);








function recordMaxFromElements(elements: FrameElement[]) {
  for (const el of elements) {
    const parts = el.id.split("-");
    const suffix = parseInt(parts[parts.length - 1] || "0", 10);
    if (!Number.isFinite(suffix)) continue;
    const current = idMaxRef.current[el.componentName] || 0;
    if (suffix > current) idMaxRef.current[el.componentName] = suffix;
  }
}

function rebuildIdMaxFromSession() {
  const savedRaw = sessionStorage.getItem("savedPageParams") || "";
  const params = new URLSearchParams(savedRaw);
  for (const [key, value] of params.entries()) {
    if (!key.startsWith("elements.")) continue;
    const maps = parseElementsParam(value || "");
    for (const frameName of Object.keys(maps)) {
      recordMaxFromElements(maps[frameName]);
    }
  }
}




useEffect(() => {
  if (window.top === window) return;

function getCurrentPageName(): string {
  const pathname = window.location.pathname.replace(/\/+$/, "");
  const frameRoot = `/frame/${window.name}`;
  if (!pathname.startsWith(frameRoot)) return "HomePage";
  const remainder = pathname.slice(frameRoot.length);
  if (remainder === "") return "HomePage";
  if (remainder.startsWith("/")) return decodeURIComponent(remainder.slice(1));
  return "HomePage";
}



  function sendPageChanged() {
    window.parent.postMessage(
      {
        type: "framePageChanged",
        frameName: window.name,
        pageName: getCurrentPageName(),
      },
      "*"
    );
  }

  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  function wrappedPushState(this: History, state: any, title: string, url?: string | URL | null) {
    const result = originalPushState.apply(this, [state, title, url as any]);
    sendPageChanged();
    return result;
  }

  function wrappedReplaceState(this: History, state: any, title: string, url?: string | URL | null) {
    const result = originalReplaceState.apply(this, [state, title, url as any]);
    sendPageChanged();
    return result;
  }

  history.pushState = wrappedPushState as typeof history.pushState;
  history.replaceState = wrappedReplaceState as typeof history.replaceState;

  function handlePopState() {
    sendPageChanged();
  }

  function handleHashChange() {
    sendPageChanged();
  }

  sendPageChanged();
  window.addEventListener("popstate", handlePopState);
  window.addEventListener("hashchange", handleHashChange);

  return () => {
    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;
    window.removeEventListener("popstate", handlePopState);
    window.removeEventListener("hashchange", handleHashChange);
  };
}, []);








function handleFramePageChanged(event: MessageEvent) {
  const data = event.data as Record<string, any>;
  if (data?.type !== "framePageChanged" || !data.frameName || !data.pageName) return;

  frameOriginPageMapRef.current[data.frameName] = data.pageName;



  const savedRaw = sessionStorage.getItem("savedPageParams") || "";
  const sessionParams = new URLSearchParams(savedRaw);
  const elementsParam = sessionParams.get(`elements.${data.pageName}`);

  if (elementsParam) {
    const parsedMap = parseElementsParam(elementsParam);
    const next = parsedMap[data.frameName] || [];
    recordMaxFromElements(next);
    replaceFrameElements(data.frameName, next);
  } else {
    replaceFrameElements(data.frameName, []);
  }

  const frames = Array.from(window.frames) as Window[];
  const target = frames.find(f => (f as any).name === data.frameName);
  if (target) {
    const payload = { [data.frameName]: frameElementsMap[data.frameName] || [] };
    target.postMessage({ type: "syncFrame", frameName: data.frameName, elements: payload }, "*");
  }
}






function handleRemoveMessage(event: MessageEvent) {
  const data = event.data as Record<string, any>;
  if (data?.type !== "removeElement") return;

  const { elementId, frameName, element } = data;
  if (!elementId || !frameName) return;

  if (POST_MESSAGE_LOG_ENABLED) {
    console.log(
      `[PostMessage Receive] removeElement` +
        ` | frameName: ${frameName}` +
        ` | elementId: ${elementId}`
    );
  }

  removeElementFromFrame(elementId, frameName);
  if (element?.isFrameOrContainer) {
    unregisterFrame(element);
  }

 
  if (window.opener && window.top === window) {
    if (POST_MESSAGE_LOG_ENABLED) {
      console.log(
        `[PostMessage Forward] removeElement → opener` +
          ` | from: ${window.name}` +
          ` | to: TopFrame`
      );
    }

    window.opener.postMessage(event.data, "*");
  }
}
useEffect(() => {
  if (window.top !== window) return;
  window.addEventListener("message", handleFramePageChanged);
  return () => window.removeEventListener("message", handleFramePageChanged);
}, []);


  useEffect(() => {
    if (window.top !== window) return;

    window.addEventListener("message", handleRemoveMessage);
    return () => window.removeEventListener("message", handleRemoveMessage);
  }, [frameElementsMap]);

  // listen for updateElementPosition messages and adjust positions
function handlePositionMessage(event: MessageEvent) {
  
  const data = event.data as Record<string, any>;
  if (data?.type !== "updateElementPosition") return;

  const { elementId, frameName, xPercent, yPercent } = data;
  if (!elementId || !frameName) return;

  if (POST_MESSAGE_LOG_ENABLED) {
    console.log(
      `[PostMessage Receive] updateElementPosition` +
        ` | frameName: ${frameName}` +
        ` | elementId: ${elementId}` +
        ` | x: ${xPercent}` +
        ` | y: ${yPercent}`
    );
  }

  updateElementPosition(elementId, xPercent, yPercent, frameName);


  if (window.opener && window.top === window) {
    if (POST_MESSAGE_LOG_ENABLED) {
      console.log(
        `[PostMessage Forward] updateElementPosition → opener` +
          ` | from: ${window.name}` +
          ` | to: TopFrame`
      );
    }

    window.opener.postMessage(event.data, "*");
  }
}


  useEffect(() => {
    if (window.top !== window) return;
    
    window.addEventListener("message", handlePositionMessage);
    return () => window.removeEventListener("message", handlePositionMessage);
  }, []);

  // listen for syncFrame messages to replace the entire elements map
  function handleSyncFrame(event: MessageEvent) {
    const data = event.data as Record<string, any>;
    if (data?.type !== "syncFrame" || data.frameName !== window.name) return;
    if (POST_MESSAGE_LOG_ENABLED) {
      console.log(
        `[PostMessage Receive] syncFrame` +
        ` | frameName: ${data.frameName}`
      );
    }
    setFrameElementsMap(data.elements);
  }

  useEffect(() => {
    const isChild = window.parent !== window || Boolean(window.opener);
    if (!isChild) return;
    window.addEventListener("message", handleSyncFrame);
    // this ensures iframe or popup is fully loaded before sending iframeReady
    const targetWindow = window.opener ?? window.parent;
    targetWindow.postMessage({ type: "iframeReady", frameName: window.name }, "*");
    if (POST_MESSAGE_LOG_ENABLED) {
      console.log(
        `[PostMessage Send] iframeReady` +
        ` | target: ${window.opener ? 'opener' : 'parent'}` +
        ` | source: ${window.name}`
      );
    }
    return () => window.removeEventListener("message", handleSyncFrame);
  }, []);


function handleFrameAdded(event: MessageEvent) {
  const data = event.data as Record<string, any>;
  if (data?.type !== "frameAdded" || !data.frameName) return;

  if (POST_MESSAGE_LOG_ENABLED) {
    console.log(
      `[PostMessage Receive] frameAdded` +
        ` | frameName: ${data.frameName}`
    );
  }

  if (data.frameName !== "TopFrame") {
    registerFrame(data.frameName);
  }


  if (window.opener && window.top === window) {
    if (POST_MESSAGE_LOG_ENABLED) {
      console.log(
        `[PostMessage Forward] frameAdded → opener` +
          ` | from: ${window.name}` +
          ` | to: TopFrame`
      );
    }

    window.opener.postMessage(event.data, "*");
  }
}


  useEffect(() => {
    if (window.top !== window) return;
    window.addEventListener("message", handleFrameAdded);
    return () => window.removeEventListener("message", handleFrameAdded);
  }, []);




  function replaceFrameElements(
    frameName: string,
    elements: FrameElement[]
  ) {
    setFrameElementsMap((prev) => ({ ...prev, [frameName]: elements }));
  }

  // register frame to show in menu 
function registerFrame(frameName: string) {
  setFrameNamesList(prev => (prev.includes(frameName) ? prev : [...prev, frameName]));
  setCurrentFrameName(frameName);
  if (!refs.current[frameName]) {
    refs.current[frameName] = createRef<HTMLDivElement | null>();
  }

  const currentTopPage = window.location.pathname.slice(1) || "HomePage";
  if (!frameOriginPageMapRef.current[frameName]) {
    const parentFrame = findParentFrameName(frameName, frameElementsMap);
    const parentPage = parentFrame ? frameOriginPageMapRef.current[parentFrame] : undefined;
    frameOriginPageMapRef.current[frameName] = parentPage || currentTopPage;
  }
}




function unregisterFrame(frame: FrameElement) {
  if (!frame.isFrameOrContainer) return;

  function buildGlobalChildrenMapFromSession(): Record<string, string[]> {
    const savedRaw = sessionStorage.getItem("savedPageParams") || "";
    const params = new URLSearchParams(savedRaw);
    const children: Record<string, string[]> = {};

    for (const [key, value] of params.entries()) {
      if (!key.startsWith("elements.")) continue;
      const pageMap = parseElementsParam(value || "");
      for (const [frameName, elements] of Object.entries(pageMap)) {
        const kids = (elements || [])
          .filter(e => e.isFrameOrContainer)
          .map(e => e.id);
        if (!children[frameName]) children[frameName] = [];
        children[frameName].push(...kids);
      }
    }
    return children;
  }

  function gatherDescendants(rootId: string, sessionChildren: Record<string, string[]>): Set<string> {
    const toRemove = new Set<string>();
    const stack = [rootId];
    while (stack.length) {
      const id = stack.pop() as string;
      if (toRemove.has(id)) continue;
      toRemove.add(id);

      // from in-memory (current page)
      const memKids = (frameElementsMap[id] || [])
        .filter(e => e.isFrameOrContainer)
        .map(e => e.id);
      for (const kid of memKids) stack.push(kid);

      // from all pages (session)
      const sessKids = sessionChildren[id] || [];
      for (const kid of sessKids) stack.push(kid);
    }
    return toRemove;
  }

  // 1) Build global graph and collect all frame ids to remove (frame + descendants)
  const globalChildren = buildGlobalChildrenMapFromSession();
  const frameIdsToRemove = gatherDescendants(frame.id, globalChildren);

  // 2) Update React state (frameList, refs, map)
  setFrameNamesList(list => list.filter(name => !frameIdsToRemove.has(name)));
  for (const id of frameIdsToRemove) {
    delete refs.current[id];
    delete frameOriginPageMapRef.current[id];
  }
  setFrameElementsMap(prev => {
    const updated = { ...prev };
    for (const id of frameIdsToRemove) delete updated[id];
    // also scrub container references that point to removed frames
    for (const [fname, els] of Object.entries(updated)) {
      updated[fname] = (els || []).filter(e => !(e.isFrameOrContainer && frameIdsToRemove.has(e.id)));
    }
    return updated;
  });
  setCurrentFrameName(DEFAULT_FRAME);

  // 3) Purge from savedPageParams across ALL pages (and scrub container refs)
  const savedRaw = sessionStorage.getItem("savedPageParams") || "";
  const params = new URLSearchParams(savedRaw);
  const pageNames = new Set<string>();
  for (const key of params.keys()) {
    if (key.startsWith("frames.") || key.startsWith("elements.")) {
      const name = key.split(".")[1];
      if (name) pageNames.add(name);
    }
  }

  function serializeElementsParam(map: Record<string, FrameElement[]>): string {
    const entries: string[] = [];
    for (const [fname, list] of Object.entries(map)) {
      const elementEntries = (list || []).map(e => {
        const x = Math.round(e.xPercent * 100);
        const y = Math.round(e.yPercent * 100);
        const props = encodeURIComponent(JSON.stringify(e.customProps || {}));
        return [e.id, e.componentName, x, y, e.isFrameOrContainer, props].join(",");
      });
      entries.push(`${fname}:${elementEntries.join("|")}`);
    }
    return entries.join(";");
  }

  for (const page of pageNames) {
    const framesKey = `frames.${page}`;
    const elementsKey = `elements.${page}`;

    const framesStr = params.get(framesKey) || "";
    const elementsStr = params.get(elementsKey) || "";

    const map = parseElementsParam(elementsStr);

    // drop entire removed frames
    for (const id of frameIdsToRemove) {
      delete map[id];
    }
    // scrub container refs that point to removed frames
    for (const [fname, els] of Object.entries(map)) {
      map[fname] = (els || []).filter(e => !(e.isFrameOrContainer && frameIdsToRemove.has(e.id)));
    }

    const remainingFrameNames = Object.keys(map);

    if (remainingFrameNames.length === 0) {
      params.delete(framesKey);
      params.delete(elementsKey);
    } else {
      params.set(framesKey, remainingFrameNames.join(","));
      params.set(elementsKey, serializeElementsParam(map));
    }
  }

  sessionStorage.setItem("savedPageParams", params.toString());
  const newUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}${window.location.hash}`;
  window.history.replaceState(null, "", newUrl);
}


function findParentFrameName(childFrameId: string, map: Record<string, FrameElement[]>): string | null {
  for (const [frameName, elements] of Object.entries(map)) {
    if ((elements || []).some(e => e.isFrameOrContainer && e.id === childFrameId)) {
      return frameName;
    }
  }
  return null;
}


function addElementToCurrentFrame(
  componentName: string,
  isFrameOrContainer: boolean,
  customProps: Record<string, any> = {}
): string {
  const inMemoryAll = Object.values(frameElementsMap).flat();
  let maxSeen = idMaxRef.current[componentName] || 0;

  for (const e of inMemoryAll) {
    if (e.componentName !== componentName) continue;
    const parts = e.id.split("-");
    const suffix = parseInt(parts[parts.length - 1] || "0", 10);
    if (Number.isFinite(suffix) && suffix > maxSeen) maxSeen = suffix;
  }

  const nextSuffix = maxSeen + 1;
  const newId = `${componentName}-${nextSuffix}`;
  idMaxRef.current[componentName] = nextSuffix;

  const newElement: FrameElement = {
    id: newId,
    componentName,
    xPercent: 50,
    yPercent: 50,
    isFrameOrContainer,
    customProps,
  };

  setFrameElementsMap(prev => {
    const curr = prev[currentFrame] || [];
    return { ...prev, [currentFrame]: [...curr, newElement] };
  });
  return newId;
}


  function removeElementFromFrame(elementId: string, frameName: string) {
    setFrameElementsMap(prev => {
      const updated = (prev[frameName]||[]).filter(e=>e.id!==elementId);
      return {...prev, [frameName]: updated};
    });
  }

  function updateElementPosition(
    elementId: string,
    newXPercent: number,
    newYPercent: number,
    frameName: string
  ) {
    setFrameElementsMap(prev => {
      const updated = (prev[frameName]||[]).map(e=> e.id!==elementId?e:{...e,xPercent:newXPercent,yPercent:newYPercent});
      return {...prev,[frameName]:updated};
    });
  }

  return (
    <FrameContext.Provider
      value={{
        currentFrame,
        setCurrentFrameName,
        frameList,
        replaceFrameElements,
        registerFrame,
        unregisterFrame,
        addElementToCurrentFrame,
        removeElementFromFrame,
        updateElementPosition,
        frameElementsMap,
        containerRefs,
      }}
    >
      {children}
    </FrameContext.Provider>
  );
}

export function useFrame() {
  const context = useContext(FrameContext);
  if (!context) throw new Error("useFrame must be used within FrameManager");
  return context;
}
