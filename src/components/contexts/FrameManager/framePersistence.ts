"use client";

import { AppState, SnippetProperties, PagesByOrigin } from "./frameUtils";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestoreDatabase } from "./firebaseConfig";
import {
  notifySyncStart,
  notifySyncSuccess,
  notifySyncError,
  setLockIndicator,
} from "@/components/builderPage/syncStatusWidget/SyncStatusWidget";

const SESSION_KEY_STATE = "SB_STATE";

export const SAME_ORIGIN_TARGET =
  process.env.NODE_ENV === "production"
    ? "https://build.jonnoel.dev/"
    : "http://localhost:3000/";

export const CROSS_ORIGIN_TARGET =
  process.env.NODE_ENV === "production"
    ? "https://frame.jonnoel.dev/"
    : "http://localhost:3001/";

let knownFrameOrigins: string[] = [];

export function setPersistenceKnownFrameOrigins(frameOrigins: string[]): void {
  knownFrameOrigins = frameOrigins;
}

function cleanPageList(pageNames: string[]): string[] {
  const seenPages = new Set<string>();
  const cleanedList: string[] = [];
  for (const pageName of pageNames) {
    if (!pageName || pageName.trim() === "" || seenPages.has(pageName))
      continue;
    seenPages.add(pageName);
    cleanedList.push(pageName);
  }
  return cleanedList;
}

function readSession(): AppState | null {
  try {
    const sessionJson = sessionStorage.getItem(SESSION_KEY_STATE);
    if (!sessionJson) return null;
    return JSON.parse(sessionJson) as AppState;
  } catch {
    return null;
  }
}

function stableSerialize(inputValue: unknown): string {
  const sortValue = (unsortedValue: unknown): unknown => {
    if (Array.isArray(unsortedValue)) return unsortedValue.map(sortValue);
    if (unsortedValue && typeof unsortedValue === "object") {
      const sortedObject: Record<string, unknown> = {};
      const sortedKeys = Object.keys(
        unsortedValue as Record<string, unknown>,
      ).sort();
      for (const sortedKey of sortedKeys) {
        sortedObject[sortedKey] = sortValue(
          (unsortedValue as Record<string, unknown>)[sortedKey],
        );
      }
      return sortedObject;
    }
    return unsortedValue;
  };
  return JSON.stringify(sortValue(inputValue));
}

async function writeSession(
  stateToPersist: AppState,
  opts?: { forceSync?: boolean },
): Promise<boolean> {
  const currentLocked = readSession()?.isLocked ?? false;
  const finalState: AppState = {
    ...stateToPersist,
    isLocked:
      (stateToPersist as Partial<AppState>).isLocked !== undefined
        ? stateToPersist.isLocked
        : currentLocked,
  };

  try {
    const existingJson = sessionStorage.getItem(SESSION_KEY_STATE);
    const existingComparable = existingJson
      ? stableSerialize(JSON.parse(existingJson))
      : null;
    const nextComparable = stableSerialize(finalState);
    if (existingComparable !== null && existingComparable === nextComparable) {
      return true;
    }
  } catch {}
  try {
    sessionStorage.setItem(SESSION_KEY_STATE, JSON.stringify(finalState));
  } catch {}
  if (finalState.isLocked && !opts?.forceSync) return true;
  try {
    const wasSynced = await sendAppStateToFirebase(finalState);
    return wasSynced;
  } catch {
    return false;
  }
}

