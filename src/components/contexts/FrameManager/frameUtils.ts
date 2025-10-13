import { getKnownChildWindowInfoByFrameName } from "./frameMessaging";

export const DEFAULT_FRAME_NAME = "TopFrame";
export const DEFAULT_PAGE_NAME = "HomePage";

export type PagesByOrigin = Record<string, string[]>;

export enum UUIDType {
  ForceLoad = "forceLoad",
  Default = "default",
}

export enum CreateIdentifierType {
  None = "none",
  Variable = "variable",
  Cookie = "cookie",
}
export type CreateIdentifier = {
  type: CreateIdentifierType;
  name: string;
  value: string;
  delayMs: number;
};

export type SnippetProperties = {
  systemGuid: string;
  environmentPathName: string;
  cdnDomain: string;
  loadInCdIframes: boolean;
  uuid: UUIDType;
  createIdentifier: CreateIdentifier;
};

export type FrameElement = {
  id: string;
  componentName: string;
  xPercent: number;
  yPercent: number;
  isFrameOrContainer: boolean;
  customProps?: Record<string, unknown>;
};

export type PageState = { elements: FrameElement[] };

export type FrameProperties = {
  [propertyKey: string]: unknown;
};

export type FrameNode = {
  name: string;
  pages: Record<string, PageState>;
  createdOnPage: string;
  properties?: FrameProperties;
};

export type AppState = {
  rootPage: string;
  frames: Record<string, FrameNode>;
  frameOrder: string[];
  currentFrame: string;
  pagesByOrigin?: PagesByOrigin;
  snippetProperties?: SnippetProperties;
  isLocked: boolean;
};

export function getMaxSuffixFromId(idValue: string): number {
  const parts = idValue.split("-");
  const lastPart = parts[parts.length - 1] || "";
  const parsed = parseInt(lastPart, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function rebuildIdCountersFromState(
  appState: AppState,
): Record<string, number> {
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

export function pageNameFromPath(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[1] === "frame") return segments[3] || DEFAULT_PAGE_NAME;
  return segments[1] || DEFAULT_PAGE_NAME;
}

export function getCurrentPageFromFrameName(frameName: string): string {
  if (typeof window === "undefined") {
    return "HomePage";
  } else if (frameName === "TopFrame") {
    return pageNameFromPath(window.location.pathname);
  } else {
    return (
      getKnownChildWindowInfoByFrameName(frameName)?.currentPage || "HomePage"
    );
  }
}

export function getElementsForFrame(
  appState: AppState,
  frameName: string,
): FrameElement[] {
  const frameNode = appState.frames[frameName];
  if (!frameNode) return [];
  const pageKey = getCurrentPageFromFrameName(frameName);
  const pageState = frameNode.pages[pageKey] || { elements: [] };
  return pageState.elements || [];
}
