"use client";

import React from "react";
import {
  Button,
  Stack,
  TextField,
  FormControlLabel,
  Radio,
  FormControl,
  RadioGroup,
  FormHelperText,
  InputAdornment,
  Tooltip,
  Switch,
  Divider,
} from "@mui/material";
import { setSnippetProperties, getSnippetProperties} from "@/components/contexts/FrameManager/framePersistence";
import { CreateIdentifierType, SnippetProperties, UUIDType } from "@/components/contexts/FrameManager/frameUtils";
import { useFrame } from "@/components/contexts/FrameManager/FrameManager";


export default function SnippetMenu() {

  const [systemGuid, setSystemGuid] = React.useState("");
  const [environmentPathName, setEnvironmentPathName] = React.useState("success");
  const [cdnDomain, setCdnDomain] = React.useState("cdn.walkme.com");
  const [loadInCdIframes, setLoadInCdIframes] = React.useState(true);

  const [uuidType, setUuidType] = React.useState<UUIDType>(UUIDType.Default);
  const [createIdentifierType, setCreateIdentifierType] = React.useState<CreateIdentifierType>(CreateIdentifierType.None);
  const [createIdentiferName, setCreateIdentiferName] = React.useState("");
  const [createIdentiferValue, setCreateIdentiferValue] = React.useState("");
  const [createIdentiferDelayMs, setCreateIdentiferDelayMs] = React.useState("0");
    const {

      receivedFirebaseResponse

      
    } = useFrame();

  React.useEffect(() => {
    const existingProperties = getSnippetProperties() as SnippetProperties | undefined;
    if (!existingProperties) return;

    setSystemGuid(existingProperties.systemGuid ?? "");
    setEnvironmentPathName(existingProperties.environmentPathName ?? "");
    setCdnDomain(existingProperties.cdnDomain ?? "");
    setLoadInCdIframes(Boolean(existingProperties.loadInCdIframes));
    setUuidType(existingProperties.uuid ?? UUIDType.Default);
    setCreateIdentifierType(existingProperties.createIdentifier?.type ?? "");
    setCreateIdentiferName(existingProperties.createIdentifier?.name ?? "");
    setCreateIdentiferValue(existingProperties.createIdentifier?.value ?? "");
    setCreateIdentiferDelayMs(
      typeof existingProperties.createIdentifier?.delayMs === "number" && Number.isFinite(existingProperties.createIdentifier.delayMs)
        ? String(existingProperties.createIdentifier.delayMs)
        : "0"
    );
  }, [receivedFirebaseResponse]);

  const dynamicLabel =
    createIdentifierType === CreateIdentifierType.Variable ? "Variable name" : createIdentifierType === CreateIdentifierType.Cookie ? "Cookie name" : "Name";

  const identiferWillNotBeCreated = createIdentifierType === CreateIdentifierType.None;

  const handleApply = () => {
    const parsedDelay = Number(createIdentiferDelayMs);
    const payload: SnippetProperties = {
      systemGuid,
      environmentPathName,
      cdnDomain,
      loadInCdIframes,
      uuid: uuidType,
      createIdentifier: {
        type: createIdentifierType,
        name: createIdentiferName,
        value: createIdentiferValue,
        delayMs: parsedDelay
      }
    };

    setSnippetProperties(payload);
    window.location.reload();
    
  };

  return (
    <Stack spacing={1}>
      <TextField
        variant="standard"
        label="System GUID"
        slotProps={{ inputLabel: { shrink: true } }}
        value={systemGuid}
        onChange={(textFieldChangeEvent: React.ChangeEvent<HTMLInputElement>) =>
          setSystemGuid(textFieldChangeEvent.target.value)
        }
      />
      <TextField
        variant="standard"
        label="Environment path name (leave empty for production)"
        slotProps={{ inputLabel: { shrink: true } }}
        value={environmentPathName}
        onChange={(textFieldChangeEvent: React.ChangeEvent<HTMLInputElement>) =>
          setEnvironmentPathName(textFieldChangeEvent.target.value)
        }
      />
      <TextField
        variant="standard"
        label="CDN domain"
        slotProps={{ inputLabel: { shrink: true } }}
        value={cdnDomain}
        onChange={(textFieldChangeEvent: React.ChangeEvent<HTMLInputElement>) =>
          setCdnDomain(textFieldChangeEvent.target.value)
        }
      />
      <FormControlLabel
        control={
          <Switch
            checked={loadInCdIframes}
            onChange={(_switchChangeEvent, isChecked) => setLoadInCdIframes(isChecked)}
          />
        }
        label="Load in CD iframes and popup windows"
        sx={{ margin: 0 }}
      />
      <FormControl size="small" fullWidth>
        <FormHelperText sx={{ margin: 0 }}>UUID</FormHelperText>
        <RadioGroup
          value={uuidType}
          onChange={(radioChangeEvent: React.ChangeEvent<HTMLInputElement>) =>
            setUuidType(radioChangeEvent.target.value as UUIDType)
          }
        >
          <FormControlLabel value={UUIDType.Default} control={<Radio />} label="Default" />
          <Tooltip
            followCursor
            placement="top"
            arrow
            title={
              <>
                Loads immediately.
                <br />
                Ignores name, value, and delay.
              </>
            }
          >
            <FormControlLabel value={UUIDType.ForceLoad} control={<Radio />} label="Force load WMID" />
          </Tooltip>
          </RadioGroup>
        <FormHelperText sx={{ margin: 0 }}>Create identifier on page load</FormHelperText>
        <RadioGroup
          value={createIdentifierType}
          onChange={(radioChangeEvent: React.ChangeEvent<HTMLInputElement>) =>
            setCreateIdentifierType(radioChangeEvent.target.value as CreateIdentifierType)
          }
        >
         
          <FormControlLabel value={CreateIdentifierType.None} control={<Radio />} label="None" />
          <FormControlLabel value={CreateIdentifierType.Variable} control={<Radio />} label="Create variable" />
          <FormControlLabel value={CreateIdentifierType.Cookie} control={<Radio />} label="Create cookie" />
        </RadioGroup>
      </FormControl>
      <TextField
        variant="standard"
        slotProps={{ inputLabel: { shrink: true } }}
        label={dynamicLabel}
        fullWidth
        disabled={identiferWillNotBeCreated}
        value={createIdentiferName}
        onChange={(textFieldChangeEvent: React.ChangeEvent<HTMLInputElement>) =>
          setCreateIdentiferName(textFieldChangeEvent.target.value)
        }
      />
      <TextField
        variant="standard"
        label="Value"
        slotProps={{ inputLabel: { shrink: true } }}
        disabled={identiferWillNotBeCreated}
        value={createIdentiferValue}
        onChange={(textFieldChangeEvent: React.ChangeEvent<HTMLInputElement>) =>
          setCreateIdentiferValue(textFieldChangeEvent.target.value)
        }
      />
      <TextField
        variant="standard"
        label="Delay UUID on document load"
        slotProps={{
          inputLabel: { shrink: true },
          input: { endAdornment: <InputAdornment position="end">ms</InputAdornment>, inputMode: "numeric" },
        }}
        disabled={identiferWillNotBeCreated}
        value={createIdentiferDelayMs}
        onChange={(textFieldChangeEvent: React.ChangeEvent<HTMLInputElement>) =>
          setCreateIdentiferDelayMs(textFieldChangeEvent.target.value)
        }
      />
      <Button variant="contained" color="secondary" fullWidth onClick={handleApply}>
        Apply
      </Button>
    </Stack>
  );
}