export async function loadInitialState(
  frameToLoad: string,
  defaultFrameName: string,
  defaultPageName: string,
): Promise<AppState | null> {
  if (typeof window === "undefined") return null;

  const sessionState = readSession();
  if (sessionState) {
    const locked = sessionState.isLocked ?? false;
    setLockIndicator(locked);

    if (frameToLoad !== defaultFrameName) {
      const framesCopy = { ...sessionState.frames };
      delete (framesCopy as Record<string, unknown>)["TopFrame"];
      if (framesCopy[frameToLoad]) {
        const sourceFrame = framesCopy[frameToLoad];
        delete framesCopy[frameToLoad];
        framesCopy[defaultFrameName] = {
          ...sourceFrame,
          name: defaultFrameName,
        };
      }
      const remapped: AppState = {
        rootPage: sessionState.rootPage,
        frames: framesCopy,
        frameOrder: sessionState.frameOrder,
        currentFrame: defaultFrameName,
        pagesByOrigin: sessionState.pagesByOrigin,
        snippetProperties: sessionState.snippetProperties,
        isLocked: locked,
      };
      await writeSession(remapped);
      return remapped;
    }

    const out: AppState = {
      rootPage: sessionState.rootPage,
      frames: sessionState.frames,
      frameOrder: sessionState.frameOrder,
      currentFrame: defaultFrameName,
      pagesByOrigin: sessionState.pagesByOrigin,
      snippetProperties: sessionState.snippetProperties,
      isLocked: locked,
    };
    await writeSession(out);
    if (locked) return out;
  }

  const baseState: AppState = sessionState ?? {
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
    isLocked: false,
  };

  const pathSegments = window.location.pathname.split("/").filter(Boolean);
  const documentId = pathSegments[0] ?? "";

  if (/^[A-Za-z0-9]{20}$/.test(documentId)) {
    try {
      notifySyncStart();
      const snapshot = await getDoc(
        doc(firestoreDatabase, "sbStates", documentId),
      );
      notifySyncSuccess();

      if (snapshot.exists()) {
        const data = snapshot.data() as { stateJson?: string };
        const stateJsonString = (data?.stateJson ?? "").trim();
        if (stateJsonString !== "") {
          let parsedState: AppState | null = null;
          try {
            parsedState = JSON.parse(stateJsonString) as AppState;
          } catch {
            parsedState = null;
          }
          if (parsedState) {
            const locked = parsedState.isLocked ?? false;
            setLockIndicator(locked);

            if (frameToLoad !== defaultFrameName) {
              const newFrames = { ...parsedState.frames };
              delete (newFrames as Record<string, unknown>)["TopFrame"];
              if (newFrames[frameToLoad]) {
                const targetFrame = newFrames[frameToLoad];
                delete newFrames[frameToLoad];
                newFrames[defaultFrameName] = {
                  ...targetFrame,
                  name: defaultFrameName,
                };
              }
              const remappedState: AppState = {
                rootPage: parsedState.rootPage,
                frames: newFrames,
                frameOrder: parsedState.frameOrder,
                currentFrame: defaultFrameName,
                pagesByOrigin: parsedState.pagesByOrigin,
                snippetProperties: parsedState.snippetProperties,
                isLocked: locked,
              };
              await writeSession(remappedState);
              return remappedState;
            }

            const fullState: AppState = {
              rootPage: parsedState.rootPage,
              frames: parsedState.frames,
              frameOrder: parsedState.frameOrder,
              currentFrame: defaultFrameName,
              pagesByOrigin: parsedState.pagesByOrigin,
              snippetProperties: parsedState.snippetProperties,
              isLocked: locked,
            };
            await writeSession(fullState);
            return fullState;
          }
        }
      }
    } catch {
      notifySyncError();
    }
  }

  setLockIndicator(baseState.isLocked ?? false);
  await writeSession(baseState);
  return baseState;
}

export async function persistStateToSession(
  appState: AppState,
): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const locked = readSession()?.isLocked ?? false;
  const existingSession = (readSession() || {}) as AppState;

  const nextSessionState: AppState = {
    ...existingSession,
    rootPage: appState.rootPage,
    frames: appState.frames,
    frameOrder: appState.frameOrder,
    currentFrame: appState.currentFrame,
    pagesByOrigin: appState.pagesByOrigin ?? existingSession.pagesByOrigin,
    snippetProperties:
      appState.snippetProperties ?? existingSession.snippetProperties,
    isLocked: locked,
  };

  const wasSynced = await writeSession(nextSessionState);
  return wasSynced;
}

