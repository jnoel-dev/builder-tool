"use strict";
(() => {
  // src/serviceWorker.ts
  function getCrossOriginForOrigin(currentOrigin) {
    if (currentOrigin.startsWith("http://localhost:3000")) return "http://localhost:3001";
    if (currentOrigin.startsWith("http://localhost:3001")) return "http://localhost:3000";
    if (currentOrigin.startsWith("https://build.jonnoel.dev")) return "https://frame.jonnoel.dev";
    if (currentOrigin.startsWith("https://frame.jonnoel.dev")) return "https://build.jonnoel.dev";
    return currentOrigin;
  }
  function buildCspHeaderValue(requestUrl) {
    const sameOrigin = requestUrl.origin;
    const crossOrigin = getCrossOriginForOrigin(sameOrigin);
    const allowedScriptSources = ["'self'", "'unsafe-inline'", sameOrigin, crossOrigin];
    return `script-src ${allowedScriptSources.join(" ")};`;
  }
  function shouldApplyCspForRequest(request) {
    const requestUrl = new URL(request.url);
    if (request.mode !== "navigate") return false;
    if (requestUrl.origin !== self.location.origin) return false;
    if (!requestUrl.searchParams.has("cspSW")) return false;
    return true;
  }
  async function cloneResponseWithCsp(originalResponse, cspHeaderValue) {
    const responseHeaders = new Headers(originalResponse.headers);
    responseHeaders.set("Content-Security-Policy", cspHeaderValue);
    return new Response(originalResponse.body, {
      status: originalResponse.status,
      statusText: originalResponse.statusText,
      headers: responseHeaders
    });
  }
  async function handleFetchEvent(fetchEvent) {
    const request = fetchEvent.request;
    if (!shouldApplyCspForRequest(request)) return fetch(request);
    const originalResponse = await fetch(request);
    const requestUrl = new URL(request.url);
    const cspHeaderValue = buildCspHeaderValue(requestUrl);
    return cloneResponseWithCsp(originalResponse, cspHeaderValue);
  }
  function onInstall(_event) {
    self.skipWaiting();
  }
  function onActivate(event) {
    event.waitUntil(self.clients.claim());
  }
  function onFetch(event) {
    event.respondWith(handleFetchEvent(event));
  }
  self.addEventListener("install", onInstall);
  self.addEventListener("activate", onActivate);
  self.addEventListener("fetch", onFetch);
})();
