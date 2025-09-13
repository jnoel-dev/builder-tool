import "./globals.css";
import { headers } from "next/headers";
import { BackgroundManager } from "@/components/contexts/backgroundContext/BackgroundManager";
import BaseLayout from "@/components/baseLayout/BaseLayout";
import { randomBytes } from "crypto";

function getSameOriginTarget(): string {
  return process.env.NODE_ENV === "production" ? "https://build.jonnoel.dev" : "http://localhost:3000";
}
function getCrossOriginTarget(): string {
  return process.env.NODE_ENV === "production" ? "https://frame.jonnoel.dev" : "http://localhost:3001";
}
function buildCsp(nonce?: string): string {
  const sameOrigin = getSameOriginTarget();
  const crossOrigin = getCrossOriginTarget();
  const sources = ["'self'", "'unsafe-inline'", sameOrigin, crossOrigin];
  if (nonce) sources.push(`'nonce-${nonce}'`);
  return `script-src ${sources.join(" ")};`;
}
function generateNonce(): string {
  return randomBytes(16).toString("base64");
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const raw = headersList.get("x-frame-properties") ?? "{}";

  let propsFromHeaders: Record<string, string> = {};
  try {
    propsFromHeaders = JSON.parse(raw) as Record<string, string>;
  } catch {}

  const cspInMetaTag = "cspM" in propsFromHeaders;
  const cspInMetaTagWithNonce = "cspMN" in propsFromHeaders;
  const shouldInject = cspInMetaTag || cspInMetaTagWithNonce;

  const nonce = cspInMetaTagWithNonce ? generateNonce() : undefined;

  return (
    <html lang="en">
      <head>
        {shouldInject && (
          <meta httpEquiv="Content-Security-Policy" content={buildCsp(nonce)} />
        )}
        {nonce ? <meta name="csp-nonce" content={nonce} /> : null}
      </head>
      <body>
        <BackgroundManager>
          <BaseLayout>{children}</BaseLayout>
        </BackgroundManager>
      </body>
    </html>
  );
}
