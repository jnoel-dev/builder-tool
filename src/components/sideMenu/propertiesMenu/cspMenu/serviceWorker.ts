/// <reference lib="webworker" />

function getCrossOriginForOrigin(currentOrigin: string): string {
  if (currentOrigin.startsWith("http://localhost:3000")) return "http://localhost:3001";
  if (currentOrigin.startsWith("http://localhost:3001")) return "http://localhost:3000";
  if (currentOrigin.startsWith("https://build.jonnoel.dev")) return "https://frame.jonnoel.dev";
  if (currentOrigin.startsWith("https://frame.jonnoel.dev")) return "https://build.jonnoel.dev";
  return currentOrigin;
}

function buildCspHeaderValue(requestUrl: URL): string {
  const sameOrigin = requestUrl.origin;
  const crossOrigin = getCrossOriginForOrigin(sameOrigin);
  const allowedScriptSources = ["'self'", "'unsafe-inline'", sameOrigin, crossOrigin];
  return `script-src ${allowedScriptSources.join(" ")};`;
}

function shouldConsiderRequest(request: Request): boolean {
  const requestUrl = new URL(request.url);
  if (request.mode !== "navigate") return false;
  if (requestUrl.origin !== self.location.origin) return false;
  return true;
}

async function cloneResponseWithCsp(originalResponse: Response, cspHeaderValue: string): Promise<Response> {
  const responseHeaders = new Headers(originalResponse.headers);
  responseHeaders.set("Content-Security-Policy", cspHeaderValue);
  return new Response(originalResponse.body, {
    status: originalResponse.status,
    statusText: originalResponse.statusText,
    headers: responseHeaders,
  });
}

async function handleFetchEvent(fetchEvent: FetchEvent): Promise<Response> {
  const request = fetchEvent.request;

  if (!shouldConsiderRequest(request)) {
    return fetch(request);
  }

  const originalResponse = await fetch(request);
  const cspSwHeader = originalResponse.headers.get("x-csp-sw");
  const isCspEnabledForResponse = cspSwHeader === "1";
  console.log("x-csp-sw header:", cspSwHeader, "| URL:", request.url);

  if (!isCspEnabledForResponse) {
    return originalResponse;
  }

  const requestUrl = new URL(request.url);
  const cspHeaderValue = buildCspHeaderValue(requestUrl);
  console.log("Applying CSP via Service Worker for:", request.url);
  return cloneResponseWithCsp(originalResponse, cspHeaderValue);
}

function onInstall(_event: ExtendableEvent): void {

  (self as unknown as ServiceWorkerGlobalScope).skipWaiting();
}

function onActivate(event: ExtendableEvent): void {
 
  event.waitUntil((self as unknown as ServiceWorkerGlobalScope).clients.claim());
}

function onFetch(event: FetchEvent): void {
  const requestUrl = new URL(event.request.url);
  const pathSegments = requestUrl.pathname.split("/").filter(Boolean);
  const hasFirebaseID = pathSegments.some((segment) => /^[A-Za-z0-9]{20}$/.test(segment));
  if (!hasFirebaseID) return;
  console.log(event.request.url);
  event.respondWith(handleFetchEvent(event));
}


self.addEventListener("install", onInstall as EventListener);
self.addEventListener("activate", onActivate as EventListener);
self.addEventListener("fetch", onFetch as EventListener);
