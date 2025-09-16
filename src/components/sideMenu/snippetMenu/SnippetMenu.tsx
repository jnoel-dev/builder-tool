"use client";

import React from "react";
import { Button, Stack, TextField, FormControlLabel, Radio, FormControl, RadioGroup, FormHelperText, InputAdornment, Tooltip, Switch} from "@mui/material";

enum UUIDType {
  Variable = "variable",
  Cookie = "cookie",
  ForceLoad = "forceLoad",
}

export default function SnippetMenu() {
  const [uuidType, setUuidType] = React.useState<UUIDType>(UUIDType.ForceLoad);

  const dynamicLabel =
    uuidType === UUIDType.Variable
      ? "Variable name"
      : uuidType === UUIDType.Cookie
      ? "Cookie name"
      : "Name";

  const isForceLoad = uuidType === UUIDType.ForceLoad;

  return (
    <Stack spacing={1}>
      <TextField variant="standard" label="System GUID" slotProps={{ inputLabel: { shrink: true } }} />
      <TextField variant="standard" label="Environment path name" slotProps={{ inputLabel: { shrink: true } }} defaultValue={"success"} />
      <TextField variant="standard" label="CDN domain" slotProps={{ inputLabel: { shrink: true } }} defaultValue={"cdn.walkme.com"} />
      <FormControlLabel
        control={<Switch checked={true} />}
        label={"Load in CD iFrames"}
        sx={{ margin: 0 }}
      />
      <FormControl size="small" fullWidth>
        <FormHelperText sx={{ margin: 0 }}>UUID</FormHelperText>
        <RadioGroup value={uuidType} onChange={(event) => setUuidType(event.target.value as UUIDType)}>
          <Tooltip followCursor placement="top" arrow
          title={
            <>
              Test
              <br />
              Test
            </>
          }
        >
          <FormControlLabel value={UUIDType.ForceLoad} control={<Radio />} label="Force load" />
        </Tooltip>
          <FormControlLabel value={UUIDType.Variable} control={<Radio />} label="Variable" />
          <FormControlLabel value={UUIDType.Cookie} control={<Radio />} label="Cookie" />
        </RadioGroup>
      </FormControl>
      <TextField variant="standard" slotProps={{ inputLabel: { shrink: true } }} label={dynamicLabel} fullWidth disabled={isForceLoad} />
      <TextField variant="standard" label="Value" slotProps={{ inputLabel: { shrink: true } }} disabled={isForceLoad} />
      <TextField
        variant="standard"
        label="Delay UUID on document load"
        defaultValue={0}
        slotProps={{
          inputLabel: { shrink: true },
          input: {
            endAdornment: <InputAdornment position="end">ms</InputAdornment>,
            inputMode: "numeric",
          },
        }}
        disabled={isForceLoad}
      />
      <Button variant="contained" color="secondary" fullWidth>
        Apply
      </Button>
    </Stack>
  );
}


{/* <script type="text/javascript">(function() {var walkme = document.createElement('script'); walkme.type = 'text/javascript'; walkme.async = true; walkme.src = 'https://cdn.walkme.com</script> */}