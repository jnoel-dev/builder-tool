import { POST_MESSAGE_LOG_ENABLED } from "./FrameManager";
import type { FrameElement } from "./frameUtils";

type FramesByName = Record<string, FrameElement[]>;

type RequestSyncMessage = { type: "requestSync"; frameName: string; pageName?: string };
type UpdatePositionMessage = {
  type: "updateElementPosition";
  frameName: string;
  elementId: string;
  xPercent: number;
  yPercent: number;
};
type RemoveElementMessage = {
  type: "removeElement";
  frameName: string;
  elementId: string;
  isFrameOrContainer: boolean;
};


type TopIncomingMessage =
  | RequestSyncMessage
  | UpdatePositionMessage
  | RemoveElementMessage

type ChildWindowInfo = {
  childWindow: Window;
  currentPage: string;
  
}
const childWindowsByName = new Map<string, ChildWindowInfo>();

export function sendSyncFrameToChild(
  targetFrameName: string,
  frames: FramesByName,
  explicitTargetWindow?: Window | null
): void {
  if (!targetFrameName || targetFrameName === "TopFrame") return;

  const resolvedTargetWindow = explicitTargetWindow ?? getKnownChildWindowInfoByFrameName(targetFrameName)?.childWindow;
  if (!resolvedTargetWindow) {
    if (POST_MESSAGE_LOG_ENABLED) {
      console.warn(`[PostMessage Send] No contentWindow found for "${targetFrameName}"`);
    }
    return;
  }

  const payload = { type: "syncFrame", frameName: targetFrameName, frames } as const;

  if (POST_MESSAGE_LOG_ENABLED) {
    console.log(
      `[PostMessage Send] from "${window.name || "TopFrame"}" to "${targetFrameName}" | type: syncFrame | content:`,
      payload
    );
  }

  try {
    resolvedTargetWindow.postMessage(payload, "*");
  } catch (sendError) {
    if (POST_MESSAGE_LOG_ENABLED) {
      console.warn(`[PostMessage Send] failed to post to "${targetFrameName}":`, sendError);
    }
  }
}

export function installTopMessageHandler(
  getFramesForFrameName: (externalFrameName: string, requestedPageName?: string) => Record<string, FrameElement[]>,
  registerFrameByName: (externalFrameName: string) => void,
  updateElementPositionTop: (elementId: string, x: number, y: number, frameName: string) => void,
  removeElementTop: (elementId: string, frameName: string) => void,
  unregisterFrameById: (frameId: string) => void
): () => void { 
  if (window.top !== window) return () => {};

  function onMessage(event: MessageEvent) {
    const incoming = event.data as TopIncomingMessage | { type?: unknown };




    if (!incoming || typeof (incoming as any).type !== "string") return;

    const messageType = (incoming as any).type as TopIncomingMessage["type"];
    if (
      messageType !== "requestSync" &&
      messageType !== "updateElementPosition" &&
      messageType !== "removeElement" 
    )
      return;

    const fromFrameName = (incoming as any).frameName ?? "Unknown";

    if (POST_MESSAGE_LOG_ENABLED) {
      console.log(
        `[PostMessage Receive] at "TopFrame" from "${fromFrameName}" | type: ${messageType} | content:`,
        incoming
      );
    }
    
    if ("frameName" in incoming && (incoming as any).frameName && event.source) {
      registerChildWindow((incoming as any).frameName as string, event.source as Window,(incoming as any).pageName);
    }

    switch (messageType) {
      case "requestSync": {
        const { frameName, pageName } = incoming as RequestSyncMessage;
        registerFrameByName(frameName);
        
        const frames = getFramesForFrameName(frameName, pageName);
        sendSyncFrameToChild(frameName, frames, event.source as Window);
        break;
      }

      case "updateElementPosition": {
        const { frameName, elementId, xPercent, yPercent } = incoming as UpdatePositionMessage;
        updateElementPositionTop(elementId, xPercent, yPercent, frameName);
        break;
      }
      case "removeElement": {
        const { frameName, elementId, isFrameOrContainer } = incoming as RemoveElementMessage;
        if (isFrameOrContainer) unregisterFrameById(elementId);
        removeElementTop(elementId, frameName);
        break;
      }
    }
  }

  window.addEventListener("message", onMessage);
  return () => window.removeEventListener("message", onMessage);
}

export function registerChildWindow(frameName: string, childWindow: Window, currentPage: string) {
  childWindowsByName.set(frameName, {
    childWindow: childWindow,
    currentPage: currentPage
  });
}

export function getKnownChildWindowInfoByFrameName(frameName: string): ChildWindowInfo | undefined {
return childWindowsByName.get(frameName);
}
