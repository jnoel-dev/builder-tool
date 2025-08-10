import {
  FrameElement,
  isSameOrigin,
} from "./frameUtils";

/* =========
   Message Types
   ========= */

export type RemoveElementMessage = {
  type: "removeElement";
  elementId: string;
  frameName: string;
  element?: FrameElement;
};

export type UpdateElementPositionMessage = {
  type: "updateElementPosition";
  elementId: string;
  frameName: string;
  xPercent: number;
  yPercent: number;
};

export type FrameAddedMessage = {
  type: "frameAdded";
  frameName: string;
};

export type FramePageChangedMessage = {
  type: "framePageChanged";
  frameName: string;
  pageName: string;
};

export type SyncFrameMessage = {
  type: "syncFrame";
  frameName: string;
  elements: Record<string, FrameElement[]>;
};

export type IframeReadyMessage = {
  type: "iframeReady";
  frameName: string;
};

export type FrameMessage =
  | RemoveElementMessage
  | UpdateElementPositionMessage
  | FrameAddedMessage
  | FramePageChangedMessage
  | SyncFrameMessage
  | IframeReadyMessage;

/* =========
   Callbacks expected by messaging
   ========= */

export interface TopWindowMessagingCallbacks {
  onRemoveElement: (frameName: string, elementId: string, element?: FrameElement) => void;
  onUpdateElementPosition: (frameName: string, elementId: string, xPercent: number, yPercent: number) => void;
  onRegisterFrame: (frameName: string) => void;
  onChildPageChanged: (frameName: string, pageName: string) => void;
}

export interface ChildWindowMessagingCallbacks {
  onApplySyncedElements: (elementsByFrame: Record<string, FrameElement[]>) => void;
}

/* =========
   Utilities
   ========= */

/**
 * Relay same-origin messages to opener when top-level window is controlling a popup.
 * This keeps editor and popup in sync without duplicating logic elsewhere.
 */
function relayToOpenerIfPresent(message: FrameMessage): void {
  if (window.opener && window.top === window) {
    window.opener.postMessage(message, window.location.origin);
  }
}

/* =========
   Top window: attach a single dispatcher
   ========= */

export function attachTopWindowMessaging(callbacks: TopWindowMessagingCallbacks): () => void {
  function handleMessage(event: MessageEvent): void {
    const data = event.data as FrameMessage | undefined;
    if (!data || typeof data !== "object") return;

    // For actions that require state mutation or trust, enforce same-origin.
    const requiresSameOrigin =
      data.type === "removeElement" ||
      data.type === "updateElementPosition" ||
      data.type === "frameAdded";

    if (requiresSameOrigin && !isSameOrigin(event)) return;

    switch (data.type) {
      case "removeElement": {
        callbacks.onRemoveElement(data.frameName, data.elementId, data.element);
        relayToOpenerIfPresent(data);
        break;
      }
      case "updateElementPosition": {
        callbacks.onUpdateElementPosition(
          data.frameName,
          data.elementId,
          data.xPercent,
          data.yPercent
        );
        relayToOpenerIfPresent(data);
        break;
      }
      case "frameAdded": {
        if (data.frameName !== "TopFrame") {
          callbacks.onRegisterFrame(data.frameName);
        }
        relayToOpenerIfPresent(data);
        break;
      }
      case "framePageChanged": {
        // Child frames send this cross-origin. We accept and hand off to the app layer.
        callbacks.onChildPageChanged(data.frameName, data.pageName);
        break;
      }
      case "syncFrame":
      case "iframeReady":
      default:
        // Not handled at top window level.
        break;
    }
  }

  window.addEventListener("message", handleMessage);
  return () => window.removeEventListener("message", handleMessage);
}

/* =========
   Child window: receive sync and announce readiness
   ========= */

export function attachChildWindowMessaging(callbacks: ChildWindowMessagingCallbacks): () => void {
  function handleMessage(event: MessageEvent): void {
    const data = event.data as FrameMessage | undefined;
    if (!data || typeof data !== "object") return;

    if (data.type === "syncFrame") {
      if (data.frameName !== (window as any).name) return;
      callbacks.onApplySyncedElements(data.elements);
    }
  }

  window.addEventListener("message", handleMessage);

  const parentOrOpener = window.opener ?? window.parent;
  parentOrOpener?.postMessage(
    { type: "iframeReady", frameName: (window as any).name } as IframeReadyMessage,
    "*"
  );

  return () => window.removeEventListener("message", handleMessage);
}

/* =========
   Child window: notify parent when page changes
   ========= */

export function attachChildPageChangeNotifier(getPageName: () => string): () => void {
  function notifyParent(): void {
    const message: FramePageChangedMessage = {
      type: "framePageChanged",
      frameName: (window as any).name,
      pageName: getPageName(),
    };
    window.parent.postMessage(message, "*");
  }

  let lastPathname = window.location.pathname;

  function notifyParentIfPathChanged(nextPathname?: string): void {
    const path = nextPathname ?? window.location.pathname;
    if (path === lastPathname) return;
    lastPathname = path;
    notifyParent();
  }

  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  function wrappedPushState(this: History, state: any, title: string, url?: string | URL | null) {
    const result = originalPushState.apply(this, [state, title, url as any]);
    if (url != null) {
      const next = new URL(url as any, window.location.href).pathname;
      notifyParentIfPathChanged(next);
    } else {
      notifyParentIfPathChanged();
    }
    return result;
  }

  function wrappedReplaceState(this: History, state: any, title: string, url?: string | URL | null) {
    const result = originalReplaceState.apply(this, [state, title, url as any]);
    if (url != null) {
      const next = new URL(url as any, window.location.href).pathname;
      notifyParentIfPathChanged(next);
    } else {
      notifyParentIfPathChanged();
    }
    return result;
  }

  history.pushState = wrappedPushState as typeof history.pushState;
  history.replaceState = wrappedReplaceState as typeof history.replaceState;

  function handlePopState(): void {
    notifyParentIfPathChanged();
  }

  // Ignore hash-only navigation
  function handleHashChange(): void {
    // no-op: same-document nav; do not notify parent
  }

  // Initial notify so parent can load the correct page state on first paint.
  notifyParent();

  window.addEventListener("popstate", handlePopState);
  window.addEventListener("hashchange", handleHashChange);

  return () => {
    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;
    window.removeEventListener("popstate", handlePopState);
    window.removeEventListener("hashchange", handleHashChange);
  };
}


/* =========
   Parent → Child: send element state to a specific iframe window
   ========= */

export function postSyncFrame(
  targetWindow: Window,
  frameName: string,
  elementsByFrame: Record<string, FrameElement[]>
): void {
  const message: SyncFrameMessage = {
    type: "syncFrame",
    frameName,
    elements: elementsByFrame,
  };
  // Cross-domain safe on purpose: children may be on a different origin.
  targetWindow.postMessage(message, "*");
}
