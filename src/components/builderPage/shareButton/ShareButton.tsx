"use client";

import React, { useState, useCallback } from "react";
import {
  Fab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Link,
  Typography,
} from "@mui/material";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { firestoreDatabase } from "@/components/contexts/FrameManager/firebaseConfig";
import { SAME_ORIGIN_TARGET } from "@/components/contexts/FrameManager/framePersistence";
import { useTheme } from "@mui/material/styles";
import LinkIcon from "@mui/icons-material/Link";

type ShareButtonProps = {
  buttonText?: string;
};

export default function ShareButton({}: ShareButtonProps) {
  const theme = useTheme();
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const openDialog = useCallback(() => setIsDialogOpen(true), []);
  const closeDialog = useCallback(() => {
    setIsDialogOpen(false);
    setCopied(false);
  }, []);

  const handleShareClick = useCallback(async () => {
    if (isSaving) return;
    setCopied(false);
    setShareUrl("");
    openDialog();
    setIsSaving(true);
    try {
      const stateJson = sessionStorage.getItem("SB_STATE") ?? "";
      console.log("ADD FIREBASE");
      const documentReference = await addDoc(
        collection(firestoreDatabase, "sbStates"),
        {
          stateJson,
          createdAt: serverTimestamp(),
        },
      );

      const urlObject = new URL(`${documentReference.id}`, SAME_ORIGIN_TARGET);

      setShareUrl(urlObject.toString());
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, openDialog]);

  const handleCopyClick = useCallback(async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    } catch {}
  }, [shareUrl]);

  return (
    <>
      <Fab
        onClick={handleShareClick}
        disabled={isSaving}
        aria-label="Share link"
        sx={{
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          position: "fixed",
          left: 16,
          bottom: 16,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 1.75,
          minHeight: 48,
        }}
      >
        <LinkIcon fontSize="medium" />
      </Fab>

      <Dialog
        open={isDialogOpen}
        onClose={closeDialog}
        slotProps={{
          paper: {
            sx: {
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
            },
          },
        }}
      >
        <DialogTitle>Share Link</DialogTitle>
        <DialogContent>
          {isSaving ? (
            <CircularProgress size={24} sx={{ display: "block" }} />
          ) : shareUrl ? (
            <Typography>
              <Link
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                color="inherit"
              >
                {shareUrl}
              </Link>
            </Typography>
          ) : (
            <Typography>No link available.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          {!isSaving && shareUrl ? (
            <Button onClick={handleCopyClick}>
              {copied ? "Copied" : "Copy"}
            </Button>
          ) : null}
          <Button onClick={closeDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
