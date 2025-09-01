"use client";

import { AppState } from "./frameUtils";

export type PagesByOrigin = Record<string, string[]>;
type SerializedPagesByOrigin = Partial<Record<"OriginMain" | "OriginSame" | "OriginCross", string[]>>;

export const DEV_ORIGINS = ["localhost:3000/", "localhost:3000/frame/", "localhost:3001/frame/"];
export const PROD_ORIGINS = ["build.jonnoel.dev/", "build.jonnoel.dev/frame/", "frame.jonnoel.dev/frame/"];

const SESSION_KEY_STATE = "SB_STATE";

export const SAME_ORIGIN_TARGET =
  process.env.NODE_ENV === "production" ? "https://build.jonnoel.dev/" : "http://localhost:3000/";

export const CROSS_ORIGIN_TARGET =
  process.env.NODE_ENV === "production" ? "https://frame.jonnoel.dev/" : "http://localhost:3001/";

type ExtendedAppState = AppState & { pagesByOrigin?: PagesByOrigin };

function getKnownOrigins(): [string, string, string] {
  const isDevelopment = typeof process !== "undefined" && process.env.NODE_ENV === "development";
  const originList = isDevelopment ? DEV_ORIGINS : PROD_ORIGINS;
  return [originList[0], originList[1], originList[2]];
}

function getSerializedMapping() {
  const [originMain, originSame, originCross] = getKnownOrigins();
  return [
    { serializedKey: "OriginMain" as const, originKey: originMain },
    { serializedKey: "OriginSame" as const, originKey: originSame },
    { serializedKey: "OriginCross" as const, originKey: originCross },
  ];
}

