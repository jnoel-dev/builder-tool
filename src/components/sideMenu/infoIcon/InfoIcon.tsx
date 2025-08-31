"use client";

import React from "react";
import Tooltip, { TooltipProps, tooltipClasses } from '@mui/material/Tooltip';
import IconButton from "@mui/material/IconButton";
import InfoIcon from "@mui/icons-material/Info";
import {  styled, useTheme } from "@mui/material";
import Typography from "@mui/material/Typography";



interface InfoIconProps {
  infoText: React.ReactNode;
}



export default function InfoIconWithTooltip({ infoText }: InfoIconProps) {

  const HtmlTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.background.default,
    fontSize: theme.typography.pxToRem(12),
  },
}));
 
  return (
    <HtmlTooltip placement="top" title={
          <React.Fragment>
            <Typography sx={{ whiteSpace: 'pre-line' }}>{infoText}</Typography>
          </React.Fragment>
        } slotProps={{
        popper: {
          modifiers: [
            {
              name: 'offset',
              options: {
                offset: [0, -14],
              },
            },
          ],
        },
      }}>
      <IconButton size="medium" disableRipple={true}>
        <InfoIcon fontSize="inherit" />
      </IconButton>
    </HtmlTooltip>
  );
}
