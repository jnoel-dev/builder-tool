"use client";

import * as React from "react";
import {
  Box,
  Button,
  Divider,
  FormControl,
  FormHelperText,
  MenuItem,
  Radio,
  RadioGroup,
  FormControlLabel,
  Select,
  SelectChangeEvent,
  Stack,
  Typography,
  List,
  ListItem,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export default function NavigationMenu() {
  const [pages, setPages] = React.useState(["Home Page"]);
  const [selectedPage, setSelectedPage] = React.useState("Home Page");
  const [navigationType, setNavigationType] = React.useState("full");

  function handlePageChange(event: SelectChangeEvent) {
    setSelectedPage(event.target.value);
  }

  function handleTypeChange(event: React.ChangeEvent<HTMLInputElement>) {
    setNavigationType(event.target.value);
  }

  function handleAddNewPage() {
    const baseName = "Page ";
    let i = 1;
    while (pages.includes(`${baseName}${i}`)) i++;
    const newPage = `${baseName}${i}`;
    setPages(prev => [...prev, newPage]);
    setSelectedPage(newPage);
  }

  function handleRemovePage(page: string) {
    setPages(prev => prev.filter(p => p !== page));
    if (selectedPage === page) setSelectedPage("Home Page");
  }

  function handleAddNavigationButton() {
    // to be implemented
  }

  return (
    <div>
      <Box sx={{ width: "100%", marginBottom: 2 }}>
        <FormHelperText sx={{ marginX: 0, marginBottom: 1 }}>Pages</FormHelperText>
        <List dense disablePadding>
          {pages.map((page, index) => (
            <ListItem key={page} sx={{ paddingX: 1, paddingY: 0.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
                <Typography variant="body1" sx={{ flex: 1 }}>
                  <Box component="span" sx={{ minWidth: 24, display: "inline-block" }}>
                    {index + 1}.
                  </Box>{" "}
                  {page}
                </Typography>
                {page !== "Home Page" && (
                  <IconButton
                    size="small"
                    onClick={() => handleRemovePage(page)}
                    sx={{ ml: 1 }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </ListItem>
          ))}
        </List>
      </Box>

      <Button
        variant="contained"
        color="secondary"
        fullWidth
        onClick={handleAddNewPage}
      >
        Add New Page
      </Button>

      <Divider sx={{ marginY: 2 }} />

      <FormControl size="small" sx={{ width: "100%" }}>
        <Stack gap={1}>
          <FormHelperText sx={{ margin: 0 }}>
            Select Destination Page
          </FormHelperText>
          <Select
            value={selectedPage}
            onChange={handlePageChange}
            sx={{ textAlign: "center" }}
          >
            {pages.map(page => (
              <MenuItem key={page} value={page}>
                {page.toUpperCase()}
              </MenuItem>
            ))}
          </Select>

          <FormHelperText sx={{ margin: 0 }}>Navigation Type</FormHelperText>
          <RadioGroup value={navigationType} onChange={handleTypeChange}>
            <FormControlLabel
              value="full"
              control={<Radio />}
              label="Full Page Load"
            />
            <FormControlLabel
              value="spa"
              control={<Radio />}
              label="SPA Navigation"
            />
            <FormControlLabel
              value="spa-redirect"
              control={<Radio />}
              label="SPA with Quick Redirect"
            />
          </RadioGroup>

          <Button
            variant="contained"
            color="secondary"
            fullWidth
            onClick={handleAddNavigationButton}
          >
            Add Navigation Button
          </Button>
        </Stack>
      </FormControl>
    </div>
  );
}
