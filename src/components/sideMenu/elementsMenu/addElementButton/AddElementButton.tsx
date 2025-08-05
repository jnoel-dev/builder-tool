import React, { useState } from "react";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import AddIcon from "@mui/icons-material/Add";
import IconButton from "@mui/material/IconButton";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import { useFrame } from "@/components/contexts/FrameManager/FrameManager";

interface AddElementButtonProps {
  displayName: string;
  componentNames?: string[];
  isFrameOrContainer?: boolean;
}

export default function AddElementButton({
  displayName,
  componentNames = [],
  isFrameOrContainer = false,
}: AddElementButtonProps) {
  const { addElementToCurrentFrame } = useFrame();
  const [selectedComponentName, setSelectedComponentName] = useState<string>(
    componentNames[0] || displayName
  );

  function handleAdd(): void {
    if (componentNames.length === 0) {
      addElementToCurrentFrame(displayName, isFrameOrContainer);
    } else {
      addElementToCurrentFrame(selectedComponentName, isFrameOrContainer);
    }
  }

  return (
    <ListItem>
      <Stack direction="row" alignItems="center" width="100%">
        <ListItemText
          primary={displayName}
          sx={{ flex: 1, display: "flex", alignItems: "center" }}
        />
        {componentNames.length > 0 && (
          <RadioGroup
            row
            value={selectedComponentName}
            onChange={event => setSelectedComponentName(event.target.value)}
            sx={{ gap: 1, ml: 2 }}
          >
            {componentNames.map(componentOption => (
              <FormControlLabel
                key={componentOption}
                value={componentOption}
                control={<Radio size="small" sx={{ padding: 0, margin: 0 }} />}
                label={componentOption.replace(displayName, "")}
                sx={{
                  margin: 0,
                  "& .MuiFormControlLabel-label": { marginLeft: 0, lineHeight: 1 },
                }}
              />
            ))}
          </RadioGroup>
        )}
        <IconButton onClick={handleAdd}>
          <AddIcon />
        </IconButton>
      </Stack>
    </ListItem>
  );
}
