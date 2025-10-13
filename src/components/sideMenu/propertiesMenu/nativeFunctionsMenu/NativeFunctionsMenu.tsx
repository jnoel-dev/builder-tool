"use client";
import * as React from "react";
import { Stack, FormControl } from "@mui/material";

import PropertyToggle from "../propertyToggle/PropertyToggle";

export default function NativeFunctionsMenu() {
  return (
    <Stack>
      <FormControl size="small" fullWidth>
        <PropertyToggle
          propertyKey="nfGCS"
          label="Override getComputedStyle (sets blank style)"
        />
        <PropertyToggle
          propertyKey="nfR"
          label="Override Request (sets empty headers)"
        />
        <PropertyToggle
          propertyKey="nfP"
          label="Override Promise (via zone.js)"
        />
        <PropertyToggle
          propertyKey="nfSA"
          label="Override setAttribute (removes style)"
        />
      </FormControl>
    </Stack>
  );
}
