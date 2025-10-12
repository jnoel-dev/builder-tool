'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

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
  }
}

type FramePropertiesDisplayProps = {
  properties?: Record<string, unknown>;
};

function getCspNonce(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const metaElement = document.querySelector('meta[name="csp-nonce"]') as HTMLMetaElement | null;
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
  if (nonceValue) (scriptElement as any).nonce = nonceValue;
  document.head.appendChild(scriptElement);
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
    get: function (targetObject, propertyName) {
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

  function OverriddenRequest(this: any, requestInput?: any, requestInit?: any) {
    const originalInstance = new OriginalRequest(requestInput, requestInit);
    const requestUrlLower = String((originalInstance as any).url || "").toLowerCase();
    if (requestUrlLower.includes("firestore")) {
      return originalInstance;
    }
    return new Proxy(originalInstance, {
      get(targetObject, propertyName, receiverObject) {
        if (propertyName === "headers") {
          return {};
        }
        return Reflect.get(targetObject, propertyName, receiverObject);
      }
    });
  }

  (OverriddenRequest as any).prototype = OriginalRequest.prototype;
  (window as any).Request = OverriddenRequest as any;
}

export function overridePromiseWithZone(): void {
  if (typeof window === "undefined") return;
  const windowAny = window as any;
  if (windowAny.Zone || windowAny.ZoneAwarePromise) return;
  loadScriptOnce("/zone.min.js", "zonejs-core");
}

export function overrideSetAttribute(): void {
  if (typeof window === "undefined") return;
  const elementPrototype = (window as any).Element && (window as any).Element.prototype;
  if (!elementPrototype || typeof elementPrototype.setAttribute !== "function") return;

  const originalSetAttribute = elementPrototype.setAttribute;

  function sanitizedSetAttribute(this: Element, attributeName: string, attributeValue: any): void {
    const attributeNameLower = String(attributeName).toLowerCase();
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
      value: sanitizedSetAttribute
    });
  } catch {
    elementPrototype.setAttribute = sanitizedSetAttribute as any;
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
    overrideSetAttribute
  };
}

const NativeFunctions = {
  overrideGetComputedStyle,
  overrideRequest,
  overridePromiseWithZone,
  overrideSetAttribute
};
export default NativeFunctions;
