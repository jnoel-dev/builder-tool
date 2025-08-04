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
} from "@mui/material";

export default function NavigationMenu() {
  const [pages, setPages] = React.useState<string[]>(["Home Page"]);
  const [selectedPage, setSelectedPage] = React.useState("Home Page");
  const [navigationType, setNavigationType] = React.useState("full");

  function handlePageChange(event: SelectChangeEvent) {
    setSelectedPage(event.target.value);
  }

  function handleTypeChange(event: React.ChangeEvent<HTMLInputElement>) {
    setNavigationType(event.target.value);
  }

function handleAddNewPage() {
  const nonHomePages = pages.filter((p) => p !== "Home Page");
  const newPageNumber = nonHomePages.length + 1;
  const newPageName = `Page ${newPageNumber}`;
  setPages((prev) => [...prev, newPageName]);
  // to be implemented
}


  function handleAddNavigationButton() {
    // to be implemented
  }

  return (
    <div>
      <Box sx={{ width: "100%", marginBottom: 2 }}>
        <FormHelperText sx={{ marginX: 0, marginBottom: 1 }}>
          Pages
        </FormHelperText>

        <List dense disablePadding>
          {pages.map((page, index) => (
            <ListItem key={page} sx={{ paddingX: 1, paddingY: 0.5 }}>
              <Typography
                variant="body2"
                sx={{
                  color: "text.primary",
                  display: "flex",
                  alignItems: "center",
                  fontWeight: 400,
                }}
              >
                <Box component="span" sx={{ minWidth: 24 }}>
                  {index + 1}.
                </Box>
                {page}
              </Typography>
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
            {pages.map((page) => (
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
