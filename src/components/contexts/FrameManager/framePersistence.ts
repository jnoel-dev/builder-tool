"use client";

import { AppState, SnippetProperties, PagesByOrigin } from "./frameUtils";

export const DEV_ORIGINS = ["localhost:3000/", "localhost:3000/frame/", "localhost:3001/frame/"];
export const PROD_ORIGINS = ["build.jonnoel.dev/", "build.jonnoel.dev/frame/", "frame.jonnoel.dev/frame/"];

const SESSION_KEY_STATE = "SB_STATE";

export const SAME_ORIGIN_TARGET =
  process.env.NODE_ENV === "production" ? "https://build.jonnoel.dev/" : "http://localhost:3000/";

export const CROSS_ORIGIN_TARGET =
  process.env.NODE_ENV === "production" ? "https://frame.jonnoel.dev/" : "http://localhost:3001/";

function getKnownOrigins(): [string, string, string] {
  const isDevelopment = typeof process !== "undefined" && process.env.NODE_ENV === "development";
  const originList = isDevelopment ? DEV_ORIGINS : PROD_ORIGINS;
  return [originList[0], originList[1], originList[2]];
}

function cleanPageList(pageNames: string[]): string[] {
  const seenPages = new Set<string>();
  const cleanedList: string[] = [];
  for (const pageName of pageNames) {
    if (!pageName || pageName.trim() === "" || seenPages.has(pageName)) continue;
    seenPages.add(pageName);
    cleanedList.push(pageName);
  }
  return cleanedList;
}

function readSession(): any | null {
  try {
    const sessionJson = sessionStorage.getItem(SESSION_KEY_STATE);
    if (!sessionJson) return null;
    return JSON.parse(sessionJson);
  } catch {
    return null;
  }
}

function writeSession(stateToPersist: any): void {
  try {
    sessionStorage.setItem(SESSION_KEY_STATE, JSON.stringify(stateToPersist));
  } catch {}
}

export function loadInitialState(defaultFrameName: string, defaultPageName: string): AppState | null {
  if (typeof window === "undefined") return null;

  const sessionState = readSession() as AppState | null;
  if (sessionState) {
    return {
      rootPage: sessionState.rootPage,
      frames: sessionState.frames,
      frameOrder: sessionState.frameOrder,
      currentFrame: defaultFrameName,
      pagesByOrigin: sessionState.pagesByOrigin,
      snippetProperties: sessionState.snippetProperties,
    };
  }

  const initialState: AppState = {
    rootPage: defaultPageName,
    frames: {
      [defaultFrameName]: {
        name: defaultFrameName,
        pages: { [defaultPageName]: { elements: [] } },
        createdOnPage: defaultPageName,
      },
    },
    frameOrder: [defaultFrameName],
    currentFrame: defaultFrameName,
    pagesByOrigin: undefined,
    snippetProperties: undefined,
  };

  writeSession(initialState);
  return initialState;
}

export function persistStateToSession(appState: AppState): void {
  if (typeof window === "undefined") return;
  const existingSession = (readSession() || {}) as AppState;
  const nextSessionState: AppState = {
    ...existingSession,
    rootPage: appState.rootPage,
    frames: appState.frames,
    frameOrder: appState.frameOrder,
    currentFrame: appState.currentFrame,
    pagesByOrigin: appState.pagesByOrigin ?? existingSession.pagesByOrigin,
    snippetProperties: appState.snippetProperties ?? existingSession.snippetProperties,
  };
  writeSession(nextSessionState);
}

export function loadPagesByOriginWithDefaults(defaultPagesByOrigin: PagesByOrigin): PagesByOrigin {
  if (typeof window === "undefined") return { ...defaultPagesByOrigin };

  const sessionValue = readSession() as AppState | null;
  const knownOriginList = getKnownOrigins();

  const mergedPagesByOrigin: PagesByOrigin = {};
  for (const originUrl of knownOriginList) {
    mergedPagesByOrigin[originUrl] = ["Home Page"];
  }

  const storedPagesByOrigin = sessionValue?.pagesByOrigin as PagesByOrigin | undefined;
  if (storedPagesByOrigin) {
    for (const [originUrl, pageNames] of Object.entries(storedPagesByOrigin)) {
      const uniquePages = Array.from(new Set<string>(["Home Page", ...cleanPageList(pageNames || [])]));
      mergedPagesByOrigin[originUrl] = uniquePages;
    }
  }

  for (const [originUrl, pageNames] of Object.entries(defaultPagesByOrigin)) {
    const existingList = mergedPagesByOrigin[originUrl] || ["Home Page"];
    const uniquePages = Array.from(new Set<string>([...existingList, ...cleanPageList(pageNames || [])]));
    mergedPagesByOrigin[originUrl] = uniquePages;
  }

  return mergedPagesByOrigin;
}

export function persistPagesByOrigin(pagesByOrigin: PagesByOrigin): void {
  if (typeof window === "undefined") return;
  const existingSession = (readSession() || {}) as AppState;
  const stateToWrite = { ...existingSession, pagesByOrigin: { ...pagesByOrigin } };
  writeSession(stateToWrite);
}

export function setFrameProperty(frameName: string, propertyName: string, isEnabled: boolean): void {
  if (typeof window === "undefined") return;

  const sessionValue = readSession() as AppState | null;
  if (!sessionValue?.frames?.[frameName]) return;

  const nextSession: AppState = {
    ...sessionValue,
    frames: {
      ...sessionValue.frames,
      [frameName]: { ...sessionValue.frames[frameName] },
    },
  };

  const frameNode = nextSession.frames[frameName];
  const nextProperties =
    frameNode.properties && typeof frameNode.properties === "object" ? { ...frameNode.properties } : {};

  if (isEnabled) {
    nextProperties[propertyName] = true;
    frameNode.properties = nextProperties;
  } else {
    delete nextProperties[propertyName];
    if (Object.keys(nextProperties).length > 0) {
      frameNode.properties = nextProperties;
    } else {
      delete frameNode.properties;
    }
  }

  writeSession(nextSession);
}

export function getFrameProperties(frameName: string): Record<string, unknown> {
  const sessionValue = readSession() as AppState | null;
  const frameNode = sessionValue?.frames?.[frameName];
  const properties = frameNode?.properties;
  return properties && typeof properties === "object" ? { ...properties } : {};
}

export function setSnippetProperties(snippetProperties: SnippetProperties): void {
  if (typeof window === "undefined") return;
  const existingSession = (readSession() || {}) as AppState;
  const nextSessionState = { ...existingSession, snippetProperties: { ...snippetProperties } };
  writeSession(nextSessionState);
}

export function getSnippetProperties(): SnippetProperties | undefined {
  const sessionValue = readSession() as AppState | null;
  const stored = sessionValue?.snippetProperties as SnippetProperties | undefined;
  return stored && typeof stored === "object" ? { ...stored } : undefined;
}
