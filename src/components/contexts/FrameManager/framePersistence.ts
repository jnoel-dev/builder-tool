"use client";

import { AppState } from "./frameUtils";

export type PagesByOrigin = Record<string, string[]>;
type SerializedPagesByOrigin = Record<"main origin" | "same origin" | "cross origin", string[]>;

export const DEV_ORIGINS = ["localhost:3000/", "localhost:3000/frame/", "localhost:3001/frame/"];
export const PROD_ORIGINS = ["build.jonnoel.dev/", "build.jonnoel.dev/frame/", "frame.jonnoel.dev/frame/"];

const SESSION_KEY_STATE = "SB_STATE";
const URL_PARAM_STATE = "state";
export const SAME_ORIGIN_TARGET =
  process.env.NODE_ENV === 'production'
    ? 'https://build.jonnoel.dev/'
    : 'http://localhost:3000/';

export const CROSS_ORIGIN_TARGET =
  process.env.NODE_ENV === 'production'
    ? 'https://frame.jonnoel.dev/'
    : 'http://localhost:3001/';

type ExtendedAppState = AppState & { pagesByOrigin?: PagesByOrigin };

function getKnownOrigins(): string[] {
  const isDev = typeof process !== "undefined" && process.env.NODE_ENV === "development";
  return isDev ? DEV_ORIGINS : PROD_ORIGINS;
}

function isSerialized(value: unknown): value is SerializedPagesByOrigin {
  if (!value || typeof value !== "object") return false;
  const keys = Object.keys(value as object);
  return keys.includes("main origin") || keys.includes("same origin") || keys.includes("cross origin");
}

function toRuntimePagesByOrigin(input: SerializedPagesByOrigin): PagesByOrigin {
  const [mainOrigin, sameOrigin, crossOrigin] = getKnownOrigins();
  return {
    [mainOrigin]: input["main origin"] || ["Home Page"],
    [sameOrigin]: input["same origin"] || ["Home Page"],
    [crossOrigin]: input["cross origin"] || ["Home Page"],
  };
}

function toSerializedPagesByOrigin(input: PagesByOrigin): SerializedPagesByOrigin {
  const [mainOrigin, sameOrigin, crossOrigin] = getKnownOrigins();
  return {
    "main origin": input[mainOrigin] || ["Home Page"],
    "same origin": input[sameOrigin] || ["Home Page"],
    "cross origin": input[crossOrigin] || ["Home Page"],
  };
}

function readSessionLoose(): any | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY_STATE);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.pagesByOrigin && isSerialized(parsed.pagesByOrigin)) {
      const mapped = toRuntimePagesByOrigin(parsed.pagesByOrigin);
      return { ...parsed, pagesByOrigin: mapped };
    }
    return parsed;
  } catch {
    return null;
  }
}

function readSessionStrict(): ExtendedAppState | null {
  const parsed = readSessionLoose();
  if (!parsed) return null;
  if (!parsed.frames || !parsed.frameOrder || !parsed.currentFrame || typeof parsed.rootPage !== "string") return null;
  return parsed as ExtendedAppState;
}

function writeSession(value: any): void {
  try {
    const toStore =
      value && typeof value === "object" && value.pagesByOrigin
        ? { ...value, pagesByOrigin: toSerializedPagesByOrigin(value.pagesByOrigin as PagesByOrigin) }
        : value;
    sessionStorage.setItem(SESSION_KEY_STATE, JSON.stringify(toStore));
  } catch {}
}

function readInlineStateParam(): ExtendedAppState | null {
  try {
    const raw = new URLSearchParams(window.location.search).get(URL_PARAM_STATE);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ExtendedAppState & { pagesByOrigin?: PagesByOrigin | SerializedPagesByOrigin };
    if (!parsed.frames || !parsed.frameOrder || !parsed.currentFrame || typeof parsed.rootPage !== "string") return null;
    if (parsed.pagesByOrigin && isSerialized(parsed.pagesByOrigin)) {
      const mapped = toRuntimePagesByOrigin(parsed.pagesByOrigin);
      return { ...parsed, pagesByOrigin: mapped };
    }
    return parsed as ExtendedAppState;
  } catch {
    return null;
  }
}

export function loadInitialState(defaultFrameName: string, defaultPageName: string): AppState | null {
  if (typeof window === "undefined") return null;

  const fromStrict = readSessionStrict();
  if (fromStrict) {
    return {
      rootPage: fromStrict.rootPage,
      frames: fromStrict.frames,
      frameOrder: fromStrict.frameOrder,
      currentFrame: defaultFrameName,
    };
  }

  const fromParam = readInlineStateParam();
  if (fromParam) {
    const normalized: ExtendedAppState = {
      rootPage: fromParam.rootPage,
      frames: fromParam.frames,
      frameOrder: fromParam.frameOrder,
      currentFrame: defaultFrameName,
      pagesByOrigin: fromParam.pagesByOrigin,
    };
    writeSession(normalized);
    return {
      rootPage: normalized.rootPage,
      frames: normalized.frames,
      frameOrder: normalized.frameOrder,
      currentFrame: normalized.currentFrame,
    };
  }

  const initial: ExtendedAppState = {
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
  writeSession(initial);
  return {
    rootPage: initial.rootPage,
    frames: initial.frames,
    frameOrder: initial.frameOrder,
    currentFrame: initial.currentFrame,
  };
}

export function persistStateToSession(appState: AppState): void {
  if (typeof window === "undefined") return;
  const loose = readSessionLoose();
  const next = {
    rootPage: appState.rootPage,
    frames: appState.frames,
    frameOrder: appState.frameOrder,
    currentFrame: appState.currentFrame,
    pagesByOrigin: loose?.pagesByOrigin,
  };
  writeSession(next);
}

export function loadPagesByOriginWithDefaults(defaultPagesByOrigin: PagesByOrigin): PagesByOrigin {
  if (typeof window === "undefined") return { ...defaultPagesByOrigin };
  const loose = readSessionLoose();
  if (loose?.pagesByOrigin) return loose.pagesByOrigin as PagesByOrigin;
  if (loose) {
    writeSession({ ...loose, pagesByOrigin: { ...defaultPagesByOrigin } });
  }
  return { ...defaultPagesByOrigin };
}

export function persistPagesByOrigin(pagesByOrigin: PagesByOrigin): void {
  if (typeof window === "undefined") return;
  const loose = readSessionLoose();
  if (loose) {
    writeSession({ ...loose, pagesByOrigin: { ...pagesByOrigin } });
  } else {
    writeSession({ pagesByOrigin: { ...pagesByOrigin } });
  }
}
