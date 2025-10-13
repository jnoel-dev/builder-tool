"use client";

import React, { useState, useEffect, ChangeEvent } from "react";
import { NavigationType } from "./NavigationTypes";
import {
  Button,
  FormControl,
  FormHelperText,
  MenuItem,
  Radio,
  RadioGroup,
  FormControlLabel,
  Select,
  SelectChangeEvent,
  Stack,
} from "@mui/material";
import { useFrame } from "@/components/contexts/FrameManager/FrameManager";
import {
  loadPagesByOriginWithDefaults,
  persistPagesByOrigin,
} from "@/components/contexts/FrameManager/framePersistence";
import ContainerSelector from "../elementsMenu/containerSelector/ContainerSelector";

import { PagesByOrigin } from "@/components/contexts/FrameManager/frameUtils";

function isTopFrame(name: string): boolean {
  return /topframe/i.test(name);
}
function isIframe(name: string): boolean {
  return /iframe/i.test(name);
}
function isPopupWindow(name: string): boolean {
  return /popup/i.test(name);
}

function resolveNavTargetFrame(
  frameName: string,
  childMap: Record<string, { id: string }[]>,
): string {
  if (isTopFrame(frameName) || isIframe(frameName) || isPopupWindow(frameName))
    return frameName;
  for (const parentName in childMap) {
    const children = childMap[parentName] || [];
    if (children.some((child) => child.id === frameName))
      return resolveNavTargetFrame(parentName, childMap);
  }
  return "TopFrame";
}

function findOriginForFrameName(
  frameName: string,
  originUrls: string[],
  childMap: Record<string, { id: string }[]>,
): string {
  const currentHost = typeof window !== "undefined" ? window.location.host : "";
  const frameNameLower = frameName.toLowerCase();

  const parsedOrigins = originUrls.map((originUrl) => {
    try {
      const parsed = new URL(originUrl);
      return { raw: originUrl, host: parsed.host, path: parsed.pathname };
    } catch {
      return { raw: originUrl, host: "", path: "" };
    }
  });

  function isSameHost(hostname: string): boolean {
    return currentHost !== "" && hostname === currentHost;
  }

  function selectMatchingOrigin(
    predicate: (origin: { raw: string; host: string; path: string }) => boolean,
  ): string | null {
    const match = parsedOrigins.find(predicate);
    return match ? match.raw : null;
  }

  if (frameNameLower.includes("topframe")) {
    return originUrls[0];
  } else if (frameNameLower.includes("samedomain")) {
    return originUrls[1];
  } else if (frameNameLower.includes("crossdomain")) {
    return originUrls[2];
  } else {
    for (const parentName in childMap) {
      const children = childMap[parentName] || [];
      if (children.some((child) => child.id === frameName)) {
        return findOriginForFrameName(parentName, originUrls, childMap);
      }
    }
    const sameHost = selectMatchingOrigin((origin) => isSameHost(origin.host));
    return sameHost || originUrls[0];
  }
}

