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

const DEV_ORIGINS = ["localhost:3000/", "localhost:3000/frame/", "localhost:3001/frame/"];
const PROD_ORIGINS = ["build.jonnoel.dev/", "build.jonnoel.dev/frame/", "frame.jonnoel.dev/frame/"];

function getInitialPagesByOrigin(): Record<string, string[]> {
  const origins = process.env.NODE_ENV === "development" ? DEV_ORIGINS : PROD_ORIGINS;
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

// Walk up to the nearest ancestor that is navigable (Iframe or TopFrame)
function resolveNavTargetFrame(
  frameName: string,
  childMap: Record<string, { id: string }[]>
): string {
  if (isTopFrame(frameName) || isIframe(frameName)) return frameName;

  for (const parentName in childMap) {
    const children = childMap[parentName] || [];
    if (children.some(child => child.id === frameName)) {
      return resolveNavTargetFrame(parentName, childMap);
    }
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

  if (lower.includes("topframe")) {
    return originUrls.find(url => url === hostRoot) || originUrls[0];
  }
  if (lower.includes("samedomain")) {
    return originUrls.find(url => url.startsWith(hostRoot) && url.endsWith("/frame/")) || originUrls[0];
  }
  if (lower.includes("crossdomain")) {
    return originUrls.find(url => url.endsWith("/frame/") && url !== hostRoot + "frame/") || originUrls[0];
  }
  // Fallback: inherit from parent
  for (const parentName in childMap) {
    if ((childMap[parentName] || []).some(child => child.id === frameName)) {
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

  const initialPagesMap = getInitialPagesByOrigin();

  const [pagesByOrigin, setPagesByOrigin] = useState(initialPagesMap);
  const [selectedOriginUrl, setSelectedOriginUrl] = useState(Object.keys(initialPagesMap)[0]);
  const [selectedPageName, setSelectedPageName] = useState("Home Page");
  const [navigationMode, setNavigationMode] = useState<NavigationType>(NavigationType.Full);

  const [expandedItemIds, setExpandedItemIds] = useState<string[]>(() =>
    Object.entries(initialPagesMap).flatMap(([originUrl, pageTitles]) => [
      originUrl,
      ...pageTitles.map(pageTitle => `${originUrl}-${pageTitle}`),
    ])
  );
  const [destinationOriginUrl, setDestinationOriginUrl] = useState<string>(Object.keys(initialPagesMap)[0]);

  // Compute destination origin based on the nearest navigable ancestor (TopFrame or Iframe)
  useEffect(() => {
    const allOriginUrls = Object.keys(pagesByOrigin);
    const navTarget = resolveNavTargetFrame(currentFrameName, frameElementsByFrameName as any);
    const computedDestination = findOriginForFrameName(navTarget, allOriginUrls, frameElementsByFrameName as any);
    setDestinationOriginUrl(computedDestination);
  }, [currentFrameName, containerRefs, pagesByOrigin, frameElementsByFrameName]);

  useEffect(() => {
    const pagesForDestination = pagesByOrigin[destinationOriginUrl] || [];
    setSelectedPageName(pagesForDestination[0] || "Home Page");
  }, [destinationOriginUrl, pagesByOrigin]);

  function addNewPage(): void {
    const baseName = "Page";
    let counter = 1;
    const existing = pagesByOrigin[selectedOriginUrl];
    while (existing.includes(`${baseName}${counter}`)) counter++;
    const newTitle = `${baseName}${counter}`;
    setPagesByOrigin(prev => ({
      ...prev,
      [selectedOriginUrl]: [...prev[selectedOriginUrl], newTitle],
    }));
    setExpandedItemIds(prev => [...prev, `${selectedOriginUrl}-${newTitle}`]);
    setSelectedPageName(newTitle);
  }

  function handleAddNavigationButton(): void {
    const isFrameOrContainer = false;
    const isHome = selectedPageName === "Home Page";
    const pageSegment = isHome ? "" : encodeURIComponent(selectedPageName);

    const navTarget = resolveNavTargetFrame(currentFrameName, frameElementsByFrameName as any);

    let destinationPage: string;
    if (isTopFrame(navTarget)) {
      destinationPage = destinationOriginUrl + pageSegment;
    } else if (isIframe(navTarget)) {
      destinationPage = destinationOriginUrl + navTarget + (isHome ? "" : "/" + pageSegment);
    } else {
      destinationPage = destinationOriginUrl + pageSegment;
    }

    addElementToCurrentFrame("NavigationButton", isFrameOrContainer, {
      destinationPage,
      navigationType: navigationMode,
    });
  }

  function removePage(originUrl: string, pageTitle: string): void {
    setPagesByOrigin(prev => ({
      ...prev,
      [originUrl]: prev[originUrl].filter(title => title !== pageTitle),
    }));
    if (selectedPageName === pageTitle) setSelectedPageName("Home Page");
  }

  const destinationPageOptions = pagesByOrigin[destinationOriginUrl] || ["Home Page"];

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
              {pageTitles.map(pageTitle => (
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
          {Object.keys(pagesByOrigin).map(originUrl => (
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

      <FormControl size="small" fullWidth sx={{ mb: 1 }}>
        <FormHelperText>Select a Container</FormHelperText>
        <Select
          value={currentFrameName}
          onChange={(event: SelectChangeEvent<string>) => setCurrentFrameName(event.target.value)}
          sx={{ textAlign: "center" }}
        >
          {frameNameList.map(frameName => (
            <MenuItem key={frameName} value={frameName}>
              {frameName.replace(/([A-Z])/g, " $1").trim().toUpperCase()}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" fullWidth sx={{ mb: 1 }}>
        <FormHelperText>
          Select destination (<strong>{destinationOriginUrl}</strong>)
        </FormHelperText>
        <Select
          value={selectedPageName}
          onChange={(event: SelectChangeEvent<string>) => setSelectedPageName(event.target.value)}
          sx={{ textAlign: "center" }}
        >
          {destinationPageOptions.map(pageOption => (
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
          <FormControlLabel
            value={NavigationType.FullRedirect}
            control={<Radio />}
            label="Full Page Navigation + Redirect"
          />
          <FormControlLabel value={NavigationType.SPA} control={<Radio />} label="SPA Navigation" />
          <FormControlLabel value={NavigationType.SPAReplace} control={<Radio />} label="SPA Navigation + Replace" />
        </RadioGroup>
      </FormControl>

      <Button variant="contained" color="secondary" fullWidth sx={{ mt: 2 }} onClick={handleAddNavigationButton}>
        Add Navigation Button
      </Button>
    </Stack>
  );
}
