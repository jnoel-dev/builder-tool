import "./globals.css";
import { headers } from "next/headers";
import { BackgroundManager } from "@/components/contexts/backgroundContext/BackgroundManager";
import BaseLayout from "@/components/baseLayout/BaseLayout";

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

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const headersList = await headers();
  const forwardedQueryJson = headersList.get("x-sb-forwarded-query") ?? "{}";

  let forwardedQuery: Record<string, string> = {};
  try {
    forwardedQuery = JSON.parse(forwardedQueryJson) as Record<string, string>;
  } catch {}

  const shouldInjectCspMeta = "cspM" in forwardedQuery;

  return (
    <html lang="en">
      <head>
        {shouldInjectCspMeta && (
          <meta httpEquiv="Content-Security-Policy" content={buildCsp()} />
        )}
      </head>
      <body>
        <BackgroundManager>
          <BaseLayout>{children}</BaseLayout>
        </BackgroundManager>
      </body>
    </html>
  );
}
