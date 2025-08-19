"use client";

import React from "react";
import Button from "@mui/material/Button";
import { NavigationType } from "../NavigationTypes";
import { DEV_ORIGINS } from "@/components/contexts/FrameManager/framePersistence";
import { PROD_ORIGINS } from "@/components/contexts/FrameManager/framePersistence";

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

  const protocol = process.env.NODE_ENV === "development" ? "http://" : "https://";
  const currentQuery = window.location.search;
  const currentHash = window.location.hash;

  const destinationHostPath = buildUrlFromNavigationTarget(navigationTarget);
  const destinationUrl = `${protocol}${destinationHostPath}${currentQuery}${currentHash}`;

  const handleClick = () => {


    console.log(navigationType)

    switch (navigationType) {

      case NavigationType.Full:
        window.location.href = destinationUrl;
        break;

      case NavigationType.SPA:
        window.history.pushState(null, "", destinationUrl);
        window.dispatchEvent(new PopStateEvent("popstate"));
        break;
      
      case NavigationType.FullReplace:
        sessionStorage.setItem(
          "navigation:SPAreplace",
          JSON.stringify({
            url: destinationUrl,
            windowName: window.name,
          })
        );
        window.location.reload();
        break;
      
    } 

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
