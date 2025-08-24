import { NextRequest, NextResponse } from "next/server";

function getSameOriginTarget(): string {
  return process.env.NODE_ENV === "production" ? "https://build.jonnoel.dev" : "http://localhost:3000";
}

function getCrossOriginTarget(): string {
  return process.env.NODE_ENV === "production" ? "https://frame.jonnoel.dev" : "http://localhost:3001";
}


export function middleware(_request: NextRequest) {
  const sameOrigin = getSameOriginTarget();
  const crossOrigin = getCrossOriginTarget();

  const allowedScriptSources = ["'self'", "'unsafe-inline'", sameOrigin, crossOrigin];
  const contentSecurityPolicy = `script-src ${allowedScriptSources.join(" ")};`;

  const response = NextResponse.next();
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);
  return response;
}
