"use client";

import { useMemo, useCallback } from "react";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import { FormHelperText, ListSubheader } from "@mui/material";
import { useFrame } from "@/components/contexts/FrameManager/FrameManager";
import componentRegistry from "@/components/contexts/FrameManager/componentRegistry";
import Frame from "@/components/addableElements/frames/frame/Frame";

type DropdownItem = { id: string; label: string; disabled: boolean };

type DropdownSections = {
  itemsOnThisPage: DropdownItem[];
  itemsOnOtherPages: DropdownItem[];
};

function buildFrameDropdownSections(
  currentRootPageName: string,
  orderedFrameNames: string[],
  getCreatedOnPage: (name: string) => string,
  defaultFrameName: string,
): DropdownSections {
  const itemsOnThisPage: DropdownItem[] = [];
  const itemsOnOtherPages: DropdownItem[] = [];

  for (const frameName of orderedFrameNames) {
    if (frameName === defaultFrameName) {
      itemsOnThisPage.push({
        id: frameName,
        label: `${frameName} — ${currentRootPageName}`,
        disabled: false,
      });
      continue;
    }
    const createdOnPage = getCreatedOnPage(frameName);
    const isOnThisPage = createdOnPage === currentRootPageName;
    if (isOnThisPage) {
      itemsOnThisPage.push({
        id: frameName,
        label: `${frameName} — ${createdOnPage}`,
        disabled: false,
      });
    } else {
      itemsOnOtherPages.push({
        id: frameName,
        label: `${frameName} — ${createdOnPage}`,
        disabled: true,
      });
    }
  }

  return { itemsOnThisPage, itemsOnOtherPages };
}

function isTrueFrameByName(
  frameName: string,
  defaultFrameName: string,
): boolean {
  if (frameName === defaultFrameName) return true;
  const baseName = frameName.replace(/-\d+$/, "");
  const entry = (
    componentRegistry as Record<
      string,
      { component?: React.ComponentType<unknown> }
    >
  )[baseName];
  if (!entry || !entry.component) return false;
  return entry.component === Frame;
}

type ContainerSelectorProps = {
  listTrueFramesOnly?: boolean;
};

export default function ContainerSelector({
  listTrueFramesOnly = false,
}: ContainerSelectorProps) {
  const {
    currentFrameName,
    setCurrentFrameName,
    frameNameList,
    rootPageName,
    getFrameCreatedOnPage,
    defaultFrameName,
  } = useFrame();

  function handleFrameChange(event: SelectChangeEvent) {
    setCurrentFrameName(event.target.value as string);
  }

  const sections = useMemo(
    () =>
      buildFrameDropdownSections(
        rootPageName,
        frameNameList,
        getFrameCreatedOnPage,
        defaultFrameName,
      ),
    [rootPageName, frameNameList, getFrameCreatedOnPage, defaultFrameName],
  );

  const filterVisible = useCallback(
    (list: DropdownItem[]): DropdownItem[] => {
      if (!listTrueFramesOnly) return list;
      const visible: DropdownItem[] = [];
      for (const item of list) {
        if (
          item.id === defaultFrameName ||
          isTrueFrameByName(item.id, defaultFrameName)
        ) {
          visible.push(item);
        }
      }
      return visible;
    },
    [listTrueFramesOnly, defaultFrameName],
  );

  const ensureDefaultEnabled = useCallback(
    (list: DropdownItem[]): DropdownItem[] => {
      const adjusted: DropdownItem[] = [];
      for (const item of list) {
        if (item.id === defaultFrameName) {
          adjusted.push({ ...item, disabled: false });
        } else {
          adjusted.push(item);
        }
      }
      return adjusted;
    },
    [defaultFrameName],
  );

  const visibleItemsOnThisPage = useMemo(() => {
    const filtered = filterVisible(sections.itemsOnThisPage);
    return ensureDefaultEnabled(filtered);
  }, [sections.itemsOnThisPage, filterVisible, ensureDefaultEnabled]);

  const visibleItemsOnOtherPages = useMemo(() => {
    const filtered = filterVisible(sections.itemsOnOtherPages);
    return ensureDefaultEnabled(filtered);
  }, [sections.itemsOnOtherPages, filterVisible, ensureDefaultEnabled]);

  const allVisibleItems = useMemo(
    () => [...visibleItemsOnThisPage, ...visibleItemsOnOtherPages],
    [visibleItemsOnThisPage, visibleItemsOnOtherPages],
  );

  const allowedFrameIds = useMemo(() => {
    const set = new Set<string>();
    for (const item of allVisibleItems) set.add(item.id);
    return set;
  }, [allVisibleItems]);

  let selectedFrameValue = "";
  if (allowedFrameIds.has(currentFrameName)) {
    selectedFrameValue = currentFrameName;
  } else if (allowedFrameIds.has(defaultFrameName)) {
    selectedFrameValue = defaultFrameName;
  }

  const menuItems: React.ReactNode[] = [];
  menuItems.push(
    <ListSubheader key="this-header">Frames on this page</ListSubheader>,
  );
  for (const item of visibleItemsOnThisPage) {
    menuItems.push(
      <MenuItem
        key={`this-${item.id}`}
        value={item.id}
        disabled={item.disabled}
      >
        {item.label}
      </MenuItem>,
    );
  }
  if (visibleItemsOnOtherPages.length > 0) {
    menuItems.push(
      <ListSubheader key="other-header">Frames on other pages</ListSubheader>,
    );
    for (const item of visibleItemsOnOtherPages) {
      menuItems.push(
        <MenuItem key={`other-${item.id}`} value={item.id} disabled>
          {item.label}
        </MenuItem>,
      );
    }
  }

  return (
    <Box display="flex" width="100%" alignItems="center">
      <FormControl size="small" sx={{ flex: 1, paddingTop: "4px" }}>
        <FormHelperText>Select a container</FormHelperText>
        <Select
          labelId="frame-select-label"
          id="frame-select-label"
          value={selectedFrameValue}
          onChange={handleFrameChange}
          sx={{ textAlign: "center" }}
          displayEmpty
        >
          {menuItems}
        </Select>
      </FormControl>
    </Box>
  );
}
