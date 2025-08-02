'use client';

import React, { useEffect, useState } from 'react';
import { Box, Button, Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Panel from '../../panels/panel/Panel';
import { defineComponents } from '@tylertech/forge';
import { ForgeDialog } from '@tylertech/forge-react';

export default function DialogForge() {
  const [isOpen, setIsOpen] = useState(false);
  const theme = useTheme();

  // Register Forge web components only on the client
  useEffect(() => {
    defineComponents();
  }, []);

  const openDialog = () => setIsOpen(true);
  const closeDialog = () => setIsOpen(false);

  return (
    <>
      <Box sx={{ backgroundColor: theme.palette.primary.main, p: 2 }}>
        <Button
          variant="contained"
          onClick={openDialog}
          color="secondary"
          sx={{ color: theme.palette.text.primary }}
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
              onClick={closeDialog}
              color="secondary"
              sx={{ color: theme.palette.text.primary }}
            >
              Close
            </Button>
          </Stack>
        </Box>
      </ForgeDialog>
    </>
  );
}
