"use client";

import React from "react";
import Button from "@mui/material/Button";
import { NavigationType } from "../NavigationTypes";
import { getKnownChildWindowInfoByFrameName } from "@/components/contexts/FrameManager/frameMessaging";

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

function spaNavigateTopFrame(target: NavigationTarget): boolean {
  const origins = getKnownOrigins();
  const targetHostRoot = origins[target.originIndex] ?? "";
  const currentHostRoot = `${window.location.host}/`;

  if (targetHostRoot !== currentHostRoot) return false;

  const newPathname = target.pageName ? `/${encodeURIComponent(target.pageName)}` : `/`;
  const newUrl = `${newPathname}${window.location.search}${window.location.hash}`;

  window.history.pushState(null, "", newUrl);
  window.dispatchEvent(new PopStateEvent("popstate"));
  return true;
}

function spaNavigateChildFrame(target: NavigationTarget): boolean {
  if (!target.frameId) return false;

  const childWindow = getKnownChildWindowInfoByFrameName(target.frameId)?.childWindow;
  if (!childWindow) return false;

  try {
    const newPath = target.pageName ? `/${encodeURIComponent(target.pageName)}` : `/`;
    childWindow.history.pushState(null, "", newPath);

    const PopStateCtor =
      (childWindow as any).PopStateEvent || (childWindow as any).Event;
    const popstateEvent = new PopStateCtor("popstate");

    childWindow.dispatchEvent(popstateEvent);
    return true;
  } catch {
    return false; // likely cross-origin
  }
}



export default function NavigationButton({
  navigationTarget,
  navigationType,
}: NavigationButtonProps) {
  const handleClick = () => {


    if (navigationType === NavigationType.Full) {
      const protocol = process.env.NODE_ENV === "development" ? "http://" : "https://";
      const currentQuery = window.location.search;
      const currentHash = window.location.hash;

      const destinationHostPath = buildUrlFromNavigationTarget(navigationTarget);
      const destinationUrl = `${protocol}${destinationHostPath}${currentQuery}${currentHash}`;

      window.location.href = destinationUrl;
    } else if (navigationType === NavigationType.SPA) {
      let handled = false;

      if (navigationTarget.frameId) {
        handled = spaNavigateChildFrame(navigationTarget);
      } else {
        handled = spaNavigateTopFrame(navigationTarget);
      }

      if (!handled) {
        // Fallback to full navigation if SPA not possible (e.g., cross-origin iframe or different origin)
        const protocol = process.env.NODE_ENV === "development" ? "http://" : "https://";
        const currentQuery = window.location.search;
        const currentHash = window.location.hash;
        const destinationHostPath = buildUrlFromNavigationTarget(navigationTarget);
        const destinationUrl = `${protocol}${destinationHostPath}${currentQuery}${currentHash}`;
        window.location.href = destinationUrl;
      }
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
