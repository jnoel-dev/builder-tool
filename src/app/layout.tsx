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
  const shouldOverrideGetComputedStyle = "nfGCS" in frameProperties;

  return (
    <html lang="en">
      <head>
        {shouldInjectMeta ? (
          <meta httpEquiv="Content-Security-Policy" content={buildCsp(scriptNonce)} />
        ) : null}
        {scriptNonce ? <meta name="csp-nonce" content={scriptNonce} /> : null}

        {shouldOverrideGetComputedStyle ? (
          <>
            <Script src="/nativeFunctions.js" strategy="beforeInteractive" nonce={scriptNonce} />
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
