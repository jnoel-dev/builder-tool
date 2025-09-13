'use client'
import * as React from "react";
import { useFrame } from "@/components/contexts/FrameManager/FrameManager";
import { Stack, Button, Switch, FormControl, FormControlLabel, FormHelperText, Paper, Box, Divider } from "@mui/material";
import InfoIconWithTooltip from "../../infoIcon/InfoIcon";

import Typography from "@mui/material/Typography";
import { DEFAULT_FRAME_NAME } from "@/components/contexts/FrameManager/frameUtils";
import PropertyToggle from "../propertyToggle/PropertyToggle";

export default function CSPMenu() {


function buildPropertyQuery(enabledProperties?: Record<string, any>): string {
  if (!enabledProperties || typeof enabledProperties !== 'object') return '';
  const enabledKeys = Object.keys(enabledProperties).filter(name => enabledProperties[name] === true).sort();
  return enabledKeys.length ? `?${enabledKeys.map(encodeURIComponent).join('&')}` : '';
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
          {/* <PropertyToggle propertyKey="cspM" label="CSP in meta tag" additionalPropertyKey='cspMN' additionalPropertyLabel='add nonce value'/> */}
          <PropertyToggle propertyKey="cspM" label="CSP in meta tag"/>
      </FormControl>


    </Stack>
  );
}
