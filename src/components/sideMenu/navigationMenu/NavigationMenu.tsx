"use client";

import React, { useState, useEffect, ChangeEvent } from "react";
import { NavigationType } from "./NavigationTypes";
import {
  Box,
  Button,
  Divider,
  FormControl,
  FormHelperText,
  MenuItem,
  Radio,
  RadioGroup,
  FormControlLabel,
  Select,
  SelectChangeEvent,
  Stack,
  Typography,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { SimpleTreeView } from "@mui/x-tree-view/SimpleTreeView";
import { TreeItem } from "@mui/x-tree-view/TreeItem";
import { useFrame } from "@/components/contexts/FrameManager/FrameManager";
import {
  loadPagesByOriginWithDefaults,
  persistPagesByOrigin,
} from "@/components/contexts/FrameManager/framePersistence";
import ContainerSelector from "../elementsMenu/containerSelector/ContainerSelector";
import { DEV_ORIGINS } from "@/components/contexts/FrameManager/framePersistence";
import { PROD_ORIGINS } from "@/components/contexts/FrameManager/framePersistence";
import { PagesByOrigin } from "@/components/contexts/FrameManager/frameUtils";

function getKnownOrigins(): string[] {
  return process.env.NODE_ENV === "development" ? DEV_ORIGINS : PROD_ORIGINS;
}

function getInitialPagesByOrigin(): Record<string, string[]> {
  const origins = getKnownOrigins();
  const pages: Record<string, string[]> = {};
  for (const origin of origins) pages[origin] = ["Home Page"];
  return pages;
}

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
  childMap: Record<string, { id: string }[]>
): string {
  if (isTopFrame(frameName) || isIframe(frameName) || isPopupWindow(frameName)) return frameName;
  for (const parentName in childMap) {
    const children = childMap[parentName] || [];
    if (children.some((child) => child.id === frameName)) return resolveNavTargetFrame(parentName, childMap);
  }
  return "TopFrame";
}

function findOriginForFrameName(
  frameName: string,
  originUrls: string[],
  childMap: Record<string, { id: string }[]>
): string {
  const hostRoot = typeof window !== "undefined" ? `${window.location.host}/` : "";
  const lower = frameName.toLowerCase();

  if (lower.includes("topframe")) return originUrls.find((url) => url === hostRoot) || originUrls[0];
  if (lower.includes("samedomain"))
    return originUrls.find((url) => url.startsWith(hostRoot) && url.endsWith("/frame/")) || originUrls[0];
  if (lower.includes("crossdomain"))
    return originUrls.find((url) => url.endsWith("/frame/") && url !== hostRoot + "frame/") || originUrls[0];

  for (const parentName in childMap) {
    if ((childMap[parentName] || []).some((child) => child.id === frameName)) {
      return findOriginForFrameName(parentName, originUrls, childMap);
    }
  }
  return originUrls.includes(hostRoot) ? hostRoot : originUrls[0];
}

