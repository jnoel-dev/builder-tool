declare global {
  interface Window {
    overrideGetComputedStyle?: () => void;
    overrideRequest?: () => void;
    overridePromiseWithZone?: () => void;
    NativeFunctions?: {
      overrideGetComputedStyle: () => void;
      overrideRequest: () => void;
      overridePromiseWithZone: () => void;
    };
  }
}

function getCspNonce(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const el = document.querySelector('meta[name="csp-nonce"]') as HTMLMetaElement | null;
  const v = el?.content;
  return v && v.length > 0 ? v : undefined;
}

function loadScriptOnce(src: string, id: string): void {
  if (typeof document === "undefined") return;
  if (document.getElementById(id)) return;
  const el = document.createElement("script");
  el.id = id;
  el.src = src;
  el.async = false;
  const nonce = getCspNonce();
  if (nonce) (el as any).nonce = nonce;
  document.head.appendChild(el);
}

export function overrideGetComputedStyle(): void {
  if (typeof window === "undefined") return;
  const existingGetComputedStyle = (window as any).getComputedStyle;
  if (typeof existingGetComputedStyle !== "function") return;

  const emptyString = "";

  function returnEmptyString(): string {
    return emptyString;
  }

  function createEmptyIterator() {
    return { next: function () { return { done: true, value: undefined }; } };
  }

  const blankComputedStyleProxy = new Proxy(Object.create(null), {
    get: function (_target, propertyName) {
      if (propertyName === "getPropertyValue") return returnEmptyString;
      if (propertyName === "getPropertyPriority") return returnEmptyString;
      if (propertyName === "item") return returnEmptyString;
      if (propertyName === "length") return 0;
      if (propertyName === Symbol.iterator) return createEmptyIterator;
      return emptyString;
    },
    has: function () { return false; },
    ownKeys: function () { return []; },
    getOwnPropertyDescriptor: function () {
      return { configurable: true, enumerable: false };
    }
  });

  function provideBlankComputedStyle(): any {
    return blankComputedStyleProxy;
  }

  try {
    Object.defineProperty(window, "getComputedStyle", {
      configurable: true,
      writable: true,
      value: provideBlankComputedStyle
    });
  } catch {
    (window as any).getComputedStyle = provideBlankComputedStyle;
  }
}

export function overrideRequest(): void {
  if (typeof window === "undefined") return;
  const OriginalRequest = (window as any).Request;
  if (typeof OriginalRequest !== "function") return;

  function OverriddenRequest(this: any, input?: any, init?: any) {
    const originalInstance = new OriginalRequest(input, init);
    const url = String((originalInstance as any).url || "").toLowerCase();
    if (url.includes("firestore")) {
      return originalInstance;
    }
    return new Proxy(originalInstance, {
      get(target, propertyName, receiver) {
        if (propertyName === "headers") {
          return {};
        }
        return Reflect.get(target, propertyName, receiver);
      }
    });
  }

  (OverriddenRequest as any).prototype = OriginalRequest.prototype;
  (window as any).Request = OverriddenRequest as any;
}

export function overridePromiseWithZone(): void {
  if (typeof window === "undefined") return;
  const w = window as any;
  if (w.Zone || w.ZoneAwarePromise) return;

  loadScriptOnce("/zone.min.js", "zonejs-core");
}

if (typeof window !== "undefined") {
  window.overrideGetComputedStyle = overrideGetComputedStyle;
  window.overrideRequest = overrideRequest;
  window.overridePromiseWithZone = overridePromiseWithZone;
  window.NativeFunctions = {
    overrideGetComputedStyle,
    overrideRequest,
    overridePromiseWithZone
  };
}

const NativeFunctions = {
  overrideGetComputedStyle,
  overrideRequest,
  overridePromiseWithZone
};
export default NativeFunctions;
