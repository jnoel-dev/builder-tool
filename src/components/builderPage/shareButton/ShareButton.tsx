'use client';

import React, { useState, useCallback } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Link, Typography } from '@mui/material';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { firestoreDatabase } from '@/components/contexts/FrameManager/firebaseConfig';
import { SAME_ORIGIN_TARGET } from '@/components/contexts/FrameManager/framePersistence';
import { useTheme } from '@mui/material/styles';
import LinkIcon from '@mui/icons-material/Link';

type ShareButtonProps = {
  buttonText?: string;
};

export default function ShareButton({ buttonText = 'Share' }: ShareButtonProps) {
  const theme = useTheme();
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const openDialog = useCallback(() => setIsDialogOpen(true), []);
  const closeDialog = useCallback(() => {
    setIsDialogOpen(false);
    setCopied(false);
  }, []);

  const handleShareClick = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const stateJson = sessionStorage.getItem('SB_STATE') ?? '';
      const docRef = await addDoc(collection(firestoreDatabase, 'sbStates'), {
        stateJson,
        createdAt: serverTimestamp(),
      });
      const urlObject = new URL(`${docRef.id}`, SAME_ORIGIN_TARGET);
      setShareUrl(urlObject.toString());
      openDialog();
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
      <Button
        variant="contained"
        size="large"
        onClick={handleShareClick}
        disabled={isSaving}
        startIcon={
          isSaving ? (
            <CircularProgress size={20} sx={{ display: 'block' }} />
          ) : (
            <LinkIcon fontSize="medium" />
          )
        }
        sx={{
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          position: 'fixed',
          left: 16,
          bottom: 16,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1.75,
          minHeight: 48,
        }}
      >
        {buttonText}
      </Button>

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
          {shareUrl ? (
            <Typography>
              <Link href={shareUrl} target="_blank" rel="noopener noreferrer" color="inherit">
                {shareUrl}
              </Link>
            </Typography>
          ) : (
            <Typography>No link available.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCopyClick} disabled={!shareUrl}>{copied ? 'Copied' : 'Copy'}</Button>
          <Button onClick={closeDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