export default function NavigationMenu() {
  const {
    currentFrameName,
    containerRefs,
    frameElementsByFrameName,
    addElementToCurrentFrame,
    knownFrameOrigins,
    receivedFirebaseResponse,
  } = useFrame();

  function getInitialPagesByOrigin(): Record<string, string[]> {
    const origins = knownFrameOrigins;
    const pages: Record<string, string[]> = {};
    for (const origin of origins) pages[origin] = ["Home Page"];
    return pages;
  }

  const [pagesByOrigin, setPagesByOrigin] = useState<PagesByOrigin>(
    getInitialPagesByOrigin(),
  );
  const [selectedOriginUrl, setSelectedOriginUrl] = useState("");
  const [selectedPageName, setSelectedPageName] = useState("Home Page");
  const [navigationMode, setNavigationMode] = useState<NavigationType>(
    NavigationType.Full,
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const defaults: PagesByOrigin = Object.fromEntries(
        knownFrameOrigins.map((originUrl) => [originUrl, ["Home Page"]]),
      );

      const loaded = await loadPagesByOriginWithDefaults(defaults);
      if (cancelled) return;

      setPagesByOrigin(loaded);
      setSelectedOriginUrl(Object.keys(loaded)[0] ?? "");
    })();

    return () => {
      cancelled = true;
    };
  }, [knownFrameOrigins, receivedFirebaseResponse]);

  useEffect(() => {
    const allOriginUrls = Object.keys(pagesByOrigin);
    if (allOriginUrls.length === 0) return;

    if (!allOriginUrls.includes(selectedOriginUrl)) {
      setSelectedOriginUrl(allOriginUrls[0]);
    }
  }, [pagesByOrigin, selectedOriginUrl]);

  const [destinationOriginUrl, setDestinationOriginUrl] = useState<string>(
    Object.keys(getInitialPagesByOrigin())[0],
  );

  useEffect(() => {
    const allOriginUrls = Object.keys(pagesByOrigin);
    const navTargetFrameName = resolveNavTargetFrame(
      currentFrameName,
      frameElementsByFrameName as Record<string, { id: string }[]>,
    );
    const computedDestinationOrigin = findOriginForFrameName(
      navTargetFrameName,
      allOriginUrls,
      frameElementsByFrameName as Record<string, { id: string }[]>,
    );
    setDestinationOriginUrl(computedDestinationOrigin);
  }, [
    currentFrameName,
    containerRefs,
    pagesByOrigin,
    frameElementsByFrameName,
  ]);

  useEffect(() => {
    const pagesForDestination = pagesByOrigin[destinationOriginUrl] || [];
    setSelectedPageName(pagesForDestination[0] || "Home Page");
  }, [destinationOriginUrl, pagesByOrigin]);

  function computeNextPageTitleForOrigin(originUrl: string): string {
    const baseTitle = "Page";
    let nextNumber = 1;
    const currentPages = pagesByOrigin[originUrl] || [];
    while (currentPages.includes(`${baseTitle}${nextNumber}`)) nextNumber++;
    return `${baseTitle}${nextNumber}`;
  }

  function addNewPageForDestination(
    originUrl: string,
    pageTitle: string,
  ): void {
    setPagesByOrigin((previous) => {
      const currentPages = previous[originUrl] ?? [];
      const next = { ...previous, [originUrl]: [...currentPages, pageTitle] };
      persistPagesByOrigin(next);
      return next;
    });
  }

  function handleAddNavigationButton(): void {
    const isCreateSelection =
      typeof selectedPageName === "string" &&
      selectedPageName.startsWith("__CREATE__:");
    let finalPageName = selectedPageName;

    if (isCreateSelection) {
      const parsedTitle = selectedPageName.replace("__CREATE__:", "");
      addNewPageForDestination(destinationOriginUrl, parsedTitle);
      setSelectedPageName(parsedTitle);
      finalPageName = parsedTitle;
    }

    const isFrameOrContainer = false;

    const knownOrigins = Object.keys(pagesByOrigin);
    const originIndex = Math.max(0, knownOrigins.indexOf(destinationOriginUrl));

    const isHomePage = finalPageName === "Home Page";
    const pageName = isHomePage ? undefined : finalPageName;

    const navTargetFrameName = resolveNavTargetFrame(
      currentFrameName,
      frameElementsByFrameName as Record<string, { id: string }[]>,
    );
    const isChildFrame =
      isIframe(navTargetFrameName) || isPopupWindow(navTargetFrameName);

    const navigationTarget = {
      originIndex,
      frameId: isChildFrame ? navTargetFrameName : undefined,
      pageName,
    };

    addElementToCurrentFrame("NavigationButton", isFrameOrContainer, {
      navigationTarget,
      navigationType: navigationMode,
    });
  }

  const availableDestinationPages = pagesByOrigin[destinationOriginUrl] || [
    "Home Page",
  ];

  const nextCreatableTitle =
    computeNextPageTitleForOrigin(destinationOriginUrl);
  const createValue = `__CREATE__:${nextCreatableTitle}`;
  const createLabel = `Create new Page ${nextCreatableTitle.replace("Page", "")}`;

  return (
    <Stack>
      <ContainerSelector />

      <FormControl size="small" fullWidth sx={{ mb: 1 }}>
        <FormHelperText>
          Select destination ({destinationOriginUrl})
        </FormHelperText>
        <Select
          value={selectedPageName}
          onChange={(event: SelectChangeEvent<string>) =>
            setSelectedPageName(event.target.value)
          }
          sx={{ textAlign: "center" }}
        >
          {availableDestinationPages.map((pageOption) => (
            <MenuItem key={pageOption} value={pageOption}>
              {pageOption.toUpperCase()}
            </MenuItem>
          ))}
          <MenuItem key={createValue} value={createValue}>
            {createLabel.toUpperCase()}
          </MenuItem>
        </Select>
      </FormControl>

      <FormControl size="small" fullWidth>
        <FormHelperText>Navigation Type</FormHelperText>
        <RadioGroup
          value={navigationMode}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setNavigationMode(event.target.value as NavigationType)
          }
        >
          <FormControlLabel
            value={NavigationType.Full}
            control={<Radio />}
            label="Full Page Navigation"
          />
          <FormControlLabel
            value={NavigationType.SPA}
            control={<Radio />}
            label="SPA Navigation"
          />
          <FormControlLabel
            value={NavigationType.FullReplace}
            control={<Radio />}
            label="Full Page + SPA Replace"
          />
        </RadioGroup>
      </FormControl>

      <Button
        variant="contained"
        color="secondary"
        fullWidth
        sx={{ mt: 2 }}
        onClick={handleAddNavigationButton}
      >
        Add Navigation Button
      </Button>
    </Stack>
  );
}
