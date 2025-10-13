"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Box, Button, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Panel from "../../panels/panel/Panel";

const ForgeDialog = dynamic(
  () => import("@tylertech/forge-react").then((mod) => mod.ForgeDialog),
  { ssr: false },
);

export default function DialogForge() {
  const [isOpen, setIsOpen] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    import("@tylertech/forge")
      .then((mod) => mod.defineComponents())
      .catch((err) => console.error("Failed to load Forge:", err));
  }, []);

  const openDialog = () => setIsOpen(true);
  const closeDialog = () => setIsOpen(false);

  return (
    <>
      <Box sx={{ backgroundColor: theme.palette.primary.main, p: 2 }}>
        <Button
          variant="contained"
          color="secondary"
          sx={{ color: theme.palette.text.primary, width: "100%" }}
          onClick={openDialog}
        >
          Open Dialog
        </Button>
      </Box>

      <ForgeDialog
        open={isOpen}
        persistent={false}
        on-forge-dialog-close={closeDialog}
      >
        <Box
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.text.primary,
            p: 2,
          }}
        >
          <Stack spacing={2}>
            <Panel />
            <Button
              variant="contained"
              color="secondary"
              sx={{ color: theme.palette.text.primary }}
              onClick={closeDialog}
            >
              Close
            </Button>
          </Stack>
        </Box>
      </ForgeDialog>
    </>
  );
}