function isSerializedPagesByOrigin(value: unknown): value is SerializedPagesByOrigin {
  if (!value || typeof value !== "object") return false;
  const providedKeys = Object.keys(value as object);
  return ["OriginMain", "OriginSame", "OriginCross"].some(k => providedKeys.includes(k));
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

function mapSerializedToRuntime(serialized: SerializedPagesByOrigin): PagesByOrigin {
  const mapping = getSerializedMapping();
  const runtime: PagesByOrigin = {};
  for (const { serializedKey, originKey } of mapping) {
    const serializedPages = serialized[serializedKey];
    if (Array.isArray(serializedPages) && serializedPages.length > 0) {
      const cleanedPages = cleanPageList(serializedPages);
      if (cleanedPages.length > 0) runtime[originKey] = cleanedPages;
    }
  }
  return runtime;
}

function mapRuntimeToSerialized(runtime: PagesByOrigin): SerializedPagesByOrigin | undefined {
  const mapping = getSerializedMapping();
  const serializedOutput: SerializedPagesByOrigin = {};
  for (const { serializedKey, originKey } of mapping) {
    const runtimePages = cleanPageList(runtime[originKey] || []);
    if (runtimePages.length > 0) serializedOutput[serializedKey] = runtimePages;
  }
  return Object.keys(serializedOutput).length === 0 ? undefined : serializedOutput;
}

function hasValidCoreShape(value: any): value is ExtendedAppState {
  return (
    value &&
    typeof value === "object" &&
    value.frames &&
    value.frameOrder &&
    value.currentFrame &&
    typeof value.rootPage === "string"
  );
}

function normalizeParsedState(parsedJson: any): ExtendedAppState | null {
  if (!hasValidCoreShape(parsedJson)) return null;
  if (parsedJson.pagesByOrigin && isSerializedPagesByOrigin(parsedJson.pagesByOrigin)) {
    const runtimePagesByOrigin = mapSerializedToRuntime(parsedJson.pagesByOrigin);
    const hasAnyPages = Object.values(runtimePagesByOrigin).some(pageList => pageList.length > 0);
    return hasAnyPages ? { ...parsedJson, pagesByOrigin: runtimePagesByOrigin } : { ...parsedJson, pagesByOrigin: undefined };
  }
  return parsedJson as ExtendedAppState;
}

function readSessionLoose(): any | null {
  try {
    const sessionJson = sessionStorage.getItem(SESSION_KEY_STATE);
    if (!sessionJson) return null;
    const parsed = JSON.parse(sessionJson);
    return normalizeParsedState(parsed) ?? parsed;
  } catch {
    return null;
  }
}

function readSessionStrict(): ExtendedAppState | null {
  const parsed = readSessionLoose();
  return parsed && hasValidCoreShape(parsed) ? (parsed as ExtendedAppState) : null;
}

function toSerializableState(stateToPersist: any): any {
  const hasPagesKey = stateToPersist && typeof stateToPersist === "object" && "pagesByOrigin" in stateToPersist;
  if (!hasPagesKey) return stateToPersist;
  const serialized = mapRuntimeToSerialized(stateToPersist.pagesByOrigin as PagesByOrigin);
  if (serialized) return { ...stateToPersist, pagesByOrigin: serialized };
  const { pagesByOrigin, ...rest } = stateToPersist;
  return rest;
}

function writeSession(stateToPersist: any): void {
  try {
    sessionStorage.setItem(SESSION_KEY_STATE, JSON.stringify(toSerializableState(stateToPersist)));
  } catch {}
}

export function loadInitialState(defaultFrameName: string, defaultPageName: string): AppState | null {
  if (typeof window === "undefined") return null;

  const sessionState = readSessionStrict();
  if (sessionState) {
    return {
      rootPage: sessionState.rootPage,
      frames: sessionState.frames,
      frameOrder: sessionState.frameOrder,
      currentFrame: defaultFrameName,
    };
  }

  const initialState: ExtendedAppState = {
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
  };
  writeSession(initialState);
  return {
    rootPage: initialState.rootPage,
    frames: initialState.frames,
    frameOrder: initialState.frameOrder,
    currentFrame: initialState.currentFrame,
  };
}

export function persistStateToSession(appState: AppState): void {
  if (typeof window === "undefined") return;
  const existingSession = readSessionLoose();
  const nextSessionState = {
    rootPage: appState.rootPage,
    frames: appState.frames,
    frameOrder: appState.frameOrder,
    currentFrame: appState.currentFrame,
    pagesByOrigin: existingSession?.pagesByOrigin,
  };
  writeSession(nextSessionState);
}

export function loadPagesByOriginWithDefaults(defaultPagesByOrigin: PagesByOrigin): PagesByOrigin {
  if (typeof window === "undefined") return { ...defaultPagesByOrigin };

  const sessionValue = readSessionLoose();
  const knownOriginList = getKnownOrigins();

  const mergedPagesByOrigin: PagesByOrigin = {};
  for (const originUrl of knownOriginList) {
    mergedPagesByOrigin[originUrl] = ["Home Page"];
  }

  const storedPagesByOrigin = sessionValue?.pagesByOrigin as PagesByOrigin | undefined;
  if (storedPagesByOrigin) {
    for (const [originUrl, pageNames] of Object.entries(storedPagesByOrigin)) {
      const uniquePages = Array.from(new Set<string>(["Home Page", ...pageNames]));
      mergedPagesByOrigin[originUrl] = uniquePages;
    }
  }

  return mergedPagesByOrigin;
}

export function persistPagesByOrigin(pagesByOrigin: PagesByOrigin): void {
  if (typeof window === "undefined") return;
  const existingSession = readSessionLoose();
  const stateToWrite = existingSession ? { ...existingSession, pagesByOrigin: { ...pagesByOrigin } } : { pagesByOrigin };
  writeSession(stateToWrite);
}

export function isCspEnabledForFrame(frameName: string): boolean {
  const session = readSessionLoose();
  const frame = session?.frames?.[frameName];
  const properties = frame?.properties ?? {};
  return typeof properties.CspInHeaders !== "undefined";
}

export function setCspEnabledForFrame(frameName: string, enabled: boolean): void {
  const session = readSessionLoose();
  if (!session?.frames?.[frameName]) return;

  const currentFrame = session.frames[frameName];
  const currentProperties = currentFrame.properties ?? {};

  let nextProperties: Record<string, any>;
  if (enabled) {
    nextProperties = { ...currentProperties, CspInHeaders: true };
  } else {
    const filteredEntries = Object.entries(currentProperties).filter(
      ([propertyKey]) => propertyKey !== "CspInHeaders"
    );
    nextProperties = Object.fromEntries(filteredEntries);
  }

  const nextState = {
    ...session,
    frames: {
      ...session.frames,
      [frameName]: { ...currentFrame, properties: nextProperties },
    },
  };

  writeSession(nextState);
}
export function getFrameProperties(frameName: string): Record<string, any> {
  const session = readSessionLoose();
  const frame = session?.frames?.[frameName];
  const properties = frame?.properties;
  return properties && typeof properties === "object" ? { ...properties } : {};
}