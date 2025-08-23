"use client";

import React from "react";
import Button from "@mui/material/Button";
import { NavigationType } from "../NavigationTypes";
import { DEV_ORIGINS, PROD_ORIGINS } from "@/components/contexts/FrameManager/framePersistence";

type NavigationTarget = {
  originIndex: number;
  frameId?: string;
  pageName?: string;
};

export interface NavigationButtonProps {
  navigationTarget: NavigationTarget;
  navigationType: NavigationType;
}

function getKnownOrigins(): string[] {
  return process.env.NODE_ENV === "development" ? DEV_ORIGINS : PROD_ORIGINS;
}

function normalizeBasePath(originString: string): string {
  try {
    const parsed = new URL(`http://${originString}`);
    let path = parsed.pathname || "/";
    if (!path.startsWith("/")) path = `/${path}`;
    if (!path.endsWith("/")) path = `${path}/`;
    return path;
  } catch {
    return "/";
  }
}

function joinPathSegments(basePath: string, nextSegment?: string): string {
  if (!nextSegment) return basePath;
  const left = basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;
  const right = nextSegment.startsWith("/") ? nextSegment.slice(1) : nextSegment;
  return `${left}/${right}`;
}

function buildRelativeDestinationPath(target: NavigationTarget): string {
  const origins = getKnownOrigins();
  const basePath = normalizeBasePath(origins[target.originIndex] ?? origins[0] ?? "/");
  let path = basePath;
  if (target.frameId) path = joinPathSegments(path, target.frameId);
  if (target.pageName) path = joinPathSegments(path, encodeURIComponent(target.pageName));
  return path;
}

function formatButtonLabel(target: NavigationTarget): string {
  const origins = getKnownOrigins();
  const base = origins[target.originIndex] ?? origins[0] ?? "";
  const withFrame = target.frameId ? `${base}${target.frameId}` : base;
  return target.pageName ? `${withFrame}/${target.pageName}` : withFrame;
}

export default function NavigationButton({ navigationTarget, navigationType }: NavigationButtonProps) {
  const buttonLabel = formatButtonLabel(navigationTarget);

  function handleClick(): void {
    const destinationPath = buildRelativeDestinationPath(navigationTarget);
    const destinationUrl = `${destinationPath}${window.location.search}${window.location.hash}`;

    switch (navigationType) {
      case NavigationType.Full:
        window.location.assign(destinationUrl);
        break;
      case NavigationType.SPA:
        window.history.pushState(null, "", destinationUrl);
        window.dispatchEvent(new PopStateEvent("popstate"));
        break;
      case NavigationType.FullReplace:
        sessionStorage.setItem(
          "navigation:SPAreplace",
          JSON.stringify({ url: destinationUrl, windowName: window.name })
        );
        window.location.reload();
        break;
    }
  }

  return (
    <Button variant="contained" onClick={handleClick}>
      {navigationType} navigation to {buttonLabel}
    </Button>
  );
}
