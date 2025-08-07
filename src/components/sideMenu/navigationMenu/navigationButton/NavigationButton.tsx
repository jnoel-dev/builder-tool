"use client";

import React from "react";
import Button from "@mui/material/Button";
import { NavigationType } from "../NavigationTypes";

export interface NavigationButtonProps {
  destinationPage: string;       
  navigationType: NavigationType; 
}

export default function NavigationButton({
  destinationPage,
  navigationType,
}: NavigationButtonProps) {
const handleClick = () => {
  sessionStorage.setItem("lastSavedUrl", window.location.href);
  if (navigationType === NavigationType.Full) {
    const protocol =
      process.env.NODE_ENV === "development" ? "http://" : "https://";

    const existingParams = window.location.search;
    const hash = window.location.hash;
    const destinationUrl = `${protocol}${destinationPage}${existingParams}${hash}`;
    

    window.location.href = destinationUrl;
  }
  sessionStorage.setItem("landedUrl", window.location.href);
};


  return (
    <Button variant="contained" onClick={handleClick}>
      {navigationType} navigation to {destinationPage}
    </Button>
  );
}
