import "./globals.css";
import { headers } from "next/headers";
import { BackgroundManager } from "@/components/contexts/backgroundContext/BackgroundManager";
import BaseLayout from "@/components/baseLayout/BaseLayout";
import Script from "next/script";

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const incomingHeaders = await headers();
  const framePropertiesJson = incomingHeaders.get("x-frame-properties") ?? "{}";

  let frameProperties: Record<string, string> = {};
  try {
    frameProperties = JSON.parse(framePropertiesJson) as Record<string, string>;
  } catch {}

  const hasCspMeta = "cspM" in frameProperties;
  const hasCspMetaWithNonce = "cspMN" in frameProperties;
  const shouldInjectMeta = hasCspMeta || hasCspMetaWithNonce;

  const scriptNonce = hasCspMetaWithNonce ? incomingHeaders.get("x-nonce") || undefined : undefined;

  const propertyToFunctionName: Record<string, string> = {
    nfGCS: "overrideGetComputedStyle",
    nfR: "overrideRequest",
    nfP: "overridePromiseWithZone"
  };
  const overrideFunctionNames = Object.keys(frameProperties)
    .filter((key) => key in propertyToFunctionName)
    .map((key) => propertyToFunctionName[key]);

  const shouldLoadNativeFunctions = overrideFunctionNames.length > 0;

  return (
    <html lang="en">
      <head>
        {shouldInjectMeta ? (
          <meta httpEquiv="Content-Security-Policy" content={buildCsp(scriptNonce)} />
        ) : null}
        {scriptNonce ? <meta name="csp-nonce" content={scriptNonce} /> : null}

        {shouldLoadNativeFunctions ? (
          <>
            <Script src="/nativeFunctions.js" strategy="beforeInteractive" nonce={scriptNonce} />
            <Script id="apply-native-overrides" strategy="beforeInteractive" nonce={scriptNonce}>
              {`(function(){var names=${JSON.stringify(
                overrideFunctionNames
              )};var api=window.NativeFunctions||window;for(var i=0;i<names.length;i++){var n=names[i];var fn=api[n];if(typeof fn==="function"){fn();}}})();`}
            </Script>
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
