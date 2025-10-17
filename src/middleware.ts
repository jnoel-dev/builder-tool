import { NextRequest, NextResponse } from "next/server";

const ID_PATTERN = /^[A-Za-z0-9]{20}$/;

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

function getApiBaseOrigin(requestUrl: URL): string {
  return process.env.NODE_ENV === "production"
    ? "https://ssrbuildertool152d2-pfz3mfnfsq-ue.a.run.app"
    : requestUrl.origin;
}

function buildCsp(): string {
  const sameOrigin = getSameOriginTarget();
  const crossOrigin = getCrossOriginTarget();
  const allowedScriptSources = [
    "'self'",
    "'unsafe-inline'",
    sameOrigin,
    crossOrigin,
  ];
  return `script-src ${allowedScriptSources.join(" ")};`;
}
function buildCspWithNonce(nonceValue: string): string {
  const sameOrigin = getSameOriginTarget();
  const crossOrigin = getCrossOriginTarget();
  const allowedScriptSources = [
    "'self'",
    sameOrigin,
    crossOrigin,
    `'nonce-${nonceValue}'`,
  ];
  return `script-src ${allowedScriptSources.join(" ")};`;
}
function generateNonce(): string {
  const randomBytesArray = new Uint8Array(16);
  crypto.getRandomValues(randomBytesArray);
  const randomCharString = Array.from(randomBytesArray, (byteValue) =>
    String.fromCharCode(byteValue),
  ).join("");
  return btoa(randomCharString);
}
function extractFramePropertiesFromState(
  stateJsonString: string,
  requestUrl: URL,
): Record<string, unknown> {
  if (!stateJsonString) return {};
  try {
    const parsedState = JSON.parse(stateJsonString) as {
      frames?: Record<string, { properties?: Record<string, unknown> }>;
    };
    const pathSegments = requestUrl.pathname.split("/").filter(Boolean);
    const isFramePath = pathSegments[1] === "frame";
    const requestedFrameName =
      isFramePath && pathSegments[2] ? pathSegments[2] : "TopFrame";
    const properties = parsedState.frames?.[requestedFrameName]?.properties;
    return properties && typeof properties === "object"
      ? { ...properties }
      : {};
  } catch {
    return {};
  }
}

export async function middleware(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const apiBaseOrigin = getApiBaseOrigin(requestUrl);
  const path = requestUrl.pathname;
  const pathSegments = path.split("/").filter(Boolean);
  const firstSegment = pathSegments[0] ?? "";
  const hasValidId = ID_PATTERN.test(firstSegment);
  const isDocumentRequest =
    request.method === "GET" &&
    request.headers.get("sec-fetch-dest") === "document" &&
    !request.headers.get("x-middleware-prefetch");

  if (isDocumentRequest && !hasValidId) {
    try {
      const createResponse = await fetch(`${apiBaseOrigin}/api/sbstate`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-mw": "1" },
        cache: "no-store",
      });
      if (createResponse.ok) {
        const { id: createdId } = (await createResponse.json()) as {
          id: string;
        };
        const redirectUrl = new URL(`/${createdId}${path}`, requestUrl.origin);
        redirectUrl.search = requestUrl.search;
        return NextResponse.redirect(redirectUrl);
      }
    } catch {}
  }

  const outgoingRequestHeaders = new Headers(request.headers);
  let shouldSetCspHeader = false;
  let shouldSetCspHeaderWithNonce = false;
  let scriptNonce: string | undefined;
  let shouldSignalCspSw = false;

  if (hasValidId) {
    try {
      const apiResponse = await fetch(
        `${apiBaseOrigin}/api/sbstate/${firstSegment}`,
        {
          method: "GET",
          cache: "no-store",
          headers: { "x-mw": "1" },
        },
      );
      if (apiResponse.ok) {
        const { stateJson } = (await apiResponse.json()) as {
          stateJson?: string;
        };
        const frameProperties = extractFramePropertiesFromState(
          stateJson ?? "",
          requestUrl,
        );
        outgoingRequestHeaders.set(
          "x-frame-properties",
          JSON.stringify(frameProperties),
        );

        let snippetProperties: Record<string, unknown> | undefined = undefined;
        if (typeof stateJson === "string" && stateJson.trim() !== "") {
          try {
            const parsed = JSON.parse(stateJson) as {
              snippetProperties?: Record<string, unknown>;
            };
            snippetProperties = parsed?.snippetProperties;
          } catch {}
        }

        const isFrameRoute = pathSegments[1] === "frame";
        const isCrossOriginTarget =
          requestUrl.origin === getCrossOriginTarget();
        const loadInCdIframes = Boolean(
          snippetProperties &&
            typeof snippetProperties === "object" &&
            (snippetProperties as Record<string, unknown>)["loadInCdIframes"],
        );

        outgoingRequestHeaders.delete("x-snippet-properties");
        const allowSnippetHeader =
          !isFrameRoute ||
          (isFrameRoute && isCrossOriginTarget && loadInCdIframes);
        if (allowSnippetHeader) {
          outgoingRequestHeaders.set(
            "x-snippet-properties",
            JSON.stringify(snippetProperties ?? {}),
          );
        }

        shouldSetCspHeader = Boolean(frameProperties["cspH"]);
        shouldSetCspHeaderWithNonce = Boolean(frameProperties["cspMN"]);
        shouldSignalCspSw = Boolean(frameProperties["cspSW"]);
        if (shouldSetCspHeaderWithNonce) {
          scriptNonce = generateNonce();
          outgoingRequestHeaders.set("x-nonce", scriptNonce);
        }
      }
    } catch {}
  }

  if (shouldSetCspHeaderWithNonce && scriptNonce) {
    outgoingRequestHeaders.set(
      "content-security-policy",
      buildCspWithNonce(scriptNonce),
    );
  } else if (shouldSetCspHeader) {
    outgoingRequestHeaders.set("content-security-policy", buildCsp());
  }

  const response = NextResponse.next({
    request: { headers: outgoingRequestHeaders },
  });

  if (shouldSignalCspSw) {
    response.headers.set("x-csp-sw", "1");
  }

  if (shouldSetCspHeaderWithNonce && scriptNonce) {
    response.headers.set(
      "Content-Security-Policy",
      buildCspWithNonce(scriptNonce),
    );
  } else if (shouldSetCspHeader) {
    response.headers.set("Content-Security-Policy", buildCsp());
  }

  return response;
}

export const config = {
  matcher: ["/((?!api).*)"],
};
