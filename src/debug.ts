'use client'

import { internalEventEmmiter } from "./src/internal-event-emmiter"
import { DataAttribute, GSAPChildWithHiddenVars } from "./src/types"
import gsap from 'gsap'

export const debug = (root: gsap.core.Timeline | gsap.core.Tween, { label }: { label: string }) => {
  root.data = {
    ...root.data,
    _visualizer: {
      ...root.data?._visualizer,
      type: 'root',
      debug: true,
      /* deleted: generate nanoid id */
      id: label,
      label
    } satisfies DataAttribute
  }

  if(root instanceof gsap.core.Tween) {
    // Should we do something here? 
  } else {
    root.getChildren().forEach((child) => {
      if (child.data?._visualizer) return
  
      const c = child as GSAPChildWithHiddenVars
  
      const isSet = c._start === c._end && c._dur === 0
  
      child.data = {
        ...child.data,
        _visualizer: {
          type: isSet ? 'instant-animation' : 'animation',
        } satisfies DataAttribute
      }
    })
  }
  
  internalEventEmmiter.emit('timeline:refresh')

  /* Original update */
  const onUpdate = root.eventCallback('onUpdate')

  root.eventCallback('onUpdate', () => {
    onUpdate?.()
    internalEventEmmiter.emit('timeline:update', root)
  })
}