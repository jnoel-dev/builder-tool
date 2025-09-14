'use client'
import * as React from "react";
import { Stack,  FormControl, Divider } from "@mui/material";

import PropertyToggle from "../propertyToggle/PropertyToggle";

export default function NativeFunctionsMenu() {

  return (
    <Stack>

      <FormControl size="small" fullWidth>
          <PropertyToggle propertyKey="nfGCS" label="Override getComputedStyle"/>

      </FormControl>


    </Stack>
  );
}
