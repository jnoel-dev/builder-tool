export {};

type IdpConfig = { active?: boolean | "true" | "false" };
type IcConfig = { idp?: IdpConfig; [key: string]: unknown };
type ExternalConfig = { IcConfig?: IcConfig; [key: string]: unknown };
type EndUserSettings = {
  Parameters: Record<string, unknown>;
  Method: string;
  FallbackDisabled: boolean;
  CollectDataDisabled: boolean;
};
type StorageConfig = {
  ss?: boolean | "true" | "false";
  [key: string]: unknown;
};
type WalkMeConfig = {
  ExternalConfig?: ExternalConfig;
  EndUserSettings?: EndUserSettings;
  ExcludedRuntimeFeatures?: unknown;
  Storage?: StorageConfig;
  [key: string]: unknown;
};

declare global {
  interface Window {
    WalkMeConfigCallback?: (
      config: WalkMeConfig,
      ...rest: unknown[]
    ) => unknown;
    fixedCallback?: (config: WalkMeConfig, ...rest: unknown[]) => unknown;
    __lastInterceptedConfig?: WalkMeConfig | null;
  }
}

function setIdpInactive(updatedObject: WalkMeConfig): void {
  const externalConfig = updatedObject.ExternalConfig;
  if (externalConfig && typeof externalConfig === "object") {
    const icConfig = externalConfig.IcConfig;
    if (icConfig && typeof icConfig === "object") {
      const idpConfig = icConfig.idp;
      if (idpConfig && typeof idpConfig === "object") {
        const activeValue = idpConfig.active;
        if (activeValue === "true" || activeValue === true) {
          idpConfig.active = false;
        }
      }
    }
  }
}

function overrideWalkMeConfig(inputObject: WalkMeConfig): WalkMeConfig {
  if (
    inputObject &&
    typeof inputObject === "object" &&
    !Array.isArray(inputObject)
  ) {
    const updatedObject: WalkMeConfig = { ...inputObject };
    updatedObject.EndUserSettings = {
      Parameters: {},
      Method: "walkme",
      FallbackDisabled: true,
      CollectDataDisabled: true,
    };
    const existingExcluded = updatedObject.ExcludedRuntimeFeatures as unknown;
    let excludedList: string[] = Array.isArray(existingExcluded)
      ? (existingExcluded as unknown[]).filter(
          (item): item is string => typeof item === "string",
        )
      : [];
    if (!excludedList.includes("waitForEndUser")) {
      excludedList = [...excludedList, "waitForEndUser"];
    }
    updatedObject.ExcludedRuntimeFeatures = excludedList;
    return updatedObject;
  }
  return inputObject;
}

function overrideWalkMeSettings(inputObject: WalkMeConfig): WalkMeConfig {
  if (
    inputObject &&
    typeof inputObject === "object" &&
    !Array.isArray(inputObject)
  ) {
    const updatedObject: WalkMeConfig = { ...inputObject };
    setIdpInactive(updatedObject);
    const storageConfig = updatedObject.Storage;
    if (storageConfig && typeof storageConfig === "object") {
      const sessionStorageFlag = storageConfig.ss;
      if (sessionStorageFlag === "true" || sessionStorageFlag === true) {
        storageConfig.ss = false;
      }
    }
    return updatedObject;
  }
  return inputObject;
}

function createWrappedCallback(
  originalCallback: (config: WalkMeConfig, ...rest: unknown[]) => unknown,
  label: string,
  transformer: (configObject: WalkMeConfig) => WalkMeConfig,
) {
  function wrappedCallback(this: unknown, ...argumentList: unknown[]) {
    const argumentTuple = argumentList as [WalkMeConfig, ...unknown[]];
    if (argumentTuple.length > 0) {
      argumentTuple[0] = transformer(argumentTuple[0]);
    }
    const updatedFirstArgument = argumentTuple[0];
    if (
      updatedFirstArgument &&
      typeof updatedFirstArgument === "object" &&
      !Array.isArray(updatedFirstArgument)
    ) {
      window.__lastInterceptedConfig = updatedFirstArgument;
    }
    return (
      originalCallback as (
        ...callArgumentTuple: [WalkMeConfig, ...unknown[]]
      ) => unknown
    ).apply(this, argumentTuple);
  }
  return wrappedCallback as (
    config: WalkMeConfig,
    ...rest: unknown[]
  ) => unknown;
}

function interceptGlobalCallback(
  callbackKey: "WalkMeConfigCallback" | "fixedCallback",
  label: string,
  transformer: (configObject: WalkMeConfig) => WalkMeConfig,
): void {
  const existingCallback = window[callbackKey];
  if (typeof existingCallback === "function") {
    window[callbackKey] = createWrappedCallback(
      existingCallback,
      label,
      transformer,
    ) as (typeof window)[typeof callbackKey];
    return;
  }
  let storedCallbackValue:
    | ((config: WalkMeConfig, ...rest: unknown[]) => unknown)
    | undefined;
  Object.defineProperty(window, callbackKey, {
    configurable: true,
    enumerable: true,
    get: function getCallback() {
      return storedCallbackValue;
    },
    set: function setCallback(assignedValue) {
      storedCallbackValue =
        typeof assignedValue === "function"
          ? createWrappedCallback(
              assignedValue as (
                config: WalkMeConfig,
                ...rest: unknown[]
              ) => unknown,
              label,
              transformer,
            )
          : undefined;
    },
  });
}

function installWalkmeInterceptors(): void {
  interceptGlobalCallback(
    "WalkMeConfigCallback",
    "WalkMeConfigCallback",
    overrideWalkMeConfig,
  );
  interceptGlobalCallback(
    "fixedCallback",
    "fixedCallback",
    overrideWalkMeSettings,
  );
}

if (typeof window !== "undefined") {
  installWalkmeInterceptors();
}
