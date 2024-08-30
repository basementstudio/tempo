'use client'

import { useEffect, useState } from 'react'
import { Portal } from '@radix-ui/react-portal'
import { useAppControls } from '~/gl/hooks/use-app-controls'
import dynamic from 'next/dynamic'

const VisualizerPanel = dynamic(() => import('./src').then(m => m.Visualizer), { ssr: false })

// ---- Debugger

export default function Visualizer() {
  const { isDebug } = useAppControls()
  const [mountInstance, setMountInstance] = useState(false)

  useEffect(() => {
    const w = window as {
      __scrollytelling_alreadyMountedDebuggerInstance?: boolean
    }

    const alreadyMountedInstance =
      w.__scrollytelling_alreadyMountedDebuggerInstance
    if (alreadyMountedInstance) return
    setMountInstance(true)
    w.__scrollytelling_alreadyMountedDebuggerInstance = true
  }, [])

  if (!mountInstance || !isDebug) return <></>

  return (
    <Portal data-lenis-prevent id='visualizer-portal'>
      <VisualizerPanel />
    </Portal>
  )
}
