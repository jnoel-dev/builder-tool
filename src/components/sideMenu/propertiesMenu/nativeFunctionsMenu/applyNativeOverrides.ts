type NativeFunctionsMap = {
  overrideGetComputedStyle?: () => void;
  overrideRequest?: () => void;
  overridePromiseWithZone?: () => void;
  [functionName: string]: (() => void) | undefined;
};

function getFunctionNamesFromCurrentScript(): string[] {
  const currentScriptElement =
    document.currentScript as HTMLScriptElement | null;
  if (!currentScriptElement) return [];
  const rawFunctionNames =
    currentScriptElement.getAttribute("data-names") || "";
  const functionNames = rawFunctionNames
    .split(",")
    .map((name) => name.trim())
    .filter((name) => name.length > 0);
  return functionNames;
}

function applyNativeOverrides(functionNames: string[]): void {
  const nativeFunctionsApi =
    ((window as unknown as { NativeFunctions?: NativeFunctionsMap })
      .NativeFunctions as NativeFunctionsMap | undefined) ||
    (window as unknown as NativeFunctionsMap);

  for (
    let functionIndex = 0;
    functionIndex < functionNames.length;
    functionIndex++
  ) {
    const functionName = functionNames[functionIndex];
    const functionReference = nativeFunctionsApi[functionName];
    if (typeof functionReference === "function") {
      functionReference();
    }
  }
}

(function bootstrapApplyNativeOverrides(): void {
  const functionNames = getFunctionNamesFromCurrentScript();
  if (functionNames.length === 0) return;
  applyNativeOverrides(functionNames);
})();
