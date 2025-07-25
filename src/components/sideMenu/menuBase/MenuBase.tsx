import * as React from "react";
import MuiAccordion, { AccordionProps } from "@mui/material/Accordion";
import { styled } from "@mui/material/styles";
import { ComponentType } from 'react';
import SectionHeader from "../sectionHeader/SectionHeader";
import AccordionDetails from "@mui/material/AccordionDetails";
import List from "@mui/material/List";

interface MenuBaseProps {
  menuName: string;
  menuComponent: ComponentType<any>;
  expanded: string | false;
  setExpanded: React.Dispatch<React.SetStateAction<string | false>>;
}


const Accordion = styled((props: AccordionProps) => (
    <MuiAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
    border: `1px solid ${theme.palette.divider}`,
    "&:not(:last-child)": {
        borderBottom: 0,
    },
    "&::before": {
        display: "none",
    },
}));

const listStyle = {
    py: 0,
    width: "100%",
};

export default function MenuBase({ menuName, menuComponent, expanded, setExpanded }: MenuBaseProps) {
  const MenuComponent = menuComponent;

  const handleChange =
    (panel: string) =>
    (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  return (
    <div>
      <Accordion
        expanded={expanded === menuName}
        onChange={handleChange(menuName)}
      >
        <SectionHeader sectionName={menuName} />
        <AccordionDetails
        sx={{
            backgroundColor: theme => theme.palette.background.default,
        }}
        >
        <List sx={listStyle}>
            <MenuComponent />
        </List>
        </AccordionDetails>

      </Accordion>
    </div>
  );
}
