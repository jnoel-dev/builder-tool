"use client";

declare global {
  interface Window {
    overrideGetComputedStyle?: () => void;
    overrideRequest?: () => void;
    overridePromiseWithZone?: () => void;
    overrideSetAttribute?: () => void;
    NativeFunctions?: {
      overrideGetComputedStyle: () => void;
      overrideRequest: () => void;
      overridePromiseWithZone: () => void;
      overrideSetAttribute: () => void;
    };
    Zone?: unknown;
    ZoneAwarePromise?: unknown;
  }
}

function getCspNonce(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const metaElement = document.querySelector(
    'meta[name="csp-nonce"]',
  ) as HTMLMetaElement | null;
  const nonceValue = metaElement?.content;
  return nonceValue && nonceValue.length > 0 ? nonceValue : undefined;
}

function loadScriptOnce(scriptSrc: string, scriptId: string): void {
  if (typeof document === "undefined") return;
  if (document.getElementById(scriptId)) return;
  const scriptElement = document.createElement("script");
  scriptElement.id = scriptId;
  scriptElement.src = scriptSrc;
  scriptElement.async = false;
  const nonceValue = getCspNonce();
  if (nonceValue) (scriptElement as HTMLScriptElement).nonce = nonceValue;
  document.head.appendChild(scriptElement);
}

export function overrideGetComputedStyle(): void {
  if (typeof window === "undefined") return;
  const existingGetComputedStyle = window.getComputedStyle.bind(window);

  const emptyString = "";
  function returnEmptyString(): string {
    return emptyString;
  }
  function createEmptyIterator() {
    return { next: () => ({ done: true, value: undefined as unknown }) };
  }

  const blankComputedStyleProxy = new Proxy(Object.create(null), {
    get: (_targetObject: unknown, propertyName: PropertyKey) => {
      if (propertyName === "getPropertyValue") return returnEmptyString;
      if (propertyName === "getPropertyPriority") return returnEmptyString;
      if (propertyName === "item") return returnEmptyString;
      if (propertyName === "length") return 0;
      if (propertyName === Symbol.iterator) return createEmptyIterator;
      return emptyString;
    },
    has: () => false,
    ownKeys: () => [],
    getOwnPropertyDescriptor: () => ({ configurable: true, enumerable: false }),
  }) as unknown as CSSStyleDeclaration;

  function elementHasWalkmeClass(
    targetElement: Element | null | undefined,
  ): boolean {
    if (!targetElement) return false;
    if (
      (targetElement as Element).classList &&
      typeof (targetElement as Element).classList.forEach === "function"
    ) {
      let hasWalkmeClass = false;
      (targetElement as Element).classList.forEach((className: string) => {
        if (typeof className === "string" && className.includes("wm-"))
          hasWalkmeClass = true;
      });
      if (hasWalkmeClass) return true;
    }
    const rawClassAttribute =
      typeof (targetElement as Element).getAttribute === "function"
        ? (targetElement as Element).getAttribute("class")
        : null;
    return (
      typeof rawClassAttribute === "string" && rawClassAttribute.includes("wm-")
    );
  }

  function selectiveGetComputedStyle(
    targetElement: Element,
    pseudoElement?: string | null,
  ): CSSStyleDeclaration {
    if (elementHasWalkmeClass(targetElement)) {
      return blankComputedStyleProxy;
    }
    return existingGetComputedStyle(targetElement, pseudoElement ?? null);
  }

  try {
    Object.defineProperty(window, "getComputedStyle", {
      configurable: true,
      writable: true,
      value:
        selectiveGetComputedStyle as unknown as typeof window.getComputedStyle,
    });
  } catch {
    window.getComputedStyle =
      selectiveGetComputedStyle as unknown as typeof window.getComputedStyle;
  }
}