export default function NavigationMenu() {
  const {
    currentFrameName,
    setCurrentFrameName,
    frameNameList,
    containerRefs,
    frameElementsByFrameName,
    addElementToCurrentFrame,
  } = useFrame();

  const initialPagesByOrigin = getInitialPagesByOrigin();

  const [pagesByOrigin, setPagesByOrigin] = useState<PagesByOrigin>(initialPagesByOrigin);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setPagesByOrigin(loadPagesByOriginWithDefaults(initialPagesByOrigin));
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    persistPagesByOrigin(pagesByOrigin);
  }, [pagesByOrigin, isMounted]);

  const [selectedOriginUrl, setSelectedOriginUrl] = useState(Object.keys(initialPagesByOrigin)[0]);
  const [selectedPageName, setSelectedPageName] = useState("Home Page");
  const [navigationMode, setNavigationMode] = useState<NavigationType>(NavigationType.Full);

  const [expandedItemIds, setExpandedItemIds] = useState<string[]>(
    Object.entries(initialPagesByOrigin).flatMap(([originUrl, pageTitles]) => [
      originUrl,
      ...pageTitles.map((pageTitle) => `${originUrl}-${pageTitle}`),
    ])
  );

  useEffect(() => {
    if (!isMounted) return;
    const allOriginUrls = Object.keys(pagesByOrigin);
    if (allOriginUrls.length === 0) return;

    if (!allOriginUrls.includes(selectedOriginUrl)) {
      setSelectedOriginUrl(allOriginUrls[0]);
    }

    setExpandedItemIds(
      allOriginUrls.flatMap((originUrl) => [
        originUrl,
        ...(pagesByOrigin[originUrl] || []).map((pageTitle) => `${originUrl}-${pageTitle}`),
      ])
    );
  }, [pagesByOrigin, isMounted]); 

  const [destinationOriginUrl, setDestinationOriginUrl] = useState<string>(Object.keys(initialPagesByOrigin)[0]);

  useEffect(() => {
    const allOriginUrls = Object.keys(pagesByOrigin);
    const navTargetFrameName = resolveNavTargetFrame(currentFrameName, frameElementsByFrameName as any);
    const computedDestinationOrigin = findOriginForFrameName(
      navTargetFrameName,
      allOriginUrls,
      frameElementsByFrameName as any
    );
    setDestinationOriginUrl(computedDestinationOrigin);
  }, [currentFrameName, containerRefs, pagesByOrigin, frameElementsByFrameName]);

  useEffect(() => {
    const pagesForDestination = pagesByOrigin[destinationOriginUrl] || [];
    setSelectedPageName(pagesForDestination[0] || "Home Page");
  }, [destinationOriginUrl, pagesByOrigin]);

  function addNewPage(): void {
    const baseTitle = "Page";
    let nextNumber = 1;
    const currentOriginPages = pagesByOrigin[selectedOriginUrl];

    while (currentOriginPages.includes(`${baseTitle}${nextNumber}`)) nextNumber++;

    const newPageTitle = `${baseTitle}${nextNumber}`;

    setPagesByOrigin((prev) => ({
      ...prev,
      [selectedOriginUrl]: [...prev[selectedOriginUrl], newPageTitle],
    }));

    setExpandedItemIds((prev) => [...prev, `${selectedOriginUrl}-${newPageTitle}`]);
    setSelectedPageName(newPageTitle);
  }

  function handleAddNavigationButton(): void {
    const isFrameOrContainer = false;

    const knownOrigins = Object.keys(pagesByOrigin);
    const originIndex = Math.max(0, knownOrigins.indexOf(destinationOriginUrl));

    const isHomePage = selectedPageName === "Home Page";
    const pageName = isHomePage ? undefined : selectedPageName;

    const navTargetFrameName = resolveNavTargetFrame(currentFrameName, frameElementsByFrameName as any);

    const isChildFrame = isIframe(navTargetFrameName) || isPopupWindow(navTargetFrameName);

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

  function removePage(originUrl: string, pageTitle: string): void {
    setPagesByOrigin((prev) => ({
      ...prev,
      [originUrl]: prev[originUrl].filter((title) => title !== pageTitle),
    }));
    if (selectedPageName === pageTitle) setSelectedPageName("Home Page");
  }

  const availableDestinationPages = pagesByOrigin[destinationOriginUrl] || ["Home Page"];


  return (
    <Stack>
      <Box sx={{ width: "100%", mb: 2 }}>
        <FormHelperText>Pages</FormHelperText>
        <SimpleTreeView
          expandedItems={expandedItemIds}
          onExpandedItemsChange={(event, newExpandedIds) => setExpandedItemIds(newExpandedIds)}
        >
          {Object.entries(pagesByOrigin).map(([originUrl, pageTitles]) => (
            <TreeItem key={originUrl} itemId={originUrl} label={originUrl}>
              {pageTitles.map((pageTitle) => (
                <TreeItem
                  key={pageTitle}
                  itemId={`${originUrl}-${pageTitle}`}
                  label={
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography sx={{ flex: 1 }}>{pageTitle}</Typography>
                      {pageTitle !== "Home Page" && (
                        <IconButton size="small" onClick={() => removePage(originUrl, pageTitle)}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  }
                />
              ))}
            </TreeItem>
          ))}
        </SimpleTreeView>
      </Box>

      <FormControl size="small" fullWidth sx={{ mb: 1 }}>
        <FormHelperText>Select origin for new page</FormHelperText>
        <Select
          value={selectedOriginUrl}
          onChange={(event: SelectChangeEvent<string>) => setSelectedOriginUrl(event.target.value)}
          sx={{ textAlign: "center" }}
        >
          {Object.keys(pagesByOrigin).map((originUrl) => (
            <MenuItem key={originUrl} value={originUrl}>
              {originUrl}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Button variant="contained" color="secondary" fullWidth onClick={addNewPage}>
        Add New Page
      </Button>

      <Divider sx={{ my: 2 }} />

      <ContainerSelector/>

      <FormControl size="small" fullWidth sx={{ mb: 1 }}>
        <FormHelperText>
          Select destination ({destinationOriginUrl})
        </FormHelperText>
        <Select
          value={selectedPageName}
          onChange={(event: SelectChangeEvent<string>) => setSelectedPageName(event.target.value)}
          sx={{ textAlign: "center" }}
        >
          {availableDestinationPages.map((pageOption) => (
            <MenuItem key={pageOption} value={pageOption}>
              {pageOption.toUpperCase()}
            </MenuItem>
          ))}
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
          <FormControlLabel value={NavigationType.Full} control={<Radio />} label="Full Page Navigation" />
          <FormControlLabel value={NavigationType.SPA} control={<Radio />} label="SPA Navigation" />
          <FormControlLabel value={NavigationType.FullReplace} control={<Radio />} label="Full Page + SPA Replace" />
        </RadioGroup>
      </FormControl>

      <Button variant="contained" color="secondary" fullWidth sx={{ mt: 2 }} onClick={handleAddNavigationButton}>
        Add Navigation Button
      </Button>
    </Stack>
  );
}
