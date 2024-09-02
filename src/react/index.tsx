'use client'

import { useEffect, useState, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { Visualizer as VisualizerPanel } from '../index'

export default function Visualizer() {
  const [mountInstance, setMountInstance] = useState(false)
  const shadowHostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const w = window as {
      __scrollytelling_alreadyMountedDebuggerInstance?: boolean
    }

    const alreadyMountedInstance = w.__scrollytelling_alreadyMountedDebuggerInstance
    if (alreadyMountedInstance) return
    setMountInstance(true)
    w.__scrollytelling_alreadyMountedDebuggerInstance = true
  }, [])

  useEffect(() => {
    if (mountInstance && shadowHostRef.current) {
      const shadowRoot = shadowHostRef.current.attachShadow({ mode: 'open' })
      window.dispatchEvent(
        new CustomEvent('visualizer-mounted', {
          detail: { root: shadowHostRef.current },
        }),
      )
      const container = document.createElement('div')
      container.id = 'shadow-root'
      shadowRoot.appendChild(container)
      const root = createRoot(container)
      root.render(<VisualizerPanel />)
    }
  }, [mountInstance])

  if (!mountInstance) return <></>

  return <div ref={shadowHostRef} data-lenis-prevent id="visualizer-portal"></div>
}
