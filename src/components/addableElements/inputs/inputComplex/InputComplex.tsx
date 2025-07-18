import React, { useState, useRef } from 'react';
import { Box, Button, Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export default function EditableInput() {
  const theme = useTheme();
  const editorRef = useRef<HTMLDivElement>(null);
  const [output, setOutput] = useState('');
  const [isEmpty, setIsEmpty] = useState(true);

  const handleInput = () => {
    const content = editorRef.current?.textContent || '';
    setIsEmpty(content.trim() === '');
  };

  const handleShowClick = () => {
    if (editorRef.current) {
      setOutput(editorRef.current.textContent || '');
    }
  };

  return (
    <Box sx={{ padding: 2, backgroundColor: theme.palette.primary.main }}>
      <Stack direction="column" spacing={2} width="226px">
        <Box sx={{ position: 'relative'}}>
          {isEmpty && (
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
                color: theme.palette.text.disabled,
                pointerEvents: 'none',
              }}
            >
              insert text here...
            </Box>
          )}
          <Box
            contentEditable
            suppressContentEditableWarning
            ref={editorRef}
            onInput={handleInput}
            sx={{
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
              padding: '8px',
                
   

            }}
          />
        </Box>
        <Stack direction="row" spacing={2} alignItems="center">
        <Button
          variant="contained"
          color="secondary"
          sx={{ color: theme.palette.text.primary }}
          onClick={handleShowClick}
        >
          show text
        </Button>

        {output && (
          <Box
            sx={{
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
              padding: '8px',
              borderRadius: '4px',
            }}
          >
            {output}
          </Box>
        )}
        </Stack>
      </Stack>
    </Box>
  );
}
