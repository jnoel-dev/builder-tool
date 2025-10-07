import "./globals.css";
import { headers } from "next/headers";
import { BackgroundManager } from "@/components/contexts/backgroundContext/BackgroundManager";
import BaseLayout from "@/components/baseLayout/BaseLayout";

function getSameOriginTarget(): string {
  return process.env.NODE_ENV === "production" ? "https://build.jonnoel.dev" : "http://localhost:3000";
}
function getCrossOriginTarget(): string {
  return process.env.NODE_ENV === "production" ? "https://frame.jonnoel.dev" : "http://localhost:3001";
}
function buildCsp(nonceValue?: string): string {
  const sameOrigin = getSameOriginTarget();
  const crossOrigin = getCrossOriginTarget();
  const allowedScriptSources = ["'self'", "'unsafe-inline'", sameOrigin, crossOrigin];
  if (nonceValue) allowedScriptSources.push(`'nonce-${nonceValue}'`);
  return `script-src ${allowedScriptSources.join(" ")};`;
}

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const incomingHeaders = await headers();
  const framePropertiesJson = incomingHeaders.get("x-frame-properties") ?? "{}";
  const snippetPropertiesJson = incomingHeaders.get("x-snippet-properties") ?? "{}";

  let frameProperties: Record<string, string> = {};
  try {
    frameProperties = JSON.parse(framePropertiesJson) as Record<string, string>;
  } catch {}

 
  let snippetProperties: Record<string, string> = {};
  try {
    snippetProperties = JSON.parse(snippetPropertiesJson) as Record<string, string>;
  } catch {}

  const hasCspMeta = "cspM" in frameProperties || "cspMN" in frameProperties;

  const rawNonce = incomingHeaders.get("x-nonce");
  const scriptNonce = rawNonce && rawNonce.trim().length > 0 ? rawNonce.trim() : undefined;

  const propertyToFunctionName: Record<string, string> = {
    nfGCS: "overrideGetComputedStyle",
    nfR: "overrideRequest",
    nfP: "overridePromiseWithZone"
  };
  const overrideFunctionNames = Object.keys(frameProperties)
    .filter((key) => key in propertyToFunctionName)
    .map((key) => propertyToFunctionName[key]);

  const shouldLoadNativeFunctions = overrideFunctionNames.length > 0;

  const nonceValue = scriptNonce || "";

  const inlineApply = `(function(){var names=${JSON.stringify(
    overrideFunctionNames
  )};var api=window.NativeFunctions||window;for(var i=0;i<names.length;i++){var fn=api[names[i]];if(typeof fn==="function"){try{fn();}catch(_){}}}})();`;


  const cdnDomain = (snippetProperties["cdnDomain"] || "").trim();
  const systemGuid = (snippetProperties["systemGuid"] || "").trim();
  const environmentPathName = (snippetProperties["environmentPathName"] || "").trim();

  const shouldInjectWalkme =
    cdnDomain.length > 0 && systemGuid.length > 0; 

  const walkmeSrc = shouldInjectWalkme
    ? (environmentPathName.length > 0
        ? `https://${cdnDomain}/users/${systemGuid}/${environmentPathName}/walkme_${systemGuid}_https.js`
        : `https://${cdnDomain}/users/${systemGuid}/walkme_${systemGuid}_https.js`)
    : "";

  const inlineWalkme =
    shouldInjectWalkme
      ? `(function(){var walkme=document.createElement('script'); walkme.type='text/javascript'; walkme.async=true; walkme.src='${walkmeSrc}'; var s=document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(walkme,s); window._walkmeConfig={smartLoad:true};})();`
      : "";

  return (
<html lang="en">
  <head>
    {hasCspMeta ? <meta httpEquiv="Content-Security-Policy" content={buildCsp(scriptNonce)} /> : null}

    {shouldLoadNativeFunctions ? (
      <>
        <script suppressHydrationWarning src="/nativeFunctions.js" nonce={nonceValue}></script>
        <script suppressHydrationWarning nonce={nonceValue} dangerouslySetInnerHTML={{ __html: inlineApply }} />
      </>
    ) : null}

    {shouldInjectWalkme ? (
      <>
<script
  suppressHydrationWarning
  nonce={nonceValue}
  dangerouslySetInnerHTML={{
    __html: `(function interceptCallbacks(){
  function transformConfigObject(inputObject) {
    if (inputObject && typeof inputObject === 'object' && !Array.isArray(inputObject)) {
      const updatedObject = { ...inputObject };
      updatedObject['EndUserSettings'] = {
        'Parameters': {},
        'Method': 'walkme',
        'FallbackDisabled': true,
        'CollectDataDisabled': true
      };
      const externalConfig = updatedObject['ExternalConfig'];
      if (externalConfig && typeof externalConfig === 'object') {
        const icConfig = externalConfig['IcConfig'];
        if (icConfig && typeof icConfig === 'object') {
          const identityProviderConfig = icConfig['idp'];
          if (identityProviderConfig && typeof identityProviderConfig === 'object') {
            if (identityProviderConfig['active'] === 'true') {
              identityProviderConfig['active'] = false;
            }
          }
        }
      }
      return updatedObject;
    }
    return inputObject;
  }

  function createWrappedCallback(originalCallback, label) {
    return function wrappedCallback() {
      const argumentList = Array.from(arguments);
      if (argumentList.length > 0) {
        argumentList[0] = transformConfigObject(argumentList[0]);
      }
      const updatedFirstArgument = argumentList[0];
      if (updatedFirstArgument && typeof updatedFirstArgument === 'object' && !Array.isArray(updatedFirstArgument)) {
        window.__lastInterceptedConfig = updatedFirstArgument;
        console.info('[Intercept] ' + label + ' config updated', updatedFirstArgument);
      } else {
        console.info('[Intercept] ' + label + ' non-object first argument', updatedFirstArgument);
      }
      return originalCallback.apply(this, argumentList);
    };
  }

  function interceptGlobalCallback(callbackKey, label) {
    const existingCallback = window[callbackKey];
    if (typeof existingCallback === 'function') {
      window[callbackKey] = createWrappedCallback(existingCallback, label);
      return;
    }
    let storedCallbackValue;
    Object.defineProperty(window, callbackKey, {
      configurable: true,
      enumerable: true,
      get: function getCallback() { return storedCallbackValue; },
      set: function setCallback(assignedValue) {
        storedCallbackValue = typeof assignedValue === 'function' ? createWrappedCallback(assignedValue, label) : assignedValue;
      }
    });
  }

  interceptGlobalCallback('WalkMeConfigCallback', 'WalkMeConfigCallback');
  interceptGlobalCallback('fixedCallback', 'fixedCallback');
})();`,
  }}
/>

        <script
          suppressHydrationWarning
          type="text/javascript"
          nonce={nonceValue}
          dangerouslySetInnerHTML={{ __html: inlineWalkme }}
        />
      </>
    ) : null}
  </head>
  <body>
    <BackgroundManager>
      <BaseLayout>{children}</BaseLayout>
    </BackgroundManager>
  </body>
</html>

  );
}
