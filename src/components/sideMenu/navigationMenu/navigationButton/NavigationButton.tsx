"use client";

import React from "react";
import Button from "@mui/material/Button";
import { NavigationType } from "../NavigationTypes";

type NavigationTarget = {
  originIndex: number;
  frameId?: string;
  pageName?: string;
};

export interface NavigationButtonProps {
  navigationTarget: NavigationTarget;
  navigationType: NavigationType;
}

const DEV_ORIGINS = ["localhost:3000/", "localhost:3000/frame/", "localhost:3001/frame/"];
const PROD_ORIGINS = ["build.jonnoel.dev/", "build.jonnoel.dev/frame/", "frame.jonnoel.dev/frame/"];

function getKnownOrigins(): string[] {
  return process.env.NODE_ENV === "development" ? DEV_ORIGINS : PROD_ORIGINS;
}

function buildUrlFromNavigationTarget(target: NavigationTarget): string {
  const origins = getKnownOrigins();
  const baseHostPath = origins[target.originIndex] ?? origins[0] ?? "";
  const encodedPage = target.pageName ? encodeURIComponent(target.pageName) : "";

  if (target.frameId) {
    return encodedPage ? `${baseHostPath}${target.frameId}/${encodedPage}` : `${baseHostPath}${target.frameId}`;
  }
  return encodedPage ? `${baseHostPath}${encodedPage}` : baseHostPath;
}

export default function NavigationButton({
  navigationTarget,
  navigationType,
}: NavigationButtonProps) {
  const handleClick = () => {
    const isTopWindow = window.top === window;
    const lastSavedKey = isTopWindow ? "lastSavedUrl" : `lastSavedUrl.${window.name}`;
    sessionStorage.setItem(lastSavedKey, window.location.href);

    if (navigationType === NavigationType.Full) {
      const protocol = process.env.NODE_ENV === "development" ? "http://" : "https://";
      const currentQuery = window.location.search;
      const currentHash = window.location.hash;

      const destinationHostPath = buildUrlFromNavigationTarget(navigationTarget);
      const destinationUrl = `${protocol}${destinationHostPath}${currentQuery}${currentHash}`;

      window.location.href = destinationUrl;
    }

    const landedKey = isTopWindow ? "landedUrl" : `landedUrl.${window.name}`;
    sessionStorage.setItem(landedKey, window.location.href);
  };

  const prettyTarget = (() => {
    const origins = getKnownOrigins();
    const baseHostPath = origins[navigationTarget.originIndex] ?? origins[0] ?? "";
    if (navigationTarget.frameId && navigationTarget.pageName) return `${baseHostPath}${navigationTarget.frameId}/${navigationTarget.pageName}`;
    if (navigationTarget.frameId) return `${baseHostPath}${navigationTarget.frameId}`;
    if (navigationTarget.pageName) return `${baseHostPath}${navigationTarget.pageName}`;
    return baseHostPath;
  })();

  return (
    <Button variant="contained" onClick={handleClick}>
      {navigationType} navigation to {prettyTarget}
    </Button>
  );
}
