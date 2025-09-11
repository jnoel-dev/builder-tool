'use client'
import * as React from "react";
import { useFrame } from "@/components/contexts/FrameManager/FrameManager";
import { Stack, Button, Switch, FormControl, FormControlLabel, FormHelperText, Paper, Box, Divider } from "@mui/material";
import InfoIconWithTooltip from "../../infoIcon/InfoIcon";
import { setFrameProperty, getFrameProperties } from "@/components/contexts/FrameManager/framePersistence";
import Typography from "@mui/material/Typography";
import { DEFAULT_FRAME_NAME } from "@/components/contexts/FrameManager/frameUtils";
import PropertyToggle from "../propertyToggle/PropertyToggle";

export default function CSPMenu() {
  const { currentFrameName } = useFrame();

function buildPropertyQuery(enabledProperties?: Record<string, any>): string {
  if (!enabledProperties || typeof enabledProperties !== 'object') return '';
  const enabledKeys = Object.keys(enabledProperties).filter(name => enabledProperties[name] === true).sort();
  return enabledKeys.length ? `?${enabledKeys.map(encodeURIComponent).join('&')}` : '';
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
    <Stack>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Divider sx={{ width: "100%" }} />
        <div><strong>Directives:</strong> script-src</div>
        <div><strong>Sources:</strong> self unsafe-inline</div>
        <Divider sx={{ width: "100%" }} />
      </div>

      <FormControl size="small" fullWidth>
          <PropertyToggle propertyKey="cspH" label="CSP in headers" />
          <PropertyToggle propertyKey="cspM" label="CSP in meta tag" />
      </FormControl>

      <Button variant="contained" color="secondary" fullWidth onClick={handleApplyClick}>
        Apply
      </Button>
    </Stack>
  );
}
