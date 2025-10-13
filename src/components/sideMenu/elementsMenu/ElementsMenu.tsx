// src/components/sideMenu/elementsMenu/ElementsMenu.tsx
"use client";

import { useState } from "react";
import Divider from "@mui/material/Divider";
import AddElementButton from "@/components/sideMenu/elementsMenu/addElementButton/AddElementButton";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import ContainerSelector from "./containerSelector/ContainerSelector";

enum TabIndex {
  Frames,
  Panels,
  Inputs,
  Dialogs,
}

function CustomTabPanel(props: {
  children?: React.ReactNode;
  index: number;
  value: number;
}) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

function getTabProps(index: number) {
  return { id: `simple-tab-${index}` };
}

export default function ElementsMenu() {
  const [selectedTab, setSelectedTab] = useState(TabIndex.Frames);

  function handleTabChange(_: React.SyntheticEvent, tabIndex: number) {
    setSelectedTab(tabIndex);
  }

  return (
    <div>
      <ContainerSelector />

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
