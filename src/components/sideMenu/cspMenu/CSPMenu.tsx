import * as React from "react";
import Divider from "@mui/material/Divider";
import ContainerSelector from "../elementsMenu/containerSelector/ContainerSelector";
import { useFrame } from "@/components/contexts/FrameManager/FrameManager";
import { useEffect } from "react";
import { Stack, Button, Switch, FormControl, FormControlLabel, FormHelperText } from "@mui/material";
import InfoIconWithTooltip from "../infoIcon/InfoIcon";
import { isCspEnabledForFrame, setCspEnabledForFrame } from "@/components/contexts/FrameManager/framePersistence";

export default function CSPMenu({ expanded }: { expanded: boolean }) {
  const { setCurrentFrameName, defaultFrameName, currentFrameName } = useFrame();
  const [isCspEnabled, setIsCspEnabled] = React.useState(false);

  useEffect(() => {
    if (expanded) setCurrentFrameName(defaultFrameName);
  }, [expanded]);

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
      <ContainerSelector listTrueFramesOnly={true} />
      <Divider component="li" />
      <FormControl size="small" fullWidth>
        <FormHelperText>Enable CSP</FormHelperText>
        <Stack direction="row" spacing={0}>
          <FormControlLabel
            control={<Switch checked={isCspEnabled} onChange={handleToggleChange} />}
            label="CSP in headers"
            sx={{ margin: 0 }}
          />
          <InfoIconWithTooltip
            infoText={
              <>
                <strong>Applies the below only:</strong>
                <br />
                Directives: script-src
                <br />
                Sources: self unsafe-inline
              </>
            }
          />
        </Stack>
      </FormControl>
      <Button variant="contained" color="secondary" fullWidth onClick={handleApplyClick}>
        Apply
      </Button>
    </Stack>
  );
}
