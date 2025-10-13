import "./globals.css";
import { headers } from "next/headers";
import { BackgroundManager } from "@/components/contexts/backgroundContext/BackgroundManager";
import BaseLayout from "@/components/baseLayout/BaseLayout";
import Script from "next/script";

function getSameOriginTarget(): string {
  return process.env.NODE_ENV === "production"
    ? "https://build.jonnoel.dev"
    : "http://localhost:3000";
}
function getCrossOriginTarget(): string {
  return process.env.NODE_ENV === "production"
    ? "https://frame.jonnoel.dev"
    : "http://localhost:3001";
}
function buildCsp(nonceValue?: string): string {
  const sameOrigin = getSameOriginTarget();
  const crossOrigin = getCrossOriginTarget();
  const allowedScriptSources = [
    "'self'",
    "'unsafe-inline'",
    sameOrigin,
    crossOrigin,
  ];
  if (nonceValue) allowedScriptSources.push(`'nonce-${nonceValue}'`);
  return `script-src ${allowedScriptSources.join(" ")};`;
}

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const incomingHeaders = await headers();
  const framePropertiesJson = incomingHeaders.get("x-frame-properties") ?? "{}";
  const snippetPropertiesJson =
    incomingHeaders.get("x-snippet-properties") ?? "{}";

  let frameProperties: Record<string, string> = {};
  try {
    frameProperties = JSON.parse(framePropertiesJson) as Record<string, string>;
  } catch {}

  let snippetProperties: Record<string, string> = {};
  try {
    snippetProperties = JSON.parse(snippetPropertiesJson) as Record<
      string,
      string
    >;
  } catch {}

  const hasCspMeta = "cspM" in frameProperties || "cspMN" in frameProperties;

  const rawNonce = incomingHeaders.get("x-nonce");
  const scriptNonce =
    rawNonce && rawNonce.trim().length > 0 ? rawNonce.trim() : undefined;

  const propertyToFunctionName: Record<string, string> = {
    nfGCS: "overrideGetComputedStyle",
    nfR: "overrideRequest",
    nfP: "overridePromiseWithZone",
    nfSA: "overrideSetAttribute",
  };
  const overrideFunctionNames = Object.keys(frameProperties)
    .filter((key) => key in propertyToFunctionName)
    .map((key) => propertyToFunctionName[key]);

  const shouldLoadNativeFunctions = overrideFunctionNames.length > 0;

  const nonceValue = scriptNonce || "";

  const inlineApply = `(function(){var names=${JSON.stringify(
    overrideFunctionNames,
  )};var api=window.NativeFunctions||window;for(var i=0;i<names.length;i++){var fn=api[names[i]];if(typeof fn==="function"){try{fn();}catch(_){}}}})();`;

  const cdnDomain = (snippetProperties["cdnDomain"] || "").trim();
  const systemGuid = (snippetProperties["systemGuid"] || "").trim();
  const environmentPathName = (
    snippetProperties["environmentPathName"] || ""
  ).trim();

  const shouldInjectWalkme = cdnDomain.length > 0 && systemGuid.length > 0;

  const shouldForceLoadWMID = snippetProperties["uuid"] === "forceLoad";

  const createIdentifierObject = (
    snippetProperties as unknown as Record<string, unknown>
  )["createIdentifier"] as
    | { type?: string; name?: string; value?: string; delayMs?: number }
    | undefined;

  const createIdentifierName =
    typeof createIdentifierObject?.name === "string"
      ? createIdentifierObject.name.trim()
      : "";
  const createIdentifierValue =
    typeof createIdentifierObject?.value === "string"
      ? createIdentifierObject.value.trim()
      : "";
  const createIdentifierType =
    typeof createIdentifierObject?.type === "string"
      ? createIdentifierObject.type.trim()
      : "";
  const createIdentifierDelayMs =
    typeof createIdentifierObject?.delayMs === "number"
      ? createIdentifierObject.delayMs
      : Number.NaN;

  const shouldCreateIdentifier =
    createIdentifierName.length > 0 && createIdentifierValue.length > 0;

  const inlineCreateIdentifier = shouldCreateIdentifier
    ? `(function(){var cfg=${JSON.stringify({
        type: createIdentifierType,
        name: createIdentifierName,
        value: createIdentifierValue,
        delayMs: Number.isFinite(createIdentifierDelayMs)
          ? createIdentifierDelayMs
          : 0,
      })};
var setWindowVar=function(){if(cfg.type==="variable"){setTimeout(function(){try{window[cfg.name]=cfg.value;}catch(_){}}, cfg.delayMs);}};
var setCookie=function(){if(cfg.type==="cookie"){setTimeout(function(){try{document.cookie=encodeURIComponent(cfg.name)+"="+encodeURIComponent(cfg.value)+"; path=/";}catch(_){}}, cfg.delayMs);}};
setWindowVar();setCookie();})();`
    : "";

  const walkmeSrc = shouldInjectWalkme
    ? environmentPathName.length > 0
      ? `https://${cdnDomain}/users/${systemGuid}/${environmentPathName}/walkme_${systemGuid}_https.js`
      : `https://${cdnDomain}/users/${systemGuid}/walkme_${systemGuid}_https.js`
    : "";

  const inlineWalkme = shouldInjectWalkme
    ? `(function(){var walkme=document.createElement('script'); walkme.type='text/javascript'; walkme.async=true; walkme.src='${walkmeSrc}'; var s=document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(walkme,s); window._walkmeConfig={smartLoad:true};})();`
    : "";

  return (
    <html lang="en">
      <head>
        {hasCspMeta ? (
          <meta
            httpEquiv="Content-Security-Policy"
            content={buildCsp(scriptNonce)}
          />
        ) : null}

        {shouldLoadNativeFunctions ? (
          <>
            <Script
              src="/nativeFunctions.js"
              strategy="beforeInteractive"
              nonce={nonceValue}
            />
            <Script
              id="apply-native-functions"
              strategy="beforeInteractive"
              nonce={nonceValue}
              dangerouslySetInnerHTML={{ __html: inlineApply }}
            />
          </>
        ) : null}

        {shouldForceLoadWMID ? (
          <Script
            src="/forceLoadWMID.js"
            strategy="beforeInteractive"
            nonce={nonceValue}
          />
        ) : null}

        {shouldCreateIdentifier ? (
          <Script
            id="create-identifier"
            strategy="afterInteractive"
            nonce={nonceValue}
            dangerouslySetInnerHTML={{ __html: inlineCreateIdentifier }}
          />
        ) : null}

        {shouldInjectWalkme ? (
          <Script
            id="inject-walkme"
            strategy="afterInteractive"
            nonce={nonceValue}
            dangerouslySetInnerHTML={{ __html: inlineWalkme }}
          />
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
