'use client';

import { useEffect,useState,useRef } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

type FramePropertiesDisplayProps = {
  properties?: Record<string, unknown>;
};

export default function FramePropertiesDisplay({ properties }: FramePropertiesDisplayProps) {
  const theme = useTheme();
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [entryKeys, setEntryKeys] = useState<string[]>(Object.keys(properties ?? {}));
  const [walkmeTimingText, setWalkmeTimingText] = useState<string | null>(null);
  const [walkmeIsReady, setWalkmeIsReady] = useState<boolean>(false);
  const [walkmeUserGuid, setWalkmeUserGuid] = useState<string | null>(null);
  const [walkmeEnvId, setWalkmeEnvId] = useState<string | null>(null);
  const [walkmeViaEditor, setWalkmeViaEditor] = useState<boolean>(false);
  const [walkmeEuId, setWalkmeEuId] = useState<string | null>(null);
  const [walkmeEuIdSource, setWalkmeEuIdSource] = useState<string | null>(null);
  const [walkmeUnableReason, setWalkmeUnableReason] = useState<string | null>(null);

  const lastSeenGuidRef = useRef<string | null>(null);
  const lastSeenEnvIdRef = useRef<string | null>(null);

  useEffect(() => {
    const baseKeys = Object.keys(properties ?? {});
    setEntryKeys((previousKeys) => {
      const shouldKeepWl = previousKeys.includes('WL');
      const merged = shouldKeepWl ? Array.from(new Set(['WL', ...baseKeys])) : baseKeys;
      return merged;
    });
  }, [properties]);

  useEffect(() => {
    if (!isMounted) return;

    let intervalId: number | undefined;

    function refreshWalkmeStatus(): void {
      if (typeof window === 'undefined') {
        setWalkmeTimingText(null);
        setWalkmeIsReady(false);
        setWalkmeUserGuid(null);
        setWalkmeEnvId(null);
        setWalkmeViaEditor(false);
        setWalkmeEuId(null);
        setWalkmeEuIdSource(null);
        setWalkmeUnableReason(null);
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

      try {
        const value = internals?.removeWalkMeReason;
        const normalized = value != null && String(value).trim() !== '' ? String(value) : null;
        setWalkmeUnableReason(normalized);
      } catch {
        setWalkmeUnableReason(null);
      }

      if (!hasTimingList && !hasWmPlaySnippetData) {
        setWalkmeTimingText(null);
        setWalkmeIsReady(false);
        setWalkmeUserGuid(null);
        setWalkmeEnvId(null);
        setWalkmeViaEditor(false);
        setWalkmeEuId(null);
        setWalkmeEuIdSource(null);
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

      try {
        const provider = internals?.ctx?.get?.('EventCollectorWalkMeDataProvider');
        const data = provider?.getWalkMeData?.();
        const nextEuId = data?.euId ? String(data.euId) : null;
        const nextEuIdSource = data?.euIdSource ? String(data.euIdSource) : null;
        setWalkmeEuId(nextEuId);
        setWalkmeEuIdSource(nextEuIdSource);
      } catch {
        setWalkmeEuId(null);
        setWalkmeEuIdSource(null);
      }

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
    return <Typography variant="body2" sx={{ color: theme.palette.text.primary }} />;
  }

  const wlPresent = entryKeys.includes('WL');
  const otherKeys = entryKeys.filter((keyName) => keyName !== 'WL');

  const loadedSuffix =
    walkmeIsReady && (walkmeUserGuid || walkmeEnvId)
      ? ` - GUID:${walkmeUserGuid ?? ''}${walkmeUserGuid && walkmeEnvId ? ' - ' : ''}ENV:${walkmeEnvId ?? ''}`
      : '';

  const loadingLabel = walkmeViaEditor ? 'WalkMe not fully loaded - Editor connected' : 'WalkMe not fully loaded';
  const loadedLabel = walkmeViaEditor ? 'WalkMe loaded - Editor connected' : 'WalkMe loaded';

  return (
    <Box sx={{ position: 'absolute', top: 0, left: 0 }}>
      <Stack spacing={0.5}>
        {wlPresent ? (
          <>
            <Typography key="WL" variant="body2" sx={{ color: walkmeIsReady ? theme.palette.infoDisplay.success : theme.palette.infoDisplay.warning }}>
              <strong>
                {walkmeUnableReason
                  ? `WalkMe unable to load - ${walkmeUnableReason}`
                  : walkmeIsReady
                    ? `${loadedLabel}${loadedSuffix}`
                    : `Last loaded: ${walkmeTimingText}`
                      ? `${loadingLabel} - Last loaded: ${walkmeTimingText}`
                      : loadingLabel}
              </strong>
            </Typography>
            <Typography key="WL_EXTRA" variant="body2" sx={{ color: walkmeIsReady ? theme.palette.infoDisplay.success : theme.palette.infoDisplay.warning }}>
              <strong>
                EUID: {walkmeEuId ?? 'none'}{' '}
                SOURCE: {walkmeEuIdSource ?? 'none'}
              </strong>
            </Typography>
          </>
        ) : null}

        {otherKeys.map((propertyKey) => {
          let textColor: string;
          let displayText: string;

          switch (propertyKey) {
            case 'cspH':
              textColor = theme.palette.infoDisplay.csp;
              displayText = 'CSP in headers';
              break;
            case 'cspM':
              textColor = theme.palette.infoDisplay.csp;
              displayText = 'CSP in meta tag';
              break;
            case 'cspMN':
              textColor = theme.palette.infoDisplay.csp;
              displayText = 'CSP in meta tag + nonce';
              break;
            case 'cspSW':
              textColor = theme.palette.infoDisplay.csp;
              displayText = 'CSP in headers via service worker';
              break;
            case 'nfGCS':
              textColor = theme.palette.infoDisplay.nativeFunction;
              displayText = 'native getComputedStyle overriden';
              break;
            case 'nfR':
              textColor = theme.palette.infoDisplay.nativeFunction;
              displayText = 'native Request overriden';
              break;
            case 'nfP':
              textColor = theme.palette.infoDisplay.nativeFunction;
              displayText = 'native Promise overriden';
              break;
            case 'nfSA':
              textColor = theme.palette.infoDisplay.nativeFunction;
              displayText = 'native Element.prototype.setAttribute overriden';
              break;
            default:
              textColor = theme.palette.text.primary;
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
