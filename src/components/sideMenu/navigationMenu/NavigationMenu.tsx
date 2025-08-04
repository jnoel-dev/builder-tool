"use client";

import React, { useState, useEffect, ChangeEvent } from "react";
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

function getInitialPagesByOrigin(): Record<string, string[]> {
  if (process.env.NODE_ENV === "development") {
    return {
      "localhost:3000/": ["Home Page"],
      "localhost:3000/frame/": ["Home Page"],
      "localhost:3001/frame/": ["Home Page"],
    };
  }
  return {
    "build.jonnoel.dev/": ["Home Page"],
    "build.jonnoel.dev/frame/": ["Home Page"],
    "frame.jonnoel.dev/frame/": ["Home Page"],
  };
}

function findOriginForFrameName(
  frameName: string,
  originUrls: string[],
  childMap: Record<string, { id: string }[]>
): string {
  const hostRoot = typeof window !== "undefined" ? `${window.location.host}/` : "";
  const lowerFrameName = frameName.toLowerCase();

  // there is prob better way to do this :/
  // this recursive searches container/frame's parents until parent frame is found
  
  if (lowerFrameName.includes("topframe")) {
    return originUrls.find(url => url === hostRoot) || originUrls[0];
  }
  if (lowerFrameName.includes("samedomain")) {
    return (
      originUrls.find(
        url => url.startsWith(hostRoot) && url.endsWith("/frame/")
      ) || originUrls[0]
    );
  }
  if (lowerFrameName.includes("crossdomain")) {
    return (
      originUrls.find(
        url => url.endsWith("/frame/") && url !== hostRoot + "frame/"
      ) || originUrls[0]
    );
  }
  for (const parentName in childMap) {
    if (childMap[parentName].some(child => child.id === frameName)) {
      return findOriginForFrameName(parentName, originUrls, childMap);
    }
  }
  return originUrls.includes(hostRoot) ? hostRoot : originUrls[0];
}

export default function NavigationMenu() {
  const {
    currentFrame,
    setCurrentFrame,
    frameList,
    containerRefs,
    frameElementsMap,
  } = useFrame();

  const initialPagesMap = getInitialPagesByOrigin();

  const [pagesByOrigin, setPagesByOrigin] = useState(initialPagesMap);
  const [selectedOriginUrl, setSelectedOriginUrl] = useState(
    Object.keys(initialPagesMap)[0]
  );
  const [selectedPageName, setSelectedPageName] = useState("Home Page");
  const [navigationMode, setNavigationMode] = useState("full");
  const [expandedItemIds, setExpandedItemIds] = useState<string[]>(() =>
    Object.entries(initialPagesMap).flatMap(([originUrl, pageTitles]) => [
      originUrl,
      ...pageTitles.map(pageTitle => `${originUrl}-${pageTitle}`),
    ])
  );
  const [destinationOriginUrl, setDestinationOriginUrl] = useState<string>(
    Object.keys(initialPagesMap)[0]
  );

  useEffect(() => {
    const allOriginUrls = Object.keys(pagesByOrigin);
    const computedDestination = findOriginForFrameName(
      currentFrame,
      allOriginUrls,
      frameElementsMap
    );
    setDestinationOriginUrl(computedDestination);
  }, [currentFrame, containerRefs, pagesByOrigin, frameElementsMap]);

  useEffect(() => {
    const pagesForDestination = pagesByOrigin[destinationOriginUrl] || [];
    setSelectedPageName(pagesForDestination[0] || "Home Page");
  }, [destinationOriginUrl, pagesByOrigin]);

  function addNewPage(): void {
    const baseName = "Page ";
    let counter = 1;
    const existingPages = pagesByOrigin[selectedOriginUrl];
    while (existingPages.includes(`${baseName}${counter}`)) {
      counter++;
    }
    const newPageTitle = `${baseName}${counter}`;
    setPagesByOrigin(prevMap => ({
      ...prevMap,
      [selectedOriginUrl]: [...prevMap[selectedOriginUrl], newPageTitle],
    }));
    setExpandedItemIds(prevIds => [
      ...prevIds,
      `${selectedOriginUrl}-${newPageTitle}`,
    ]);
    setSelectedPageName(newPageTitle);
  }

  function removePage(originUrl: string, pageTitle: string): void {
    setPagesByOrigin(prevMap => ({
      ...prevMap,
      [originUrl]: prevMap[originUrl].filter(title => title !== pageTitle),
    }));
    if (selectedPageName === pageTitle) {
      setSelectedPageName("Home Page");
    }
  }

  return (
    <Stack>
      <Box sx={{ width: "100%", mb: 2 }}>
        <FormHelperText>Pages</FormHelperText>
        <SimpleTreeView
          expandedItems={expandedItemIds}
          onExpandedItemsChange={(event, newExpandedIds) =>
            setExpandedItemIds(newExpandedIds)
          }
        >
          {Object.entries(pagesByOrigin).map(([originUrl, pageTitles]) => (
            <TreeItem key={originUrl} itemId={originUrl} label={originUrl}>
              {pageTitles.map(pageTitle => (
                <TreeItem
                  key={pageTitle}
                  itemId={`${originUrl}-${pageTitle}`}
                  label={
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography sx={{ flex: 1 }}>
                        {pageTitle}
                      </Typography>
                      {pageTitle !== "Home Page" && (
                        <IconButton
                          size="small"
                          onClick={() => removePage(originUrl, pageTitle)}
                        >
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
          onChange={(event: SelectChangeEvent<string>) =>
            setSelectedOriginUrl(event.target.value)
          }
          sx={{ textAlign: "center" }}
        >
          {Object.keys(pagesByOrigin).map(originUrl => (
            <MenuItem key={originUrl} value={originUrl}>
              {originUrl}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Button
        variant="contained"
        color="secondary"
        fullWidth
        onClick={addNewPage}
      >
        Add New Page
      </Button>

      <Divider sx={{ my: 2 }} />

      <FormControl size="small" fullWidth sx={{ mb: 1 }}>
        <FormHelperText>Select a Container</FormHelperText>
        <Select
          value={currentFrame}
          onChange={(event: SelectChangeEvent<string>) =>
            setCurrentFrame(event.target.value)
          }
          sx={{ textAlign: "center" }}
        >
          {frameList.map(frameName => (
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
          onChange={(event: SelectChangeEvent<string>) =>
            setSelectedPageName(event.target.value)
          }
          sx={{ textAlign: "center" }}
        >
          {(pagesByOrigin[destinationOriginUrl] || []).map(pageOption => (
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
            setNavigationMode(event.target.value)
          }
        >
          <FormControlLabel
            value="full"
            control={<Radio />}
            label="Full Page Navigation"
          />
          <FormControlLabel
            value="full-redirect"
            control={<Radio />}
            label="Full Page Navigation + Redirect"
          />
          <FormControlLabel
            value="spa"
            control={<Radio />}
            label="SPA Navigation"
          />
          <FormControlLabel
            value="spa-replace"
            control={<Radio />}
            label="SPA Navigation + Replace"
          />
        </RadioGroup>
      </FormControl>

      <Button
        variant="contained"
        color="secondary"
        fullWidth
        sx={{ mt: 2 }}
        onClick={() => {}}
      >
        Add Navigation Button
      </Button>
    </Stack>
  );
}
