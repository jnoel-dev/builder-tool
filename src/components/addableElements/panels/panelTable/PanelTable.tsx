'use client';

import React, { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Select,
  MenuItem,
  Button,
  Stack,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

export default function PanelTable() {
  const theme = useTheme();

  const availableItems = [
    { name: 'Alpha', value: '100' },
    { name: 'Beta', value: '200' },
    { name: 'Gamma', value: '300' },
    { name: 'Delta', value: '400' },
  ];

  const [rows, setRows] = useState<{ id: number; name: string; value: string }[]>([]);
  const [selectedItem, setSelectedItem] = useState(availableItems[0]);

  const handleChange = (index: number, field: string, newValue: string) => {
    const updated = [...rows];
    (updated[index] as any)[field] = newValue;
    setRows(updated);
  };

  const handleAdd = () => {
    setRows((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        name: selectedItem.name,
        value: selectedItem.value,
      },
    ]);
  };

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.primary.main,
        padding: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <Stack direction="row" spacing={2}>
        <Select
          value={selectedItem.name}
          onChange={(e) => {
            const found = availableItems.find((item) => item.name === e.target.value);
            if (found) setSelectedItem(found);
          }}
          variant="outlined"
          size="small"
          sx={{
            minWidth: 120,
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
          }}
        >
          {availableItems.map((item) => (
            <MenuItem key={item.name} value={item.name}>
              {item.name}
            </MenuItem>
          ))}
        </Select>
        <Button
          variant="contained"
          onClick={handleAdd}
          color="secondary"
          sx={{ color: theme.palette.text.primary }}
        >
          Add
        </Button>
      </Stack>

      <TableContainer
        component={Paper}
        sx={{
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          minWidth: 400,
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: theme.palette.text.primary }}>ID</TableCell>
              <TableCell sx={{ color: theme.palette.text.primary }}>Name</TableCell>
              <TableCell sx={{ color: theme.palette.text.primary }}>Value</TableCell>
            </TableRow>
          </TableHead>
            <TableBody>
            {rows.map((row, index) => (
                <TableRow key={row.id}>
                <TableCell sx={{ color: theme.palette.text.primary }}>{row.id}</TableCell>
                <TableCell>
                    <TextField
                    variant="standard"
                    value={row.name}
                    onChange={(e) => handleChange(index, 'name', e.target.value)}
                    sx={{ input: { color: theme.palette.text.primary } }}
                    />
                </TableCell>
                <TableCell>
                    <TextField
                    variant="standard"
                    value={row.value}
                    onChange={(e) => handleChange(index, 'value', e.target.value)}
                    sx={{ input: { color: theme.palette.text.primary } }}
                    />
                </TableCell>
                </TableRow>
            ))}
            </TableBody>

        </Table>
      </TableContainer>
    </Box>
  );
}
