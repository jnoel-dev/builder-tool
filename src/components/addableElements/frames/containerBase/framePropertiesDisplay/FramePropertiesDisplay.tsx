'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

type FramePropertiesDisplayProps = {
  properties?: Record<string, unknown>;
};

export default function FramePropertiesDisplay({ properties }: FramePropertiesDisplayProps) {
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const [entryKeys, setEntryKeys] = React.useState<string[]>(Object.keys(properties ?? {}));
  const [walkmeTimingText, setWalkmeTimingText] = React.useState<string | null>(null);
  const [walkmeIsReady, setWalkmeIsReady] = React.useState<boolean>(false);
  const [walkmeUserGuid, setWalkmeUserGuid] = React.useState<string | null>(null);
  const [walkmeEnvId, setWalkmeEnvId] = React.useState<string | null>(null);
  const [walkmeViaEditor, setWalkmeViaEditor] = React.useState<boolean>(false);

  const lastSeenGuidRef = React.useRef<string | null>(null);
  const lastSeenEnvIdRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const baseKeys = Object.keys(properties ?? {});
    setEntryKeys((previousKeys) => {
      const shouldKeepWl = previousKeys.includes('WL');
      const merged = shouldKeepWl ? Array.from(new Set(['WL', ...baseKeys])) : baseKeys;
      return merged;
    });
  }, [properties]);

  React.useEffect(() => {
    if (!isMounted) return;

    let intervalId: number | undefined;

    function refreshWalkmeStatus(): void {
      if (typeof window === 'undefined') {
        setWalkmeTimingText(null);
        setWalkmeIsReady(false);
        setWalkmeUserGuid(null);
        setWalkmeEnvId(null);
        lastSeenGuidRef.current = null;
        lastSeenEnvIdRef.current = null;
        return;
      }

      const internals = (window as any)._walkmeInternals;
      const hasTimingList =
        internals &&
        internals.timing &&
        Array.isArray(internals.timing.list) &&
        internals.timing.list.length > 0;

      const hasWmPlaySnippetData = Boolean((window as any).wmPlaySnippetData);

      if (!hasTimingList && !hasWmPlaySnippetData) {
        setWalkmeTimingText(null);
        setWalkmeIsReady(false);
        setWalkmeUserGuid(null);
        setWalkmeEnvId(null);
        setWalkmeViaEditor(false);
        lastSeenGuidRef.current = null;
        lastSeenEnvIdRef.current = null;
        return;
      }

      let isReadyDetected = false;

      if (hasTimingList) {
        const walkmeList = internals.timing.list as any[];
        const readyIndex = walkmeList.findIndex((eventItem: any) => {
          const eventName =
            eventItem && typeof eventItem === 'object' && 'name' in eventItem ? String(eventItem.name) : String(eventItem);
          return eventName === 'walkmeReady';
        });

        if (readyIndex >= 0) {
          isReadyDetected = true;
        } else {
          const lastIndex = walkmeList.length - 1;
          const lastEntry = walkmeList[lastIndex];
          const lastName =
            lastEntry && typeof lastEntry === 'object' && 'name' in lastEntry ? String(lastEntry.name) : String(lastEntry);
          setWalkmeTimingText(lastName);
        }
      }

      setWalkmeViaEditor(hasWmPlaySnippetData);

      setEntryKeys((previousKeys) => (previousKeys.includes('WL') ? previousKeys : ['WL', ...previousKeys]));

      if (isReadyDetected || hasWmPlaySnippetData) {
        setWalkmeTimingText('walkmeReady');
        setWalkmeIsReady(true);

        const walkmeApi = (window as any)._walkMe;
        try {
          const nextGuidValue = walkmeApi ? String(walkmeApi.getUserGuid()) : null;
          const nextEnvIdValue = walkmeApi ? String(walkmeApi.getEnvId()) : null;

          if (lastSeenGuidRef.current !== nextGuidValue) {
            setWalkmeUserGuid(nextGuidValue);
            lastSeenGuidRef.current = nextGuidValue;
          }
          if (lastSeenEnvIdRef.current !== nextEnvIdValue) {
            setWalkmeEnvId(nextEnvIdValue);
            lastSeenEnvIdRef.current = nextEnvIdValue;
          }
        } catch {
          if (lastSeenGuidRef.current !== null) {
            setWalkmeUserGuid(null);
            lastSeenGuidRef.current = null;
          }
          if (lastSeenEnvIdRef.current !== null) {
            setWalkmeEnvId(null);
            lastSeenEnvIdRef.current = null;
          }
        }
      } else {
        setWalkmeIsReady(false);
      }
    }

    refreshWalkmeStatus();
    intervalId = window.setInterval(refreshWalkmeStatus, 1000);

    return () => {
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [isMounted]);

  if (!isMounted) return null;

  const hasEntries = entryKeys.length > 0;
  if (!hasEntries) {
    return <Typography variant="body2" sx={{ color: 'white' }} />;
  }

  const wlPresent = entryKeys.includes('WL');
  const otherKeys = entryKeys.filter((keyName) => keyName !== 'WL');

  const loadedSuffix =
    walkmeIsReady && (walkmeUserGuid || walkmeEnvId)
      ? ` - GUID:${walkmeUserGuid ?? ''}${walkmeUserGuid && walkmeEnvId ? ' - ' : ''}ENV:${walkmeEnvId ?? ''}`
      : '';

  const loadingLabel = walkmeViaEditor ? 'WalkMe loading via editor' : 'WalkMe loading';
  const loadedLabel = walkmeViaEditor ? 'WalkMe loaded via editor' : 'WalkMe loaded';

  return (
    <Box sx={{ position: 'absolute', top: 0, left: 0 }}>
      <Stack spacing={0.5}>
        {wlPresent ? (
          <Typography key="WL" variant="body2" sx={{ color: walkmeIsReady ? 'green' : 'yellow' }}>
            <strong>
              {walkmeIsReady
                ? `${loadedLabel}${loadedSuffix}`
                : walkmeTimingText
                  ? `${loadingLabel} - ${walkmeTimingText}`
                  : loadingLabel}
            </strong>
          </Typography>
        ) : null}

        {otherKeys.map((propertyKey) => {
          let textColor: string;
          let displayText: string;

          switch (propertyKey) {
            case 'cspH':
              textColor = 'red';
              displayText = 'CSP in headers';
              break;
            case 'cspM':
              textColor = 'red';
              displayText = 'CSP in meta tag';
              break;
            case 'cspMN':
              textColor = 'red';
              displayText = 'CSP in meta tag + nonce';
              break;
            case 'cspSW':
              textColor = 'red';
              displayText = 'CSP via service worker';
              break;
            case 'nfGCS':
              textColor = 'orange';
              displayText = 'native getComputedStyle overriden';
              break;
            case 'nfR':
              textColor = 'orange';
              displayText = 'native Request overriden';
              break;
            case 'nfP':
              textColor = 'orange';
              displayText = 'native Promise overriden';
              break;
            default:
              textColor = 'white';
              displayText = propertyKey;
          }

          return (
            <Typography key={propertyKey} variant="body2" sx={{ color: textColor }}>
              <strong>{displayText}</strong>
            </Typography>
          );
        })}
      </Stack>
    </Box>
  );
}
