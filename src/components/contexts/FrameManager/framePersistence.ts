"use client";

import { AppState } from "./FrameManager";

export type PagesByOrigin = Record<string, string[]>;
type CombinedState = AppState & { pagesByOrigin?: PagesByOrigin };
type PagesByIndex = Record<"o1" | "o2" | "o3", string[]>;

const SESSION_KEY_STATE = "SB_STATE";
const SESSION_KEY_LAST_URL_STATE = "SB_LAST_URL_STATE";
const URL_PARAM_STATE = "state";

const DEV_ORIGINS = ["localhost:3000/", "localhost:3000/frame/", "localhost:3001/frame/"];
const PROD_ORIGINS = ["build.jonnoel.dev/", "build.jonnoel.dev/frame/", "frame.jonnoel.dev/frame/"];

function getKnownOrigins(): string[] {
  const isDev = typeof process !== "undefined" && process.env.NODE_ENV === "development";
  return isDev ? DEV_ORIGINS : PROD_ORIGINS;
}

function readSearchParams(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}

function buildUrlFromParams(params: URLSearchParams): string {
  const query = params.toString();
  return `${window.location.pathname}${query ? "?" + query : ""}${window.location.hash}`;
}

function pagesByOriginToIndex(pagesByOrigin: PagesByOrigin | undefined): PagesByIndex | undefined {
  if (!pagesByOrigin) return undefined;
  const origins = getKnownOrigins();
  const byIndex: PagesByIndex = { o1: [], o2: [], o3: [] };
  origins.forEach((origin, idx) => {
    const key = (`o${idx + 1}`) as keyof PagesByIndex;
    const list = pagesByOrigin[origin] || ["Home Page"];
    const extras = list.filter((name) => name !== "Home Page");
    byIndex[key] = extras;
  });
  return byIndex;
}

function pagesIndexToByOrigin(pagesByIndex: PagesByIndex | undefined, defaults: PagesByOrigin): PagesByOrigin {
  const origins = getKnownOrigins();
  const result: PagesByOrigin = {};
  origins.forEach((origin, idx) => {
    const key = (`o${idx + 1}`) as keyof PagesByIndex;
    const extras = pagesByIndex?.[key] || [];
    const base = defaults[origin] || ["Home Page"];
    const baseHome = base[0] === "Home Page" ? base[0] : "Home Page";
    result[origin] = [baseHome, ...extras];
  });
  return result;
}

function buildDefaultPagesByOrigin(): PagesByOrigin {
  const map: PagesByOrigin = {};
  const origins = getKnownOrigins();
  origins.forEach((origin) => {
    map[origin] = ["Home Page"];
  });
  return map;
}

function readCombinedFromSession(): CombinedState | null {
  const raw = sessionStorage.getItem(SESSION_KEY_STATE);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CombinedState;
  } catch {
    return null;
  }
}

function readLastUrlStateFromSession(): string | null {
  return sessionStorage.getItem(SESSION_KEY_LAST_URL_STATE);
}

function writeCombinedToSession(combined: CombinedState): void {
  try {
    sessionStorage.setItem(SESSION_KEY_STATE, JSON.stringify(combined));
  } catch {}
}

function writeLastUrlStateToSession(stateString: string): void {
  try {
    sessionStorage.setItem(SESSION_KEY_LAST_URL_STATE, stateString);
  } catch {}
}

function readRawUrlStateString(): string | null {
  const params = readSearchParams();
  const raw = params.get(URL_PARAM_STATE);
  return raw || null;
}

function parseCombinedFromUrlString(
  urlStateString: string,
  defaultPagesByOrigin: PagesByOrigin
): CombinedState | null {
  try {
    const parsed = JSON.parse(urlStateString) as Partial<CombinedState> & { pagesByIndex?: PagesByIndex };
    const appOnly: AppState | null =
      parsed && parsed.rootPage && parsed.frames && parsed.frameOrder && parsed.currentFrame
        ? {
            rootPage: parsed.rootPage as string,
            frames: parsed.frames as AppState["frames"],
            frameOrder: parsed.frameOrder as string[],
            currentFrame: parsed.currentFrame as string,
          }
        : null;
    if (!appOnly) return null;
    const pagesByOrigin =
      parsed.pagesByIndex ? pagesIndexToByOrigin(parsed.pagesByIndex, defaultPagesByOrigin) : undefined;
    return pagesByOrigin ? { ...appOnly, pagesByOrigin } : { ...appOnly };
  } catch {
    return null;
  }
}

