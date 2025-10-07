"use strict";
(() => {
  // src/scripts/forceLoadWMID.ts
  function setIdpInactive(updatedObject) {
    const externalConfig = updatedObject["ExternalConfig"];
    if (externalConfig && typeof externalConfig === "object") {
      const icConfig = externalConfig["IcConfig"] || externalConfig["ICConfig"];
      if (icConfig && typeof icConfig === "object") {
        const idpConfig = icConfig["idp"] || icConfig["Idp"] || icConfig["IDP"];
        if (idpConfig && typeof idpConfig === "object") {
          const activeValue = idpConfig["active"];
          if (activeValue === "true" || activeValue === true) {
            idpConfig["active"] = false;
          }
        }
      }
    }
  }
  function transformConfigForWalkMe(inputObject) {
    if (inputObject && typeof inputObject === "object" && !Array.isArray(inputObject)) {
      const updatedObject = { ...inputObject };
      updatedObject["EndUserSettings"] = {
        Parameters: {},
        Method: "walkme",
        FallbackDisabled: true,
        CollectDataDisabled: true
      };
      setIdpInactive(updatedObject);
      return updatedObject;
    }
    return inputObject;
  }
  function transformConfigForFixed(inputObject) {
    if (inputObject && typeof inputObject === "object" && !Array.isArray(inputObject)) {
      const updatedObject = { ...inputObject };
      setIdpInactive(updatedObject);
      return updatedObject;
    }
    return inputObject;
  }
  function createWrappedCallback(originalCallback, label, transformer) {
    function wrappedCallback(...argumentList) {
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
  function interceptGlobalCallback(callbackKey, label, transformer) {
    const existingCallback = window[callbackKey];
    if (typeof existingCallback === "function") {
      window[callbackKey] = createWrappedCallback(existingCallback, label, transformer);
      return;
    }
    let storedCallbackValue;
    Object.defineProperty(window, callbackKey, {
      configurable: true,
      enumerable: true,
      get: function getCallback() {
        return storedCallbackValue;
      },
      set: function setCallback(assignedValue) {
        storedCallbackValue = typeof assignedValue === "function" ? createWrappedCallback(assignedValue, label, transformer) : assignedValue;
      }
    });
  }
  function installWalkmeInterceptors() {
    interceptGlobalCallback("WalkMeConfigCallback", "WalkMeConfigCallback", transformConfigForWalkMe);
    interceptGlobalCallback("fixedCallback", "fixedCallback", transformConfigForFixed);
  }
  if (typeof window !== "undefined") {
    installWalkmeInterceptors();
  }
})();
