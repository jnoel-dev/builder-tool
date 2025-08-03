'use client';

import React, { useState, useEffect } from 'react';
import { Box, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Panel from '../../panels/panel/Panel';
import { Dialog } from '@ui5/webcomponents-react';
import '@ui5/webcomponents/dist/Dialog.js';

export default function DialogUI5() {
  const [isOpen, setIsOpen] = useState(false);
  const theme = useTheme();

  const openDialog = () => setIsOpen(true);
  const closeDialog = () => setIsOpen(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleOverlayClick = (event: Event) => {
      
      const targetElement = event.target as HTMLElement;
    
      if (targetElement.tagName === 'UI5-DIALOG') {
        closeDialog();
      }
    };
    document.addEventListener('click', handleOverlayClick);
    return () => document.removeEventListener('click', handleOverlayClick);
  }, [isOpen]);

  return (
    <>
      <Box sx={{ backgroundColor: theme.palette.primary.main, padding: 2 }}>
        <Button
          variant="contained"
          onClick={openDialog}
          color="secondary"
          sx={{ color: theme.palette.text.primary, width:'100%' }}
        >
          Open Dialog
        </Button>
      </Box>

      <Dialog
        open={isOpen}
        onClose={closeDialog}
          style={{
          '--_ui5-v2-12-0_popup_block_layer_opacity': '0.5',
        } as React.CSSProperties}
      >
        <Box
          sx={{
            padding: 2,
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.text.primary,
          }}
        >
          <Panel />
          
            <Button
              variant="contained"
              onClick={closeDialog}
              color="secondary"
              sx={{ color: theme.palette.text.primary, width:'100%'}}
              
            >
              Close
            </Button>
          
        </Box>
      </Dialog>
    </>
  );
}
