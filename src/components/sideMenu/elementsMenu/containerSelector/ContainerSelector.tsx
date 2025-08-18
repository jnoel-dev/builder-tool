"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import { FormHelperText, ListSubheader } from "@mui/material";
import { useFrame } from "@/components/contexts/FrameManager/FrameManager";

type DropdownItem = { id: string; label: string; disabled: boolean };

type DropdownSections = {
  itemsOnThisPage: DropdownItem[];
  itemsOnOtherPages: DropdownItem[];
};

function buildFrameDropdownSections(
  currentRootPageName: string,
  orderedFrameNames: string[],
  getCreatedOnPage: (name: string) => string,
  defaultFrameName: string
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
      itemsOnThisPage.push({ id: frameName, label: `${frameName} — ${createdOnPage}`, disabled: false });
    } else {
      itemsOnOtherPages.push({ id: frameName, label: `${frameName} — ${createdOnPage}`, disabled: true });
    }
  }

  return { itemsOnThisPage, itemsOnOtherPages };
}

export default function ContainerSelector() {
  const {
    currentFrameName,
    setCurrentFrameName,
    frameNameList,
    rootPageName,
    getFrameCreatedOnPage,
    defaultFrameName,
  } = useFrame();

  const [itemsOnThisPage, setItemsOnThisPage] = React.useState<DropdownItem[]>([]);
  const [itemsOnOtherPages, setItemsOnOtherPages] = React.useState<DropdownItem[]>([]);

  function handleFrameChange(event: SelectChangeEvent) {
    setCurrentFrameName(event.target.value as string);
  }

  function rebuildDropdown(): void {
    const sections = buildFrameDropdownSections(
      rootPageName,
      frameNameList,
      getFrameCreatedOnPage,
      defaultFrameName
    );
    setItemsOnThisPage(sections.itemsOnThisPage);
    setItemsOnOtherPages(sections.itemsOnOtherPages);
  }

  React.useEffect(rebuildDropdown, [
    frameNameList,
    rootPageName,
    getFrameCreatedOnPage,
    defaultFrameName,
  ]);

  const previousFrameNamesRef = React.useRef<string[]>([]);
  React.useEffect(() => {
    const prev = previousFrameNamesRef.current;
    if (prev.length === 0) {
      previousFrameNamesRef.current = frameNameList;
      return;
    }
    if (frameNameList.length > prev.length) {
      const prevSet = new Set(prev);
      const added = frameNameList.find((name) => !prevSet.has(name));
      if (added) setCurrentFrameName(added);
    }
    previousFrameNamesRef.current = frameNameList;
  }, [frameNameList, setCurrentFrameName]);

  const selectChildren: React.ReactNode[] = [
    <ListSubheader key="this-header">Frames on this page</ListSubheader>,
    ...itemsOnThisPage.map((item) => (
      <MenuItem key={`this-${item.id}`} value={item.id} disabled={item.disabled}>
        {item.label}
      </MenuItem>
    )),
    ...(itemsOnOtherPages.length > 0
      ? [
          <ListSubheader key="other-header">Frames on other pages</ListSubheader>,
          ...itemsOnOtherPages.map((item) => (
            <MenuItem key={`other-${item.id}`} value={item.id} disabled>
              {item.label}
            </MenuItem>
          )),
        ]
      : []),
  ];

  return (
    <Box display="flex" width="100%" alignItems="center">
      <FormControl size="small" sx={{ flex: 1, paddingTop: "4px" }}>
        <FormHelperText>Select a container</FormHelperText>
        <Select
          labelId="frame-select-label"
          id="frame-select-label"
          value={itemsOnThisPage.length + itemsOnOtherPages.length === 0 ? "" : currentFrameName}
          onChange={handleFrameChange}
          sx={{ textAlign: "center" }}
        >
          {selectChildren}
        </Select>
      </FormControl>
    </Box>
  );
}
