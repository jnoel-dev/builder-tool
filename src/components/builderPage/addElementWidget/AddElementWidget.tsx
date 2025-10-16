"use client";

import { useEffect, useRef, useState } from "react";
import Fab from "@mui/material/Fab";
import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import Popper from "@mui/material/Popper";
import Paper from "@mui/material/Paper";
import SideMenu from "@/components/sideMenu/SideMenu";

let externalSetDisabled: ((disabled: boolean) => void) | null = null;
export function setFabDisabled(disabled: boolean): void {
  if (externalSetDisabled) externalSetDisabled(disabled);
}

export default function AddElementWidget() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [fabDisabled, setFabDisabledState] = useState(false);
  const fabRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    externalSetDisabled = (disabled: boolean) => {
      setFabDisabledState(disabled);
      if (disabled) setDrawerOpen(false);
    };
    return () => {
      externalSetDisabled = null;
    };
  }, []);

  function handleToggleDrawer(): void {
    setDrawerOpen((previous) => !previous);
  }

  return (
    <>
      <Box sx={{ position: "fixed", bottom: 16, right: 16, zIndex: 9999 }}>
        <Fab
          ref={fabRef}
          sx={(theme) => ({
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            "&:hover": { backgroundColor: theme.palette.background.paper },
          })}
          onClick={handleToggleDrawer}
          disabled={fabDisabled}
        >
          <AddIcon
            sx={{
              transition: "transform 150ms ease-in-out",
              transform: drawerOpen ? "rotate(45deg)" : "rotate(0deg)",
            }}
          />
        </Fab>
      </Box>

      <Popper
        open={drawerOpen}
        keepMounted
        anchorEl={fabRef.current}
        placement="top-end"
        modifiers={[
          { name: "offset", options: { offset: [0, 12] } },
          {
            name: "preventOverflow",
            options: { padding: 8, altBoundary: true },
          },
        ]}
      >
        <Paper
          elevation={8}
          sx={{
            width: 480,
            maxWidth: "90vw",
            maxHeight: "80vh",
            overflowY: "auto",
          }}
        >
          <SideMenu />
        </Paper>
      </Popper>
    </>
  );
}
