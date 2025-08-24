import * as React from "react";
import Divider from "@mui/material/Divider";
import ContainerSelector from "../elementsMenu/containerSelector/ContainerSelector";
import { useFrame } from "@/components/contexts/FrameManager/FrameManager";
import { useEffect } from "react";
import { Stack, Button, Switch, FormControl, FormControlLabel, FormHelperText} from "@mui/material";

export default function CSPMenu({ expanded }: { expanded: boolean }) {
  const { setCurrentFrameName, defaultFrameName } = useFrame();

  useEffect(() => {
    if (expanded) setCurrentFrameName(defaultFrameName);
  }, [expanded]);

  return (
    <Stack>
      <ContainerSelector listTrueFramesOnly={true} />
      <Divider component="li" />
      <FormControl size="small" fullWidth>
        <FormHelperText>Enable CSP</FormHelperText>
        <FormControlLabel  control={<Switch />} label="CSP in headers" />
      </FormControl>
      <Button variant="contained" color="secondary" fullWidth >
        Apply
      </Button>
    </Stack>
  );
}
