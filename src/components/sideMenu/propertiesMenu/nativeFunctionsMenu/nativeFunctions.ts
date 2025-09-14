declare global {
  interface Window {
    overrideGetComputedStyle?: () => void;
  }
}

export function overrideGetComputedStyle(): void {
  if (typeof window === "undefined") return;
  const currentGetComputedStyle = (window as any).getComputedStyle;
  if (typeof currentGetComputedStyle !== "function") return;

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

if (typeof window !== "undefined") {
  (window as any).overrideGetComputedStyle = overrideGetComputedStyle;
  overrideGetComputedStyle();
}

export default overrideGetComputedStyle;
