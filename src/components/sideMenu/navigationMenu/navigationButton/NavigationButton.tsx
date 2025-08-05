"use client";

import React from "react";
import Button from "@mui/material/Button";

export interface NavigationButtonProps {
  destinationPage: string;
  navigationType: string;
}

export default function NavigationButton({
  destinationPage,
  navigationType
}: NavigationButtonProps) {

  return (
    <Button variant="contained" onClick={() => {}}>
      {navigationType} navigation to {destinationPage}
    </Button>
  );
}
