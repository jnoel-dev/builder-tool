'use client'
import * as React from "react";
import { useFrame } from "@/components/contexts/FrameManager/FrameManager";
import { useEffect } from "react";
import { Stack, Button, Switch, FormControl, FormControlLabel, FormHelperText, Paper, Box, Divider } from "@mui/material";
import InfoIconWithTooltip from "../../infoIcon/InfoIcon";
import { isCspEnabledForFrame, setCspEnabledForFrame } from "@/components/contexts/FrameManager/framePersistence";
import Typography from "@mui/material/Typography";

export default function CSPMenu() {
  const {  currentFrameName } = useFrame();
  const [isCspEnabled, setIsCspEnabled] = React.useState(false);


  useEffect(() => {
    if (!currentFrameName) return;
    const enabled = isCspEnabledForFrame(currentFrameName);
    setIsCspEnabled(enabled);
  }, [currentFrameName]);

  function handleToggleChange(_: React.ChangeEvent<HTMLInputElement>, nextValue: boolean) {
    setIsCspEnabled(nextValue);
  }

function handleApplyClick() {
  if (!currentFrameName) return;

  setCspEnabledForFrame(currentFrameName, isCspEnabled);

  if (currentFrameName !== "TopFrame") {
    window.location.replace(window.location.href);
    return;
  }

  const currentUrl = new URL(window.location.href);
  const searchParams = new URLSearchParams(currentUrl.search);

  const hasCspParam = searchParams.has("csp");
  const shouldHaveCspParam = isCspEnabled;

  if (shouldHaveCspParam === hasCspParam) {
    window.location.replace(window.location.href);
    return;
  }

  if (shouldHaveCspParam) {
    const existingQuery = searchParams.toString();
    const newSearch = existingQuery ? `?${existingQuery}&csp` : "?csp";
    window.location.replace(`${currentUrl.origin}${currentUrl.pathname}${newSearch}${currentUrl.hash}`);
  } else {
    searchParams.delete("csp");
    const cleanedQuery = searchParams.toString();
    const newSearch = cleanedQuery ? `?${cleanedQuery}` : "";
    window.location.replace(`${currentUrl.origin}${currentUrl.pathname}${newSearch}${currentUrl.hash}`);
  }
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
        <Stack direction="row" spacing={0}>
          <FormControlLabel
            control={<Switch checked={isCspEnabled} onChange={handleToggleChange} />}
            label="CSP in headers"
            sx={{ margin: 0 }}
          />

        </Stack>
      </FormControl>
      <Button variant="contained" color="secondary" fullWidth onClick={handleApplyClick}>
        Apply
      </Button>
    </Stack>
 
  );
}
