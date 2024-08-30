import { gsap } from 'gsap'

import { VisualizerItem } from './types'
import s from './visualizer.module.scss'

export const highlight = (target: SVGElement | HTMLElement) => {
  // Create a div element that has the same dimensions and position as the target
  const highlight = document.createElement('div')

  highlight.style.position = 'fixed'
  const bounds = target.getBoundingClientRect()
  highlight.style.top = `${bounds.top}px`
  highlight.style.left = `${bounds.left}px`
  highlight.style.width = `${bounds.width}px`
  highlight.style.height = `${bounds.height}px`

  highlight.classList.add(s['highlight'] as string)

  // Append to body.
  document.body.appendChild(highlight)

  // Clear instance
  return () => {
    try {
      document.body.removeChild(highlight)
    } catch (error) {
      console.error('Failed to remove node')
    }
  }
}

/*
  GSAP doesn't calculate the ease function unless the tween
  needs to run, or the tween has a "from". So we need to protect
  the ease function from being called with an undefined fn().
*/
export const SVGPlot = (
  fn: (x: number) => number,
  offset: { x?: number; y?: number } = {},
  color = '#0ae448'
) => {
  const points = []

  try {
    points.push(
      ...Array.from({ length: 100 }, (_, i) => {
        const x = i / 100
        const y = fn(x)

        return `${x * 100 + (offset?.x ?? 0)},${
          100 - y * 100 + (offset?.y ?? 0)
        }`
      })
    )
  } catch (error) {
    console.log(error, fn)
  }

  return (
    <polyline
      fill="none"
      stroke={color}
      strokeWidth="2"
      points={points.join(' ')}
    />
  )
}

export const colors = [
  ['#F87171', '#991B1B'],
  ['#FACC15', '#854D0E'],
  ['#4ADE80', '#166534'],
  ['#2DD4BF', '#115E59'],
  ['#38BDF8', '#075985'],
  ['#818CF8', '#3730A3'],
  ['#C084FC', '#6B21A8'],
  ['#E879F9', '#86198F'],
  ['rgba(244, 114, 182, 0.40)', '#9D174D']
]

export const getTargetString = (tween: VisualizerItem) => {
  if (!(tween instanceof gsap.core.Tween)) return ''

  return tween
    .targets()
    .map((t: any) => {
      if (t instanceof SVGElement || t instanceof HTMLElement) {
        return `${t.tagName.toLocaleLowerCase()}${t.id ? `#${t.id}` : ''}${
          t.classList.length ? '.' + t.classList[0] : ''
        }`
      }

      if (t instanceof Object) {
        const allKeys = Object.keys(t).filter((k) => k != '_gsap')
        const displayKeys = allKeys.slice(0, 3)

        if (allKeys.length > displayKeys.length) {
          displayKeys.push('...')
        }

        return `${t.constructor.name} { ${displayKeys.join(', ')} }`
      }
    })
    .join(', ')
}
