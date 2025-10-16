"use client";

import React, { useState } from "react";
import { Box, Button, Stack, Dialog } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Panel from "../../panels/panel/Panel";

interface DialogMUIProps {
  shouldFocus?: boolean;
}

export default function DialogMUI({ shouldFocus = false }: DialogMUIProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const theme = useTheme();

  const openDialog = () => setIsDialogOpen(true);
  const closeDialog = () => setIsDialogOpen(false);

  return (
    <>
      <Box sx={{ backgroundColor: theme.palette.primary.main, padding: 2 }}>
        <Button
          variant="contained"
          onClick={openDialog}
          color="secondary"
          sx={{ color: theme.palette.text.primary, width: "100%" }}
        >
          Open Dialog
        </Button>
      </Box>

      <Dialog
        open={isDialogOpen}
        onClose={closeDialog}
        {...(!shouldFocus
          ? { disableEnforceFocus: true, disableRestoreFocus: true }
          : {})}
      >
        <Box
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.text.primary,
            padding: 2,
          }}
        >
          <Stack spacing={2}>
            <Panel />
            <Button
              variant="contained"
              onClick={closeDialog}
              color="secondary"
              sx={{ color: theme.palette.text.primary }}
            >
              Close
            </Button>
          </Stack>
        </Box>
      </Dialog>
    </>
  );
}
