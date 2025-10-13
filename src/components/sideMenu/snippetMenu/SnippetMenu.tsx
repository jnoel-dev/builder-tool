"use client";

import { useEffect, useState, ChangeEvent } from "react";
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
  Switch,
} from "@mui/material";
import {
  setSnippetProperties,
  getSnippetProperties,
} from "@/components/contexts/FrameManager/framePersistence";
import {
  CreateIdentifierType,
  SnippetProperties,
  UUIDType,
} from "@/components/contexts/FrameManager/frameUtils";
import { useFrame } from "@/components/contexts/FrameManager/FrameManager";

export default function SnippetMenu() {
  const [systemGuid, setSystemGuid] = useState("");
  const [environmentPathName, setEnvironmentPathName] = useState("success");
  const [cdnDomain, setCdnDomain] = useState("cdn.walkme.com");
  const [loadInCdIframes, setLoadInCdIframes] = useState(true);

  const [uuidType, setUuidType] = useState<UUIDType>(UUIDType.Default);
  const [createIdentifierType, setCreateIdentifierType] =
    useState<CreateIdentifierType>(CreateIdentifierType.None);
  const [createIdentiferName, setCreateIdentiferName] = useState("");
  const [createIdentiferValue, setCreateIdentiferValue] = useState("");
  const [createIdentiferDelayMs, setCreateIdentiferDelayMs] = useState("0");
  const { receivedFirebaseResponse } = useFrame();

  useEffect(() => {
    const existingProperties = getSnippetProperties() as
      | SnippetProperties
      | undefined;
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
      typeof existingProperties.createIdentifier?.delayMs === "number" &&
        Number.isFinite(existingProperties.createIdentifier.delayMs)
        ? String(existingProperties.createIdentifier.delayMs)
        : "0",
    );
  }, [receivedFirebaseResponse]);

  const dynamicLabel =
    createIdentifierType === CreateIdentifierType.Variable
      ? "Variable name"
      : createIdentifierType === CreateIdentifierType.Cookie
        ? "Cookie name"
        : "Name";

  const identiferWillNotBeCreated =
    createIdentifierType === CreateIdentifierType.None;

  const handleApply = async () => {
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
        delayMs: parsedDelay,
      },
    };

    await setSnippetProperties(payload);
    window.location.reload();
  };

  return (
    <Stack spacing={1}>
      <TextField
        variant="standard"
        label="System GUID"
        slotProps={{ inputLabel: { shrink: true } }}
        value={systemGuid}
        onChange={(textFieldChangeEvent: ChangeEvent<HTMLInputElement>) =>
          setSystemGuid(textFieldChangeEvent.target.value)
        }
      />
      <TextField
        variant="standard"
        label="Environment path name (leave empty for production)"
        slotProps={{ inputLabel: { shrink: true } }}
        value={environmentPathName}
        onChange={(textFieldChangeEvent: ChangeEvent<HTMLInputElement>) =>
          setEnvironmentPathName(textFieldChangeEvent.target.value)
        }
      />
      <TextField
        variant="standard"
        label="CDN domain"
        slotProps={{ inputLabel: { shrink: true } }}
        value={cdnDomain}
        onChange={(textFieldChangeEvent: ChangeEvent<HTMLInputElement>) =>
          setCdnDomain(textFieldChangeEvent.target.value)
        }
      />
      <FormControlLabel
        control={
          <Switch
            checked={loadInCdIframes}
            onChange={(_switchChangeEvent, isChecked) =>
              setLoadInCdIframes(isChecked)
            }
          />
        }
        label="Load in CD iframes and popup windows"
        sx={{ margin: 0 }}
      />
      <FormControl size="small" fullWidth>
        <FormHelperText sx={{ margin: 0 }}>UUID</FormHelperText>
        <RadioGroup
          value={uuidType}
          onChange={(radioChangeEvent: ChangeEvent<HTMLInputElement>) =>
            setUuidType(radioChangeEvent.target.value as UUIDType)
          }
        >
          <FormControlLabel
            value={UUIDType.Default}
            control={<Radio />}
            label="Default"
          />

          <FormControlLabel
            value={UUIDType.ForceLoad}
            control={<Radio />}
            label="Force load WMID (bypass IDP, waitfor, server storage)"
          />
        </RadioGroup>
        <FormHelperText sx={{ margin: 0 }}>
          Create identifier on page load including all iframes and popup windows
        </FormHelperText>
        <RadioGroup
          value={createIdentifierType}
          onChange={(radioChangeEvent: ChangeEvent<HTMLInputElement>) =>
            setCreateIdentifierType(
              radioChangeEvent.target.value as CreateIdentifierType,
            )
          }
        >
          <FormControlLabel
            value={CreateIdentifierType.None}
            control={<Radio />}
            label="None"
          />
          <FormControlLabel
            value={CreateIdentifierType.Variable}
            control={<Radio />}
            label="Create variable"
          />
          <FormControlLabel
            value={CreateIdentifierType.Cookie}
            control={<Radio />}
            label="Create cookie"
          />
        </RadioGroup>
      </FormControl>
      <TextField
        variant="standard"
        slotProps={{ inputLabel: { shrink: true } }}
        label={dynamicLabel}
        fullWidth
        disabled={identiferWillNotBeCreated}
        value={createIdentiferName}
        onChange={(textFieldChangeEvent: ChangeEvent<HTMLInputElement>) =>
          setCreateIdentiferName(textFieldChangeEvent.target.value)
        }
      />
      <TextField
        variant="standard"
        label="Value"
        slotProps={{ inputLabel: { shrink: true } }}
        disabled={identiferWillNotBeCreated}
        value={createIdentiferValue}
        onChange={(textFieldChangeEvent: ChangeEvent<HTMLInputElement>) =>
          setCreateIdentiferValue(textFieldChangeEvent.target.value)
        }
      />
      <TextField
        variant="standard"
        label="Delay UUID on document load"
        slotProps={{
          inputLabel: { shrink: true },
          input: {
            endAdornment: <InputAdornment position="end">ms</InputAdornment>,
            inputMode: "numeric",
          },
        }}
        disabled={identiferWillNotBeCreated}
        value={createIdentiferDelayMs}
        onChange={(textFieldChangeEvent: ChangeEvent<HTMLInputElement>) =>
          setCreateIdentiferDelayMs(textFieldChangeEvent.target.value)
        }
      />
      <Button
        variant="contained"
        color="secondary"
        fullWidth
        onClick={handleApply}
      >
        Apply
      </Button>
    </Stack>
  );
}

//90da529e8e564e66924b8617e100c36e
