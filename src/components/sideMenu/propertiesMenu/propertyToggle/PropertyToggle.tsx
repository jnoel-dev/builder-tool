'use client'

import * as React from 'react'
import { FormControlLabel, Switch } from '@mui/material'
import { useFrame } from '@/components/contexts/FrameManager/FrameManager'
import { getFrameProperties, setFrameProperty } from '@/components/contexts/FrameManager/framePersistence'

type PropertyToggleProps = {
  propertyKey: string
  label: string
}

export default function PropertyToggle({ propertyKey, label }: PropertyToggleProps) {
  const { currentFrameName, firebaseDocLoaded } = useFrame()
  const [isEnabled, setIsEnabled] = React.useState(false)

  React.useEffect(() => {
    if (!currentFrameName) return
    const properties = getFrameProperties(currentFrameName)
    const nextIsEnabled = propertyKey in properties
    setIsEnabled(nextIsEnabled)
  }, [currentFrameName, firebaseDocLoaded, propertyKey])

  function handleToggleChange(_: React.ChangeEvent<HTMLInputElement>, nextValue: boolean) {
    setIsEnabled(nextValue)
    if (currentFrameName) setFrameProperty(currentFrameName, propertyKey, nextValue)
  }

  return (
    <FormControlLabel
      control={<Switch checked={isEnabled} onChange={handleToggleChange} />}
      label={label}
      sx={{ margin: 0 }}
    />
  )
}
