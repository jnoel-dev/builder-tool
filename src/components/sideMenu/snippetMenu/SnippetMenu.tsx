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
} from "@mui/material";
import { setSnippetProperties, getSnippetProperties} from "@/components/contexts/FrameManager/framePersistence";
import { SnippetProperties, UUIDType } from "@/components/contexts/FrameManager/frameUtils";
import { useFrame } from "@/components/contexts/FrameManager/FrameManager";


export default function SnippetMenu() {

  const [systemGuid, setSystemGuid] = React.useState("");
  const [environmentPathName, setEnvironmentPathName] = React.useState("success");
  const [cdnDomain, setCdnDomain] = React.useState("cdn.walkme.com");
  const [loadInCdIframes, setLoadInCdIframes] = React.useState(true);

  const [uuidType, setUuidType] = React.useState<UUIDType>(UUIDType.ForceLoad);
  const [uuidName, setUuidName] = React.useState("");
  const [uuidValue, setUuidValue] = React.useState("");
  const [uuidDelayMs, setUuidDelayMs] = React.useState("0");
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
    setUuidType(existingProperties.uuid?.type ?? UUIDType.ForceLoad);
    setUuidName(existingProperties.uuid?.name ?? "");
    setUuidValue(existingProperties.uuid?.value ?? "");
    setUuidDelayMs(
      typeof existingProperties.uuid?.delayMs === "number" && Number.isFinite(existingProperties.uuid.delayMs)
        ? String(existingProperties.uuid.delayMs)
        : "0"
    );
  }, [receivedFirebaseResponse]);

  const dynamicLabel =
    uuidType === UUIDType.Variable ? "Variable name" : uuidType === UUIDType.Cookie ? "Cookie name" : "Name";

  const isForceLoad = uuidType === UUIDType.ForceLoad;

  const handleApply = () => {
    const parsedDelay = Number(uuidDelayMs);
    const payload: SnippetProperties = {
      systemGuid,
      environmentPathName,
      cdnDomain,
      loadInCdIframes,
      uuid: {
        type: uuidType,
        name: isForceLoad ? undefined : uuidName || undefined,
        value: isForceLoad ? undefined : uuidValue || undefined,
        delayMs: isForceLoad ? undefined : Number.isFinite(parsedDelay) ? parsedDelay : undefined,
      },
    };
    setSnippetProperties(payload);
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
          <FormControlLabel value={UUIDType.Variable} control={<Radio />} label="Variable" />
          <FormControlLabel value={UUIDType.Cookie} control={<Radio />} label="Cookie" />
        </RadioGroup>
      </FormControl>
      <TextField
        variant="standard"
        slotProps={{ inputLabel: { shrink: true } }}
        label={dynamicLabel}
        fullWidth
        disabled={isForceLoad}
        value={uuidName}
        onChange={(textFieldChangeEvent: React.ChangeEvent<HTMLInputElement>) =>
          setUuidName(textFieldChangeEvent.target.value)
        }
      />
      <TextField
        variant="standard"
        label="Value"
        slotProps={{ inputLabel: { shrink: true } }}
        disabled={isForceLoad}
        value={uuidValue}
        onChange={(textFieldChangeEvent: React.ChangeEvent<HTMLInputElement>) =>
          setUuidValue(textFieldChangeEvent.target.value)
        }
      />
      <TextField
        variant="standard"
        label="Delay UUID on document load"
        slotProps={{
          inputLabel: { shrink: true },
          input: { endAdornment: <InputAdornment position="end">ms</InputAdornment>, inputMode: "numeric" },
        }}
        disabled={isForceLoad}
        value={uuidDelayMs}
        onChange={(textFieldChangeEvent: React.ChangeEvent<HTMLInputElement>) =>
          setUuidDelayMs(textFieldChangeEvent.target.value)
        }
      />
      <Button variant="contained" color="secondary" fullWidth onClick={handleApply}>
        Apply
      </Button>
    </Stack>
  );
}