export function loadPagesByOriginWithDefaults(
  defaultPagesByOrigin: PagesByOrigin,
): PagesByOrigin {
  if (typeof window === "undefined") return { ...defaultPagesByOrigin };

  const sessionValue = readSession();
  const knownOriginList = knownFrameOrigins;

  const mergedPagesByOrigin: PagesByOrigin = {};
  for (const originUrl of knownOriginList)
    mergedPagesByOrigin[originUrl] = ["Home Page"];

  const storedPagesByOrigin = sessionValue?.pagesByOrigin as
    | PagesByOrigin
    | undefined;
  if (storedPagesByOrigin) {
    for (const [originUrl, pageNames] of Object.entries(storedPagesByOrigin)) {
      const uniquePages = Array.from(
        new Set<string>(["Home Page", ...cleanPageList(pageNames || [])]),
      );
      mergedPagesByOrigin[originUrl] = uniquePages;
    }
  }

  for (const [originUrl, pageNames] of Object.entries(defaultPagesByOrigin)) {
    const existingList = mergedPagesByOrigin[originUrl] || ["Home Page"];
    const uniquePages = Array.from(
      new Set<string>([...existingList, ...cleanPageList(pageNames || [])]),
    );
    mergedPagesByOrigin[originUrl] = uniquePages;
  }

  return mergedPagesByOrigin;
}

export function persistPagesByOrigin(pagesByOrigin: PagesByOrigin): void {
  if (typeof window === "undefined") return;
  const existingSession = (readSession() || {}) as AppState;
  const stateToWrite = {
    ...existingSession,
    pagesByOrigin: { ...pagesByOrigin },
  } as AppState;
  void writeSession(stateToWrite);
}

export async function setFrameProperties(
  stagedMap: Record<string, Record<string, boolean>>,
): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const sessionValue = readSession();
  if (!sessionValue?.frames) return false;

  const nextSession: AppState = {
    ...sessionValue,
    frames: { ...sessionValue.frames },
  };

  const frameNames = Object.keys(stagedMap);
  for (const frameName of frameNames) {
    const stagedForFrame = stagedMap[frameName];
    if (!nextSession.frames[frameName]) continue;

    const frameNode = { ...nextSession.frames[frameName] };
    const nextProperties =
      frameNode.properties && typeof frameNode.properties === "object"
        ? { ...frameNode.properties }
        : {};

    const propertyNames = Object.keys(stagedForFrame);
    for (const propertyName of propertyNames) {
      const isEnabled = stagedForFrame[propertyName];
      if (isEnabled) {
        nextProperties[propertyName] = true;
      } else {
        delete nextProperties[propertyName];
      }
    }

    if (Object.keys(nextProperties).length > 0) {
      frameNode.properties = nextProperties;
    } else {
      delete frameNode.properties;
    }

    nextSession.frames[frameName] = frameNode;
  }

  const wasSaved = await writeSession(nextSession);
  return wasSaved;
}

export function getFrameProperties(frameName: string): Record<string, unknown> {
  const sessionValue = readSession();
  const frameNode = sessionValue?.frames?.[frameName];
  const properties = frameNode?.properties;
  return properties && typeof properties === "object" ? { ...properties } : {};
}

export function setSnippetProperties(
  snippetProperties: SnippetProperties,
): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  const existingSession = (readSession() || {}) as AppState;
  const nextSessionState = {
    ...existingSession,
    snippetProperties: { ...snippetProperties },
  } as AppState;
  return writeSession(nextSessionState);
}

export function getSnippetProperties(): SnippetProperties | undefined {
  const sessionValue = readSession();
  const stored = sessionValue?.snippetProperties as
    | SnippetProperties
    | undefined;
  return stored && typeof stored === "object" ? { ...stored } : undefined;
}

export async function setLocked(next: boolean): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const current =
    readSession() ||
    ({
      rootPage: "",
      frames: {},
      frameOrder: [],
      currentFrame: "",
      pagesByOrigin: undefined,
      snippetProperties: undefined,
      isLocked: false,
    } as AppState);

  const nextState: AppState = { ...current, isLocked: !!next };
  setLockIndicator(!!next);
  const ok = await writeSession(nextState, { forceSync: true });
  return ok;
}

async function sendAppStateToFirebase(
  applicationState: AppState,
): Promise<boolean> {
  const pathSegments = window.location.pathname.split("/").filter(Boolean);
  const documentId = pathSegments[0] ?? "";
  if (!/^[A-Za-z0-9]{20}$/.test(documentId)) return false;

  const stateJsonString = JSON.stringify(applicationState);
  try {
    notifySyncStart();
    await setDoc(
      doc(firestoreDatabase, "sbStates", documentId),
      { stateJson: stateJsonString },
      { merge: true },
    );
    notifySyncSuccess();
    return true;
  } catch (error) {
    console.error("firebase:setDoc failed", error);
    notifySyncError();
    return false;
  }
}