type RequestConstructor = new (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Request;

export function overrideRequest(): void {
  if (typeof window === "undefined") return;

  const OriginalRequest = window.Request as unknown as RequestConstructor;
  if (typeof OriginalRequest !== "function") return;

  const OverriddenRequest: RequestConstructor = function (
    requestInput: RequestInfo | URL,
    requestInit?: RequestInit,
  ): Request {
    const originalInstance = new OriginalRequest(requestInput, requestInit);
    const requestUrlLower = String(originalInstance.url || "").toLowerCase();

    if (requestUrlLower.includes("firestore")) {
      return originalInstance;
    }

    const proxiedInstance = new Proxy(originalInstance, {
      get(
        targetObject: Request,
        propertyName: string | symbol,
        receiverObject: unknown,
      ) {
        if (propertyName === "headers") {
          return new Headers();
        }
        return Reflect.get(
          targetObject as unknown as object,
          propertyName,
          receiverObject,
        );
      },
    });

    return proxiedInstance;
  } as unknown as RequestConstructor;

  (OverriddenRequest as unknown as { prototype: Request }).prototype = (
    OriginalRequest as unknown as {
      prototype: Request;
    }
  ).prototype;

  (window as unknown as { Request: RequestConstructor }).Request =
    OverriddenRequest;
}

export function overridePromiseWithZone(): void {
  if (typeof window === "undefined") return;
  if (window.Zone || window.ZoneAwarePromise) return;
  loadScriptOnce("/zone.min.js", "zonejs-core");
}

export function overrideSetAttribute(): void {
  if (typeof window === "undefined") return;

  const elementPrototype = (
    window as unknown as {
      Element?: { prototype?: Element };
    }
  ).Element?.prototype as Element | undefined;

  if (!elementPrototype || typeof elementPrototype.setAttribute !== "function")
    return;

  const originalSetAttribute = elementPrototype.setAttribute;

  function hasWmClass(this: Element): boolean {
    const classNameValue = (this as unknown as { className?: unknown })
      .className;
    if (typeof classNameValue === "string" && classNameValue.includes("wm-"))
      return true;
    if (
      classNameValue &&
      typeof (classNameValue as { baseVal?: unknown }).baseVal === "string" &&
      (classNameValue as { baseVal: string }).baseVal.includes("wm-")
    )
      return true;
    const classAttr = this.getAttribute?.("class");
    return typeof classAttr === "string" && classAttr.includes("wm-");
  }

  function sanitizedSetAttribute(
    this: Element,
    attributeName: string,
    attributeValue: string,
  ): void {
    const attributeNameLower = String(attributeName).toLowerCase();
    const elementHasWmClass = hasWmClass.call(this);

    if (!elementHasWmClass) {
      originalSetAttribute.call(this, attributeName, attributeValue);
      return;
    }

    if (attributeNameLower === "style") {
      if (this.hasAttribute("style")) this.removeAttribute("style");
      return;
    }

    originalSetAttribute.call(this, attributeName, attributeValue);
    if (this.hasAttribute("style")) this.removeAttribute("style");
  }

  try {
    Object.defineProperty(elementPrototype, "setAttribute", {
      configurable: true,
      writable: true,
      value: sanitizedSetAttribute,
    });
  } catch {
    (
      elementPrototype as unknown as {
        setAttribute: typeof sanitizedSetAttribute;
      }
    ).setAttribute = sanitizedSetAttribute;
  }
}

if (typeof window !== "undefined") {
  window.overrideGetComputedStyle = overrideGetComputedStyle;
  window.overrideRequest = overrideRequest;
  window.overridePromiseWithZone = overridePromiseWithZone;
  window.overrideSetAttribute = overrideSetAttribute;
  window.NativeFunctions = {
    overrideGetComputedStyle,
    overrideRequest,
    overridePromiseWithZone,
    overrideSetAttribute,
  };
}

const NativeFunctions = {
  overrideGetComputedStyle,
  overrideRequest,
  overridePromiseWithZone,
  overrideSetAttribute,
};
export default NativeFunctions;
