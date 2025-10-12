export {};

declare global {
  interface Window {
    WalkMeConfigCallback?: (...args: any[]) => any;
    fixedCallback?: (...args: any[]) => any;
    __lastInterceptedConfig?: unknown;
  }
}

function setIdpInactive(updatedObject: any): void {
  const externalConfig = updatedObject["ExternalConfig"];
  if (externalConfig && typeof externalConfig === "object") {
    const icConfig = (externalConfig as any)["IcConfig"] || (externalConfig as any)["ICConfig"];
    if (icConfig && typeof icConfig === "object") {
      const idpConfig = (icConfig as any)["idp"] || (icConfig as any)["Idp"] || (icConfig as any)["IDP"];
      if (idpConfig && typeof idpConfig === "object") {
        const activeValue = (idpConfig as any)["active"];
        if (activeValue === "true" || activeValue === true) {
          (idpConfig as any)["active"] = false;
        }
      }
    }
  }
}

function overrideWalkMeConfig(inputObject: unknown): unknown {
  if (inputObject && typeof inputObject === "object" && !Array.isArray(inputObject)) {
    const updatedObject: any = { ...(inputObject as any) };
    updatedObject["EndUserSettings"] = {
      Parameters: {},
      Method: "walkme",
      FallbackDisabled: true,
      CollectDataDisabled: true
    };

    const existingExcluded = updatedObject["ExcludedRuntimeFeatures"];
    let excludedList: string[] = Array.isArray(existingExcluded)
      ? existingExcluded.filter((item) => typeof item === "string")
      : [];
    if (!excludedList.includes("waitForEndUser")) {
      excludedList = [...excludedList, "waitForEndUser"];
    }
    updatedObject["ExcludedRuntimeFeatures"] = excludedList;

    return updatedObject;
  }
  return inputObject;
}


function overrideWalkMeSettings(inputObject: unknown): unknown {
  if (inputObject && typeof inputObject === "object" && !Array.isArray(inputObject)) {
    const updatedObject: any = { ...(inputObject as any) };
    setIdpInactive(updatedObject);

    const storageConfig = (updatedObject as any)["Storage"];
    if (storageConfig && typeof storageConfig === "object") {
      const sessionStorageFlag = (storageConfig as any)["ss"];
      if (sessionStorageFlag === "true" || sessionStorageFlag === true) {
        (storageConfig as any)["ss"] = false;
      }
    }

    return updatedObject;
  }
  return inputObject;
}


function createWrappedCallback(originalCallback: Function, label: string, transformer: (o: unknown) => unknown) {
  function wrappedCallback(this: unknown, ...argumentList: any[]) {
    if (argumentList.length > 0) {
      argumentList[0] = transformer(argumentList[0]);
    }
    const updatedFirstArgument = argumentList[0];
    if (updatedFirstArgument && typeof updatedFirstArgument === "object" && !Array.isArray(updatedFirstArgument)) {
      window.__lastInterceptedConfig = updatedFirstArgument;
      console.info("[Intercept]", label, "config updated", updatedFirstArgument);
    } else {
      console.info("[Intercept]", label, "non-object first argument", updatedFirstArgument);
    }
    return originalCallback.apply(this, argumentList);
  }
  return wrappedCallback;
}

function interceptGlobalCallback(
  callbackKey: "WalkMeConfigCallback" | "fixedCallback",
  label: string,
  transformer: (o: unknown) => unknown
): void {
  const existingCallback = (window as any)[callbackKey];
  if (typeof existingCallback === "function") {
    (window as any)[callbackKey] = createWrappedCallback(existingCallback, label, transformer);
    return;
  }
  let storedCallbackValue: any;
  Object.defineProperty(window as any, callbackKey, {
    configurable: true,
    enumerable: true,
    get: function getCallback() {
      return storedCallbackValue;
    },
    set: function setCallback(assignedValue: any) {
      storedCallbackValue =
        typeof assignedValue === "function" ? createWrappedCallback(assignedValue, label, transformer) : assignedValue;
    }
  });
}

function installWalkmeInterceptors(): void {
  interceptGlobalCallback("WalkMeConfigCallback", "WalkMeConfigCallback", overrideWalkMeConfig);
  interceptGlobalCallback("fixedCallback", "fixedCallback", overrideWalkMeSettings);
}

if (typeof window !== "undefined") {
  installWalkmeInterceptors();
}
