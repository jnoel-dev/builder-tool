"use client";

import * as React from "react";
import Divider from "@mui/material/Divider";
import AddElementButton from "@/components/sideMenu/elementsMenu/addElementButton/AddElementButton";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import { FormHelperText, ListSubheader } from "@mui/material";
import { useFrame } from "@/components/contexts/FrameManager/FrameManager";

enum TabIndex {
  Frames,
  Panels,
  Inputs,
  Dialogs,
}

type DropdownItem = { id: string; label: string; disabled: boolean };

type DropdownSections = {
  itemsOnThisPage: DropdownItem[];
  itemsOnOtherPages: DropdownItem[];
};

function CustomTabPanel(props: { children?: React.ReactNode; index: number; value: number }) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} id={`simple-tabpanel-${index}`} {...other}>
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

function getTabProps(index: number) {
  return { id: `simple-tab-${index}` };
}

/**
 * Classify by createdOnPage for user-created frames.
 * defaultFrameName (TopFrame) is special: always "on this page" and labeled with the current page.
 */
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

export default function ElementsMenu() {
  const [selectedTab, setSelectedTab] = React.useState(TabIndex.Frames);
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

  function handleTabChange(_: React.SyntheticEvent, tabIndex: number) {
    setSelectedTab(tabIndex);
  }

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



  // 2) Auto-select a newly added frame (only when frame list grows).
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
    <div>
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

      <Box sx={{ width: "100%" }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            textColor="secondary"
            indicatorColor="secondary"
            centered
          >
            <Tab label="Frames" {...getTabProps(TabIndex.Frames)} />
            <Tab label="Panels" {...getTabProps(TabIndex.Panels)} />
            <Tab label="Inputs" {...getTabProps(TabIndex.Inputs)} />
            <Tab label="Dialogs" {...getTabProps(TabIndex.Dialogs)} />
          </Tabs>
        </Box>

        <CustomTabPanel value={selectedTab} index={TabIndex.Panels}>
          <AddElementButton displayName="Panel" />
          <Divider component="li" />
          <AddElementButton displayName="PanelSVG" />
          <Divider component="li" />
          <AddElementButton displayName="PanelCanvas" />
          <Divider component="li" />
          <AddElementButton displayName="PanelTable" />
          <Divider component="li" />
          <AddElementButton displayName="PanelDisabled" />
          <Divider component="li" />
        </CustomTabPanel>

        <CustomTabPanel value={selectedTab} index={TabIndex.Inputs}>
          <AddElementButton displayName="Input" />
          <Divider component="li" />
          <AddElementButton displayName="InputReact" />
          <Divider component="li" />
          <AddElementButton displayName="InputComplex" />
          <Divider component="li" />
          <AddElementButton displayName="InputRedraw" />
          <Divider component="li" />
          <AddElementButton displayName="InputPointerEvent" />
          <Divider component="li" />
        </CustomTabPanel>

        <CustomTabPanel value={selectedTab} index={TabIndex.Dialogs}>
          <AddElementButton displayName="DialogNative" />
          <Divider component="li" />
          <AddElementButton displayName="DialogUI5" />
          <Divider component="li" />
          <AddElementButton displayName="DialogMUI" />
          <Divider component="li" />
          <AddElementButton displayName="DialogForge" />
          <Divider component="li" />
          <AddElementButton displayName="DialogFocusTrap" />
          <Divider component="li" />
        </CustomTabPanel>

        <CustomTabPanel value={selectedTab} index={TabIndex.Frames}>
          <AddElementButton
            displayName="Iframe"
            componentNames={["IframeSameDomain", "IframeCrossDomain"]}
            isFrameOrContainer={true}
          />
          <Divider component="li" />
          <AddElementButton
            displayName="PopupWindow"
            componentNames={["PopupWindowSameDomain", "PopupWindowCrossDomain"]}
            isFrameOrContainer={true}
          />
          <Divider component="li" />
          <AddElementButton
            displayName="Container"
            componentNames={["ContainerVertical", "ContainerHorizontal"]}
            isFrameOrContainer={true}
          />
          <Divider component="li" />
          <AddElementButton
            displayName="Fragment"
            componentNames={["FragmentVertical", "FragmentHorizontal"]}
            isFrameOrContainer={true}
          />
          <Divider component="li" />
          <AddElementButton
            displayName="ShadowRoot"
            componentNames={["ShadowRootOpen", "ShadowRootClosed"]}
            isFrameOrContainer={true}
          />
          <Divider component="li" />
        </CustomTabPanel>
      </Box>
    </div>
  );
}
