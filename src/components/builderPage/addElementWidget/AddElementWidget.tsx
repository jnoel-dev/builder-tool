"use client";

import { useEffect, useState } from "react";
import Fab from "@mui/material/Fab";
import AddIcon from "@mui/icons-material/Add";
import Drawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import Portal from "@mui/material/Portal";
import SideMenu from "@/components/sideMenu/SideMenu";

let externalSetDisabled: ((disabled: boolean) => void) | null = null;
export function setFabDisabled(disabled: boolean): void {
  if (externalSetDisabled) externalSetDisabled(disabled);
}

export default function AddElementWidget() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [fabDisabled, setFabDisabledState] = useState(false);

  useEffect(() => {
    externalSetDisabled = (disabled: boolean) => {
      setFabDisabledState(disabled);
      if (disabled) setDrawerOpen(false);
    };
    return () => {
      externalSetDisabled = null;
    };
  }, []);

  const handleToggleDrawer = (): void => {
    setDrawerOpen((previous) => !previous);
  };

  const handleCloseDrawer = (): void => {
    setDrawerOpen(false);
  };

  return (
    <>
      <Portal>
        <Box sx={{ position: "fixed", bottom: 16, right: 16, zIndex: 9999 }}>
          <Fab
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
      </Portal>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleCloseDrawer}
        hideBackdrop
        disableAutoFocus
        disableEnforceFocus
        disableRestoreFocus
        transitionDuration={{ enter: 100, exit: 100 }}
        keepMounted={true}
        slotProps={{
          root: { sx: { pointerEvents: "none" } },
          paper: {
            sx: {
              pointerEvents: "auto",
              backgroundColor: "transparent",
              backgroundImage: "none",
              boxShadow: "none",
              "--Paper-overlay": "none",
            },
          },
        }}
      >
        <Box sx={{ width: "480px" }}>
          <SideMenu />
        </Box>
      </Drawer>
    </>
  );
}
