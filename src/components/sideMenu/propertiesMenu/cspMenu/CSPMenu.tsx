"use client";
import * as React from "react";
import { Stack, FormControl, Divider } from "@mui/material";

import PropertyToggle from "../propertyToggle/PropertyToggle";

export default function CSPMenu() {
  return (
    <Stack>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div style={{ padding: "8px 0", textAlign: "center" }}>
          <div>
            <strong>Directives:</strong> script-src
          </div>
          <div>
            <strong>Sources:</strong> self unsafe-inline
          </div>
        </div>

        <Divider sx={{ width: "100%" }} />
      </div>

      <FormControl size="small" fullWidth>
        <PropertyToggle
          propertyKey="cspH"
          label="CSP via headers"
          additionalPropertyKey="cspSW"
          additionalPropertyLabel="set using service worker"
        />
        <PropertyToggle
          propertyKey="cspM"
          label="CSP via meta tag"
          additionalPropertyKey="cspMN"
          additionalPropertyLabel="add nonce value"
        />
      </FormControl>
    </Stack>
  );
}
