"use client";

import { useEffect, useState, ReactNode, SyntheticEvent } from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import ContainerSelector from "../elementsMenu/containerSelector/ContainerSelector";
import CSPMenu from "./cspMenu/CSPMenu";
import { useFrame } from "@/components/contexts/FrameManager/FrameManager";
import { DEFAULT_FRAME_NAME } from "@/components/contexts/FrameManager/frameUtils";
import { Button } from "@mui/material";
import NativeFunctionsMenu from "./nativeFunctionsMenu/NativeFunctionsMenu";
import { setFrameProperties } from "@/components/contexts/FrameManager/framePersistence";

enum TabIndex {
  CSP,
  NativeFunctions,
}

function CustomTabPanel(props: {
  children?: ReactNode;
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

type StagedMap = Record<string, Record<string, boolean>>;
type StageSetter = (
  frameName: string,
  propertyKey: string,
  isEnabled: boolean,
) => void;
type StagedGetter = () => StagedMap;

let stageSetterRef: StageSetter = () => {};
let stagedGetterRef: StagedGetter = () => ({});

export function stagePropertyChange(
  frameName: string,
  propertyKey: string,
  isEnabled: boolean,
): void {
  stageSetterRef(frameName, propertyKey, isEnabled);
}

export function getStagedSnapshot(): StagedMap {
  return stagedGetterRef();
}

export default function PropertiesMenu(expanded: boolean) {
  const [selectedTab, setSelectedTab] = useState(TabIndex.CSP);
  const { setCurrentFrameName, currentFrameName } = useFrame();
  const [staged, setStaged] = useState<StagedMap>({});

  useEffect(() => {
    setCurrentFrameName(DEFAULT_FRAME_NAME);
  }, [expanded, setCurrentFrameName]);

  useEffect(() => {
    stageSetterRef = (
      frameName: string,
      propertyKey: string,
      isEnabled: boolean,
    ) => {
      setStaged((previous) => {
        const frameMap = previous[frameName] ?? {};
        const nextFrameMap = { ...frameMap, [propertyKey]: isEnabled };
        return { ...previous, [frameName]: nextFrameMap };
      });
    };
    stagedGetterRef = () => staged;
    return () => {
      stageSetterRef = () => {};
      stagedGetterRef = () => ({});
    };
  }, [staged]);

  function handleTabChange(_: SyntheticEvent, tabIndex: number) {
    setSelectedTab(tabIndex);
  }

  async function handleApplyClick() {
    if (!currentFrameName) return;
    const wasSaved = await setFrameProperties(staged);
    if (!wasSaved) return;
    setStaged({});
    if (currentFrameName !== DEFAULT_FRAME_NAME) {
      window.location.reload();
      return;
    }
    const urlObject = new URL(window.location.href);
    history.replaceState(null, "", urlObject.toString());
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
            <Tab
              label="Native Functions"
              {...getTabProps(TabIndex.NativeFunctions)}
            />
          </Tabs>
        </Box>
        <CustomTabPanel value={selectedTab} index={TabIndex.CSP}>
          <CSPMenu />
        </CustomTabPanel>
        <CustomTabPanel value={selectedTab} index={TabIndex.NativeFunctions}>
          <NativeFunctionsMenu />
        </CustomTabPanel>
      </Box>
      <Button
        variant="contained"
        color="secondary"
        fullWidth
        onClick={handleApplyClick}
      >
        Apply
      </Button>
    </div>
  );
}
