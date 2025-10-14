"use client";

import {
  useEffect,
  useCallback,
  useSyncExternalStore,
  useState,
  JSX,
} from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import SyncIcon from "@mui/icons-material/Sync";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import LockOutlineIcon from "@mui/icons-material/LockOutline";
import { setLocked } from "@/components/contexts/FrameManager/framePersistence";

type SyncState = "idle" | "syncing" | "error";
type StoreSubscriber = () => void;

class SyncStatusStore {
  private currentState: SyncState = "idle";
  private subscribers = new Set<StoreSubscriber>();
  subscribe(subscriber: StoreSubscriber): () => void {
    this.subscribers.add(subscriber);
    return () => this.subscribers.delete(subscriber);
  }
  getSnapshot(): SyncState {
    return this.currentState;
  }
  setState(nextState: SyncState): void {
    if (this.currentState === nextState) return;
    this.currentState = nextState;
    for (const notify of this.subscribers) notify();
  }
}
let __setLockUI: ((next: boolean) => void) | null = null;
export function setLockIndicator(next: boolean) {
  __setLockUI?.(next);
}

const syncStatusStore = new SyncStatusStore();

export function notifySyncStart(): void {
  syncStatusStore.setState("syncing");
}
export function notifySyncSuccess(): void {
  syncStatusStore.setState("idle");
}
export function notifySyncError(): void {
  syncStatusStore.setState("error");
}

export default function SyncStatusWidget(): JSX.Element {
  const subscribe = useCallback(
    (onStoreChange: () => void) => syncStatusStore.subscribe(onStoreChange),
    [],
  );
  const getSnapshot = useCallback(() => syncStatusStore.getSnapshot(), []);
  const syncState = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const [isLocked, setIsLocked] = useState(false);

  const handleToggleLock = useCallback(async () => {
    const next = !isLocked;
    await setLocked(next);
    setIsLocked(next);
  }, [isLocked]);

  const statusIcon =
    syncState === "syncing" ? (
      <SyncIcon sx={{ animation: "spin 1s linear infinite" }} />
    ) : syncState === "error" ? (
      <CancelIcon />
    ) : (
      <CheckCircleIcon />
    );

  const statusText =
    syncState === "syncing"
      ? "syncing"
      : syncState === "error"
        ? "unable to sync"
        : "synced";

  const lockIcon = isLocked ? <LockOutlineIcon /> : <LockOpenIcon />;
  const lockText = isLocked ? "locked" : "unlocked";

  useEffect(() => {
    __setLockUI = setIsLocked;
    return () => {
      if (__setLockUI === setIsLocked) __setLockUI = null;
    };
  }, [setIsLocked]);

  return (
    <Box
      sx={{
        position: "fixed",
        left: 16,
        bottom: 16,
        zIndex: 2000,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        gap: 1.25,
        p: 1.5,
        borderRadius: 2,
        boxShadow: 3,
        bgcolor: (theme) => theme.palette.background.paper,
        color: (theme) => theme.palette.text.primary,
        textAlign: "left",
        "& @keyframes spin": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
      }}
    >
      <Tooltip
        title={
          "Unlocked: Changes will be saved to database\nLocked: Changes will NOT be saved to database"
        }
        followCursor
        placement="right"
        arrow
        slotProps={{ tooltip: { sx: { whiteSpace: "pre-line" } } }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            gap: 1,
            color: "inherit",
          }}
          aria-label="lock-status"
        >
          <IconButton
            aria-label={isLocked ? "unlock" : "lock"}
            size="small"
            onClick={handleToggleLock}
            color="inherit"
            sx={{ color: "inherit", p: 0 }}
          >
            {lockIcon}
          </IconButton>
          <Typography variant="body2" sx={{ color: "inherit" }}>
            {lockText}
          </Typography>
        </Box>
      </Tooltip>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: 1,
          color: "inherit",
        }}
        aria-label="sync-status"
      >
        <Box sx={{ display: "inline-flex", color: "inherit" }}>
          {statusIcon}
        </Box>
        <Typography variant="body2" sx={{ color: "inherit" }}>
          {statusText}
        </Typography>
      </Box>
    </Box>
  );
}