function buildUrlStateString(combined: CombinedState): string {
  const pagesByIndex = pagesByOriginToIndex(combined.pagesByOrigin);
  const minimal = pagesByIndex
    ? {
        rootPage: combined.rootPage,
        frames: combined.frames,
        frameOrder: combined.frameOrder,
        currentFrame: combined.currentFrame,
        pagesByIndex,
      }
    : {
        rootPage: combined.rootPage,
        frames: combined.frames,
        frameOrder: combined.frameOrder,
        currentFrame: combined.currentFrame,
      };
  return JSON.stringify(minimal);
}

function writeCombinedToUrlAndRememberString(combined: CombinedState): void {
  const params = readSearchParams();
  const urlStateString = buildUrlStateString(combined);
  params.set(URL_PARAM_STATE, urlStateString);
  const nextUrl = buildUrlFromParams(params);
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (nextUrl !== currentUrl) window.history.replaceState(null, "", nextUrl);
  writeLastUrlStateToSession(urlStateString);
}

export function loadInitialState(defaultFrameName: string, defaultPageName: string): AppState | null {
  if (typeof window === "undefined") return null;

  let pageFromPath = defaultPageName;
  const segments = window.location.pathname.split("/").filter(Boolean);
  if (segments[0] === "frame") {
    if (segments[2]) pageFromPath = segments[2];
  } else {
    if (segments[0]) pageFromPath = segments[0];
  }

  const defaults = buildDefaultPagesByOrigin();

  const fromSession = readCombinedFromSession();
  if (fromSession) {
    const incomingUrlState = readRawUrlStateString();
    const knownUrlState = readLastUrlStateFromSession();
    if (incomingUrlState && knownUrlState && incomingUrlState !== knownUrlState) {
      return {
        rootPage: pageFromPath,
        frames: fromSession.frames,
        frameOrder: fromSession.frameOrder,
        currentFrame: fromSession.currentFrame,
      };
    }
    return {
      rootPage: pageFromPath,
      frames: fromSession.frames,
      frameOrder: fromSession.frameOrder,
      currentFrame: fromSession.currentFrame,
    };
  }

  const rawUrlState = readRawUrlStateString();
  if (rawUrlState) {
    const parsed = parseCombinedFromUrlString(rawUrlState, defaults);
    if (parsed) {
      writeCombinedToSession(parsed);
      writeLastUrlStateToSession(rawUrlState);
      return {
        rootPage: pageFromPath,
        frames: parsed.frames,
        frameOrder: parsed.frameOrder,
        currentFrame: parsed.currentFrame,
      };
    }
  }

  const initial: AppState = {
    rootPage: pageFromPath,
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
  const initialCombined: CombinedState = { ...initial };
  writeCombinedToSession(initialCombined);
  writeCombinedToUrlAndRememberString(initialCombined);
  return initial;
}


export function persistStateToUrlAndSession(appState: AppState): void {
  const existing = readCombinedFromSession();
  const merged: CombinedState = existing?.pagesByOrigin ? { ...appState, pagesByOrigin: existing.pagesByOrigin } : { ...appState };
  writeCombinedToSession(merged);
  writeCombinedToUrlAndRememberString(merged);
}

export function loadPagesByOriginWithDefaults(defaultPagesByOrigin: PagesByOrigin): PagesByOrigin {
  if (typeof window === "undefined") return { ...defaultPagesByOrigin };
  const fromSession = readCombinedFromSession();
  if (fromSession?.pagesByOrigin) return fromSession.pagesByOrigin;

  const rawUrlState = readRawUrlStateString();
  if (rawUrlState) {
    const parsed = parseCombinedFromUrlString(rawUrlState, defaultPagesByOrigin);
    if (parsed?.pagesByOrigin) {
      const base: CombinedState = fromSession
        ? { ...fromSession, pagesByOrigin: parsed.pagesByOrigin }
        : {
            rootPage: parsed.rootPage,
            frames: parsed.frames,
            frameOrder: parsed.frameOrder,
            currentFrame: parsed.currentFrame,
            pagesByOrigin: parsed.pagesByOrigin,
          };
      writeCombinedToSession(base);
      writeLastUrlStateToSession(rawUrlState);
      return parsed.pagesByOrigin;
    }
  }

  return { ...defaultPagesByOrigin };
}

export function persistPagesByOrigin(pagesByOrigin: PagesByOrigin): void {
  const existing = readCombinedFromSession();
  if (existing) {
    const updated: CombinedState = { ...existing, pagesByOrigin };
    writeCombinedToSession(updated);
    writeCombinedToUrlAndRememberString(updated);
    return;
  }
  const fallback: CombinedState = {
    rootPage: "HomePage",
    frames: {},
    frameOrder: ["TopFrame"],
    currentFrame: "TopFrame",
    pagesByOrigin,
  };
  writeCombinedToSession(fallback);
  writeCombinedToUrlAndRememberString(fallback);
}
