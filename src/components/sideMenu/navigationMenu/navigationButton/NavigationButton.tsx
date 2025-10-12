// NavigationButton (preserve FullReplace logic)
"use client";

import React, { useEffect } from "react";
import Button from "@mui/material/Button";
import { NavigationType } from "../NavigationTypes";

import { useRouter } from "next/navigation";
import { POST_MESSAGE_LOG_ENABLED, useFrame } from "@/components/contexts/FrameManager/FrameManager";
import { SAME_ORIGIN_TARGET } from "@/components/contexts/FrameManager/framePersistence";




function joinPathSegments(basePath: string, nextSegment?: string): string {
  if (!nextSegment) return basePath;
  const left = basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;
  const right = nextSegment.startsWith("/") ? nextSegment.slice(1) : nextSegment;
  return `${left}/${right}`;
}

type NavigationTarget = { originIndex: number; frameId?: string; pageName?: string };



function sendChildNavigating(): void {
  if (!window.name) return;
  const payload = { type: "child:navigating", frameName: window.name };
  if (POST_MESSAGE_LOG_ENABLED) {
    console.log(
      `[PostMessage Send] from "${window.name}" to "Parent" | type: child:navigating | content:`,
      payload
    );
  }
  window.parent?.postMessage(payload, SAME_ORIGIN_TARGET);
}

export default function NavigationButton({
  navigationTarget,
  navigationType,
}: {
  navigationTarget: NavigationTarget;
  navigationType: NavigationType;
}) {

  const router = useRouter();
  const [buttonLabel, setButtonLabel] = React.useState<string>("");
  const {
    knownFrameOrigins
  } = useFrame();

useEffect(() => {
  setButtonLabel(formatButtonLabel(navigationTarget) ?? "");
}, [knownFrameOrigins]);



  function buildRelativeDestinationPath(target: NavigationTarget): string {
  const origins = knownFrameOrigins;
  const basePath = origins[target.originIndex] ?? origins[0] ?? "";
  let path = basePath;
  if (target.frameId) path = joinPathSegments(path, target.frameId);
  if (target.pageName) path = joinPathSegments(path, encodeURIComponent(target.pageName));
  return path;
}

function formatButtonLabel(target: NavigationTarget): string | undefined{
  // const origins = knownFrameOrigins;
  // const base = origins[target.originIndex] ?? origins[0] ?? "";
  // const withFrame = target.frameId ? `${base}${target.frameId}` : base;
  return target.pageName;
}

function handleClick(): void {
  const destinationPath = buildRelativeDestinationPath(navigationTarget);
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const destinationUrl = `${protocol}://${destinationPath}${window.location.search}${window.location.hash}`;
  sendChildNavigating();
  switch (navigationType) {
    case NavigationType.Full:
      window.location.assign(destinationUrl);
      break;
    case NavigationType.SPA:
      router.push(destinationUrl, { scroll: false });
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
