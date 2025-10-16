"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { Box, Checkbox, FormControlLabel, Switch } from "@mui/material";
import { useFrame } from "@/components/contexts/FrameManager/FrameManager";
import { getFrameProperties } from "@/components/contexts/FrameManager/framePersistence";
import {
  stagePropertyChange,
  getStagedSnapshot,
} from "@/components/sideMenu/propertiesMenu/PropertiesMenu";

type PropertyToggleProps = {
  propertyKey: string;
  label: string;
  additionalPropertyKey?: string;
  additionalPropertyLabel?: string;
};

export default function PropertyToggle({
  propertyKey,
  label,
  additionalPropertyKey = "",
  additionalPropertyLabel = "",
}: PropertyToggleProps) {
  const { currentFrameName, receivedFirebaseResponse } = useFrame();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isAdditionalChecked, setIsAdditionalChecked] = useState(false);

  useEffect(() => {
    if (!currentFrameName) return;

    const baseProperties = getFrameProperties(currentFrameName);
    const stagedSnapshot = getStagedSnapshot();
    const stagedForFrame = stagedSnapshot[currentFrameName] ?? {};

    function isPropertyOn(propertyName: string): boolean {
      if (Object.prototype.hasOwnProperty.call(stagedForFrame, propertyName)) {
        return Boolean(stagedForFrame[propertyName]);
      }
      return Boolean(baseProperties[propertyName]);
    }

    const primaryOn = isPropertyOn(propertyKey);
    const additionalOn = additionalPropertyKey
      ? isPropertyOn(additionalPropertyKey)
      : false;

    if (additionalOn) {
      setIsAdditionalChecked(true);
      setIsEnabled(true);
    } else if (primaryOn) {
      setIsAdditionalChecked(false);
      setIsEnabled(true);
    } else {
      setIsAdditionalChecked(false);
      setIsEnabled(false);
    }
  }, [
    currentFrameName,
    receivedFirebaseResponse,
    propertyKey,
    additionalPropertyKey,
  ]);

  function handleToggleChange(
    _: ChangeEvent<HTMLInputElement>,
    nextValue: boolean,
  ) {
    setIsEnabled(nextValue);
    if (!currentFrameName) return;

    if (!nextValue) {
      stagePropertyChange(currentFrameName, propertyKey, false);
      if (additionalPropertyKey)
        stagePropertyChange(currentFrameName, additionalPropertyKey, false);
      return;
    }

    const selectedKey =
      isAdditionalChecked && additionalPropertyKey
        ? additionalPropertyKey
        : propertyKey;

    stagePropertyChange(currentFrameName, selectedKey, true);

    if (additionalPropertyKey) {
      if (selectedKey === additionalPropertyKey) {
        stagePropertyChange(currentFrameName, propertyKey, false);
      } else {
        stagePropertyChange(currentFrameName, additionalPropertyKey, false);
      }
    }
  }

  function handleAdditionalCheckboxChange(
    _: ChangeEvent<HTMLInputElement>,
    checked: boolean,
  ) {
    setIsAdditionalChecked(checked);
    if (!currentFrameName || !additionalPropertyKey) return;
    if (!isEnabled) return;

    if (checked) {
      stagePropertyChange(currentFrameName, additionalPropertyKey, true);
      stagePropertyChange(currentFrameName, propertyKey, false);
    } else {
      stagePropertyChange(currentFrameName, propertyKey, true);
      stagePropertyChange(currentFrameName, additionalPropertyKey, false);
    }
  }

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <FormControlLabel
        control={<Switch checked={isEnabled} onChange={handleToggleChange} />}
        label={label}
        sx={{ margin: 0 }}
      />
      {additionalPropertyKey ? (
        <FormControlLabel
          control={
            <Checkbox
              checked={isAdditionalChecked}
              onChange={handleAdditionalCheckboxChange}
              size="small"
            />
          }
          label={additionalPropertyLabel}
          sx={{ margin: 0 }}
        />
      ) : null}
    </Box>
  );
}
