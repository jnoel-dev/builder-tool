// src/components/sideMenu/elementsMenu/ElementsMenu.tsx
"use client";

import * as React from "react";
import Divider from "@mui/material/Divider";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import ContainerSelector from "../elementsMenu/containerSelector/ContainerSelector";
import CSPMenu from "./cspMenu/CSPMenu";
import { useFrame } from "@/components/contexts/FrameManager/FrameManager";
import { DEFAULT_FRAME_NAME } from "@/components/contexts/FrameManager/frameUtils";
import { setFrameProperty, getFrameProperties } from "@/components/contexts/FrameManager/framePersistence";
import { Button } from "@mui/material";

enum TabIndex {
  CSP,
  CSS,
  NativeFunctions,
}



function buildPropertyQuery(enabledProperties?: Record<string, any>): string {
  if (!enabledProperties || typeof enabledProperties !== 'object') return '';
  const enabledKeys = Object.keys(enabledProperties).filter(name => enabledProperties[name] === true).sort();
  return enabledKeys.length ? `?${enabledKeys.map(encodeURIComponent).join('&')}` : '';
}


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

export default function PropertiesMenu(expanded: boolean) {
  const [selectedTab, setSelectedTab] = React.useState(TabIndex.CSP);
  const { setCurrentFrameName } = useFrame();
  const { currentFrameName } = useFrame();

    React.useEffect(() => {
    setCurrentFrameName(DEFAULT_FRAME_NAME);
    }, [expanded]);


  function handleTabChange(_: React.SyntheticEvent, tabIndex: number) {
    setSelectedTab(tabIndex);
  }

  function handleApplyClick() {
  if (!currentFrameName) return;

  if (currentFrameName !== DEFAULT_FRAME_NAME) {
    window.location.reload();
    return;
  }

  const topProps = getFrameProperties(DEFAULT_FRAME_NAME);
  const propertyQuery = buildPropertyQuery(topProps);

  const url = new URL(window.location.href);
  url.search = propertyQuery;
  history.replaceState(null, '', url.toString());
  window.location.reload();
}

  return (
    <div>
       <ContainerSelector listTrueFramesOnly={true} />

      <Box sx={{ width: "100%" }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            textColor="secondary"
            indicatorColor="secondary"
            centered
          >
            <Tab label="CSP" {...getTabProps(TabIndex.CSP)} />
            <Tab label="Native Functions" {...getTabProps(TabIndex.NativeFunctions)} />
          </Tabs>
        </Box>

        <CustomTabPanel value={selectedTab} index={TabIndex.CSP}>
          <CSPMenu/>
        </CustomTabPanel>

        <CustomTabPanel value={selectedTab} index={TabIndex.CSS}>
          <Divider component="li" />
        </CustomTabPanel>

        <CustomTabPanel value={selectedTab} index={TabIndex.NativeFunctions}>
          <Divider component="li" />
        </CustomTabPanel>
      </Box>
      <Button variant="contained" color="secondary" fullWidth onClick={handleApplyClick}>
        Apply
      </Button>
    </div>
  );
}
