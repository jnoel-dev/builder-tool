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
  const shouldApplyCsp = request.nextUrl.searchParams.has("csp");
  const response = NextResponse.next();
  if (shouldApplyCsp) {
    response.headers.set("Content-Security-Policy", buildCsp());
  }
  return response;
}
