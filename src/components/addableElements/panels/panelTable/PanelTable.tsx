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
  IconButton,
  SelectChangeEvent,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';

export default function PanelTable() {
  const theme = useTheme();

  const initialOptions = [
    { name: 'Alpha', value: '100' },
    { name: 'Beta', value: '200' },
    { name: 'Gamma', value: '300' },
    { name: 'Delta', value: '400' },
  ];

  const initialRows = [
    { id: 1, name: 'Alpha', value: '100' },
    { id: 2, name: 'Beta', value: '200' },
    { id: 3, name: 'Gamma', value: '300' },
  ];

  const [tableRows, setTableRows] = useState(initialRows);
  const [nextRowId, setNextRowId] = useState(4);
  const [selectedOption, setSelectedOption] = useState(initialOptions[0]);

  function updateRowValue(rowIndex: number, fieldName: string, newValue: string) {
    const updatedRows = [...tableRows];
    const targetRow = updatedRows[rowIndex];
    if (fieldName === 'name') {
      targetRow.name = newValue;
    } else if (fieldName === 'value') {
      targetRow.value = newValue;
    }
    setTableRows(updatedRows);
  }

  function addSelectedOptionToTable() {
    const newRow = {
      id: nextRowId,
      name: selectedOption.name,
      value: selectedOption.value,
    };
    setTableRows([...tableRows, newRow]);
    setNextRowId(nextRowId + 1);
  }

  function removeRowById(rowIdToRemove: number) {
    const remainingRows = tableRows.filter((row) => row.id !== rowIdToRemove);
    setTableRows(remainingRows);
  }

  function updateSelectedOption(event: SelectChangeEvent<string>) {
    const selectedName = event.target.value;
    const matchingOption = initialOptions.find((option) => option.name === selectedName);
    if (matchingOption) {
      setSelectedOption(matchingOption);
    }
  }

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
        <Select<string>
          value={selectedOption.name}
          onChange={updateSelectedOption}
          variant="outlined"
          size="small"
          sx={{
            minWidth: 120,
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
          }}
        >
          {initialOptions.map((option) => {
            return (
              <MenuItem key={option.name} value={option.name}>
                {option.name}
              </MenuItem>
            );
          })}
        </Select>
        <Button
          variant="contained"
          onClick={addSelectedOptionToTable}
          color="secondary"
          sx={{ color: theme.palette.text.primary }}
        >
          Add
        </Button>
      </Stack>

      <TableContainer
        component={Paper}
        sx={{
          backgroundColor: theme.palette.secondary.main,
          color: theme.palette.text.primary,
          maxWidth: 400,
          minWidth: 400,
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: theme.palette.text.primary }}>ID</TableCell>
              <TableCell sx={{ color: theme.palette.text.primary }}>Name</TableCell>
              <TableCell sx={{ color: theme.palette.text.primary }}>Value</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {tableRows.map((row, rowIndex) => {
              return (
                <TableRow key={row.id}>
                  <TableCell sx={{ color: theme.palette.text.primary }}>{row.id}</TableCell>
                  <TableCell>
                    <TextField
                      variant="standard"
                      value={row.name}
                      onChange={function handleNameChange(event) {
                        updateRowValue(rowIndex, 'name', event.target.value);
                      }}
                      sx={{ input: { color: theme.palette.text.primary } }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      variant="standard"
                      value={row.value}
                      onChange={function handleValueChange(event) {
                        updateRowValue(rowIndex, 'value', event.target.value);
                      }}
                      sx={{ input: { color: theme.palette.text.primary } }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={function handleDeleteClick() {
                        removeRowById(row.id);
                      }}
                      sx={{ color: theme.palette.text.primary }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
