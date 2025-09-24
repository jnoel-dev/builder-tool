'use client'

import * as React from 'react'
import { Box, Checkbox, FormControlLabel, Switch } from '@mui/material'
import { useFrame } from '@/components/contexts/FrameManager/FrameManager'
import { getFrameProperties, setFrameProperty } from '@/components/contexts/FrameManager/framePersistence'


type PropertyToggleProps = {
  propertyKey: string
  label: string
  additionalPropertyKey?: string
  additionalPropertyLabel?: string
}

export default function PropertyToggle({
  propertyKey,
  label,
  additionalPropertyKey = '',
  additionalPropertyLabel = ''
}: PropertyToggleProps) {
  const { currentFrameName, receivedFirebaseResponse } = useFrame()
  const [isEnabled, setIsEnabled] = React.useState(false)
  const [isAdditionalChecked, setIsAdditionalChecked] = React.useState(false)

  React.useEffect(() => {
    if (!currentFrameName) return
    const properties = getFrameProperties(currentFrameName)
    const primaryOn = !!properties[propertyKey]
    const additionalOn = additionalPropertyKey ? !!properties[additionalPropertyKey] : false

    if (additionalOn) {
      setIsAdditionalChecked(true)
      setIsEnabled(true)
    } else if (primaryOn) {
      setIsAdditionalChecked(false)
      setIsEnabled(true)
    } else {
      setIsAdditionalChecked(false)
      setIsEnabled(false)
    }
  }, [currentFrameName, receivedFirebaseResponse, propertyKey, additionalPropertyKey])

  function handleToggleChange(_: React.ChangeEvent<HTMLInputElement>, nextValue: boolean) {
    setIsEnabled(nextValue)
    if (!currentFrameName) return

    if (!nextValue) {
      setFrameProperty(currentFrameName, propertyKey, false)
      if (additionalPropertyKey) setFrameProperty(currentFrameName, additionalPropertyKey, false)
      return
    }

    const key = isAdditionalChecked && additionalPropertyKey ? additionalPropertyKey : propertyKey
    setFrameProperty(currentFrameName, key, true)

    if (additionalPropertyKey) {
      if (key === additionalPropertyKey) setFrameProperty(currentFrameName, propertyKey, false)
      else setFrameProperty(currentFrameName, additionalPropertyKey, false)
    }
  }

  function handleAdditionalCheckboxChange(_: React.ChangeEvent<HTMLInputElement>, checked: boolean) {
    setIsAdditionalChecked(checked)
    if (!currentFrameName || !additionalPropertyKey) return
    if (!isEnabled) return

    if (checked) {
      setFrameProperty(currentFrameName, additionalPropertyKey, true)
      setFrameProperty(currentFrameName, propertyKey, false)
    } else {
      setFrameProperty(currentFrameName, propertyKey, true)
      setFrameProperty(currentFrameName, additionalPropertyKey, false)
    }
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <FormControlLabel
        control={<Switch checked={isEnabled} onChange={handleToggleChange} />}
        label={label}
        sx={{ margin: 0 }}
      />
      {additionalPropertyKey ? (
        <FormControlLabel
          control={
            <Checkbox
              checked={isAdditionalChecked}
              onChange={handleAdditionalCheckboxChange}
              size="small"
            />
          }
          label={additionalPropertyLabel}
          sx={{ margin: 0 }}
        />
      ) : null}
    </Box>
  )
}
