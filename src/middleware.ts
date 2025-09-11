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

export function middleware(request: NextRequest) {
  const urlParams = request.nextUrl.searchParams;
  const forwardedQueryParams: Record<string, string> = {};
  for (const [key, value] of urlParams.entries()) {
    forwardedQueryParams[key] = value;
  }
  const forwardedQueryParamsJson = JSON.stringify(forwardedQueryParams);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-sb-forwarded-query", forwardedQueryParamsJson);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  if (urlParams.has("cspH")) {
    response.headers.set("Content-Security-Policy", buildCsp());
  }

  return response;
}
