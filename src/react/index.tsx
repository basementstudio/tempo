'use client'

import { useEffect, useState, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { Visualizer as VisualizerPanel } from '../index'
import { MOUNT_EVENT_KEY, SHADOW_ROOT_ID, VISUALIZER_PORTAL_ID } from '../constants'

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

      const link = document.createElement('link')
      link.href = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono&display=swap'
      link.rel = 'stylesheet'
      document.head.appendChild(link)

      const unmount = document.fonts.ready.then(() => {
        window.dispatchEvent(
          new CustomEvent(MOUNT_EVENT_KEY, {
            detail: { root: shadowHostRef.current },
          }),
        )

        const container = document.createElement('div')
        container.id = SHADOW_ROOT_ID
        shadowRoot.appendChild(container)

        const root = createRoot(container)
        root.render(<VisualizerPanel />)

        return () => {
          console.log('unmounting')
          root.unmount()
        }
      })

      return () => {
        unmount.then((fn) => fn())
      }
    }
  }, [mountInstance])

  if (!mountInstance) return <></>

  return <div ref={shadowHostRef} id={VISUALIZER_PORTAL_ID}></div>
}
