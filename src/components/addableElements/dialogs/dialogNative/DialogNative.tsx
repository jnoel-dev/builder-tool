"use client";

import React, { useRef } from "react";
import { Box, Button, Stack, styled } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Panel from "../../panels/panel/Panel";

const StyledDialog = styled("dialog")(() => ({
  padding: 0,
  border: "none",
  "&::backdrop": {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
}));

export default function DialogNative() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const theme = useTheme();

  const openDialogNative = () => {
    dialogRef.current?.showModal();
  };

  const closeDialogNative = () => {
    dialogRef.current?.close();
  };

  return (
    <>
      <Box sx={{ backgroundColor: theme.palette.primary.main, padding: 2 }}>
        <Button
          variant="contained"
          onClick={openDialogNative}
          color="secondary"
          sx={{ color: theme.palette.text.primary, width: "100%" }}
        >
          Open Dialog
        </Button>
      </Box>

      <StyledDialog
        ref={dialogRef}
        onClick={(event) => {
          if (event.target === dialogRef.current) {
            closeDialogNative();
          }
        }}
        style={{
          position: "fixed",
        }}
      >
        <Box
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.text.primary,
            padding: 2,
            border: "none",
          }}
        >
          <Stack spacing={2}>
            <Panel />
            <Button
              variant="contained"
              onClick={closeDialogNative}
              color="secondary"
              sx={{ color: theme.palette.text.primary }}
            >
              Close
            </Button>
          </Stack>
        </Box>
      </StyledDialog>
    </>
  );
}
