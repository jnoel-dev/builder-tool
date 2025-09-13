import { NextRequest, NextResponse } from "next/server";

function getSameOriginTarget(): string {
  return process.env.NODE_ENV === "production" ? "https://build.jonnoel.dev" : "http://localhost:3000";
}
function getCrossOriginTarget(): string {
  return process.env.NODE_ENV === "production" ? "https://frame.jonnoel.dev" : "http://localhost:3001";
}
function buildCsp(): string {
  const sameOrigin = getSameOriginTarget();
  const crossOrigin = getCrossOriginTarget();
  const allowedScriptSources = ["'self'", "'unsafe-inline'", sameOrigin, crossOrigin];
  return `script-src ${allowedScriptSources.join(" ")};`;
}
function buildCspWithNonce(nonceValue: string): string {
  const sameOrigin = getSameOriginTarget();
  const crossOrigin = getCrossOriginTarget();
  const allowedScriptSources = ["'self'", sameOrigin, crossOrigin, `'nonce-${nonceValue}'`];
  return `script-src ${allowedScriptSources.join(" ")};`;
}
function generateNonce(): string {
  const randomBytesArray = new Uint8Array(16);
  crypto.getRandomValues(randomBytesArray);
  const randomCharString = Array.from(randomBytesArray, (byteValue) => String.fromCharCode(byteValue)).join("");
  return btoa(randomCharString);
}

export function middleware(request: NextRequest) {
  const urlSearchParams = request.nextUrl.searchParams;

  const frameProperties: Record<string, string> = {};
  for (const [paramKey, paramValue] of urlSearchParams.entries()) {
    frameProperties[paramKey] = paramValue;
  }
  const framePropertiesJson = JSON.stringify(frameProperties);

  const outgoingRequestHeaders = new Headers(request.headers);
  outgoingRequestHeaders.set("x-frame-properties", framePropertiesJson);

  let scriptNonce: string | undefined;
  if (urlSearchParams.has("cspMN")) {
    scriptNonce = generateNonce();
    outgoingRequestHeaders.set("x-nonce", scriptNonce);
  }

  const response = NextResponse.next({ request: { headers: outgoingRequestHeaders } });

  if (urlSearchParams.has("cspMN") && scriptNonce) {
    response.headers.set("Content-Security-Policy", buildCspWithNonce(scriptNonce));
  } else if (urlSearchParams.has("cspH")) {
    response.headers.set("Content-Security-Policy", buildCsp());
  }

  return response;
}
