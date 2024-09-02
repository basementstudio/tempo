import { Fragment, useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import type { VisualizerRoot, VisualizerItem, DataAttribute } from './types'

import './reset.css'
import s from './index.module.css'
import { internalEventEmmiter } from './internal-event-emmiter'
import { clsx } from './utils'

import { SVGPlot, colors, getTargetString, highlight } from './helpers'

const EasePlot = ({ tween }: { tween: VisualizerItem }) => {
  const progressMarkerRef = useRef<SVGLineElement>(null)
  const valueMarkerRef = useRef<SVGCircleElement>(null)
  const valueTextRef = useRef<SVGTextElement>(null)
  const easeFn = gsap.parseEase(tween.vars.ease)

  useEffect(() => {
    return internalEventEmmiter.on('timeline:update', () => {
      const progress = tween.progress()

      if (!progressMarkerRef.current || !valueMarkerRef.current || !valueTextRef.current) return

      progressMarkerRef.current.setAttribute('x1', `${progress * 100}`)
      progressMarkerRef.current.setAttribute('x2', `${progress * 100}`)
      valueMarkerRef.current.setAttribute('cy', `${100 - easeFn(progress) * 100}`)
      valueMarkerRef.current.setAttribute('cx', `${progress * 100}`)
      valueTextRef.current.textContent = easeFn(progress).toFixed(2)
    })
  }, [tween])

  return (
    <svg width="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Grid */}
      <line x1="0" y1="25" x2="100" y2="25" stroke="var(--color-gray)" />
      <line x1="0" y1="50" x2="100" y2="50" stroke="var(--color-gray)" />
      <line x1="0" y1="75" x2="100" y2="75" stroke="var(--color-gray)" />
      <line x1="25" y1="0" x2="25" y2="100" stroke="var(--color-gray)" />
      <line x1="50" y1="0" x2="50" y2="100" stroke="var(--color-gray)" />
      <line x1="75" y1="0" x2="75" y2="100" stroke="var(--color-gray)" />

      {/* Plot */}
      {SVGPlot(easeFn)}

      {/* Progress */}
      <line x1={0} y1="0" x2={0} y2="100" stroke="var(--color-white)" ref={progressMarkerRef} />
      {/* Value at progress marker */}
      <circle cx="0" cy="0" r="2" fill="var(--color-orange)" stroke="var(--color-white)" ref={valueMarkerRef} />
      {/* Value at progress */}
      <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" fill="var(--color-white)" ref={valueTextRef}>
        {easeFn(0).toFixed(2)}
      </text>
    </svg>
  )
}

const useTimelineItem = ({
  root,
  tween,
  onSelect,
}: {
  tween: VisualizerItem
  root: VisualizerRoot
  onSelect: (t: VisualizerItem) => void
}) => {
  const [isHovering, setIsHovering] = useState(false)
  const [, setActive] = useState(false)

  // Highlight tween target element on hover
  useEffect(() => {
    if (isHovering && tween instanceof gsap.core.Tween) {
      const cleanups = tween.targets().map((t: any) => {
        if (t instanceof SVGElement || t instanceof HTMLElement) {
          return highlight(t)
        }

        return undefined
      })

      return () => {
        // @ts-ignore
        cleanups.forEach((clean) => clean && clean())
      }
    }
  }, [isHovering, tween])

  useEffect(() => {
    const handleUpdate = () => {
      const progress = root.tween?.progress()

      if (!progress) return

      const start = tween._start / 100
      const end = (tween._start + tween._dur) / 100

      if (progress >= start && progress <= end) {
        setActive(true)
      } else {
        setActive(false)
      }
    }

    return internalEventEmmiter.on('timeline:update', handleUpdate)
  }, [root.tween, tween._dur, tween._start])

  const targetString = getTargetString(tween)

  const identifier = tween.vars.id || tween.vars.label || null

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.stopPropagation()
    /* left click */
    if (e.button === 0) {
      onSelect(tween)
    }

    /* middle click */
    if (e.button === 1) {
      const st = root.tween?.scrollTrigger
      if (!st) return

      const start = st.start
      const end = st.end
      const scroll = start + (end - start) * (tween._start / 100)

      const holdingShift = e.shiftKey

      window.scrollTo({
        top: scroll,
        behavior: holdingShift ? 'instant' : 'smooth',
      })
    }
  }

  /* If root tween missing we can't calculate the width */
  if (!root.tween) {
    throw new Error('Root tween is missing')
  }

  const isRootTween = tween === root.tween
  const duration = root.tween.duration()
  const start = isRootTween ? 0 : tween._start
  const startPerc = (start / duration) * 100
  const endPerc = ((start + tween._dur) / duration) * 100

  return {
    onMouseDown,
    targetString,
    identifier,
    startPerc,
    endPerc,
    setIsHovering,
    isHovering,
  }
}

const Tween = ({
  selected,
  tween,
  root,
  onSelect,
  idx,
}: {
  selected: boolean
  tween: VisualizerItem
  root: VisualizerRoot
  onSelect: (t: VisualizerItem) => void
  idx: number
}) => {
  const { targetString, identifier, startPerc, endPerc, onMouseDown, setIsHovering } = useTimelineItem({
    root,
    tween,
    onSelect,
  })

  return (
    <div
      title={targetString}
      className={clsx(s['tween'], selected && [s['selected']])}
      style={{
        // @ts-ignore
        '--duration-percentage': endPerc - startPerc + '%',
        '--start-offset-percentage': startPerc + '%',
        '--tween-color': colors[idx % colors.length]?.[1],
        background: 'linear-gradient(90deg, transparent 0%, ' + colors[idx % colors.length]?.[0] + ' 100%)',
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseDown={onMouseDown}
    >
      {identifier} {identifier && targetString ? ' | ' + targetString : targetString}
    </div>
  )
}

const Set = ({
  selected,
  tween,
  root,
  onSelect,
  idx,
}: {
  selected: boolean
  tween: VisualizerItem
  root: VisualizerRoot
  onSelect: (t: VisualizerItem) => void
  idx: number
}) => {
  const { targetString, startPerc, onMouseDown, setIsHovering } = useTimelineItem({ root, tween, onSelect })

  return (
    <div
      style={
        {
          '--start-offset-percentage': startPerc + '%',
          '--tween-color': colors[idx % colors.length]?.[1],
        } as React.CSSProperties
      }
      className={s['set']}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseDown={onMouseDown}
    >
      <div
        title={targetString}
        className={clsx(s['set-inner'], selected && [s['selected']])}
        style={{
          // @ts-ignore
          background: 'linear-gradient(90deg, transparent 0%, ' + colors[idx % colors.length]?.[0] + ' 100%)',
        }}
      />
    </div>
  )
}

const Waypoint = ({ tween, root }: { tween: VisualizerItem; root: VisualizerRoot; idx: number }) => {
  const [lastState, setLastState] = useState<'complete' | 'reverse-complete' | undefined>(undefined)

  useEffect(() => {
    if (tween.data._visualizer.type === 'waypoint') {
      tween.data._visualizer._internalOnCall = () => {
        setLastState('complete')
      }

      tween.data._visualizer._internalOnReverseCall = () => {
        setLastState('reverse-complete')
      }
    }
  }, [tween.data._visualizer])

  return (
    <div
      style={{
        // @ts-ignore
        '--start-offset-percentage': tween._start + '%',
      }}
      className={s['waypoint']}
      onClick={() => {
        const st = root.tween?.scrollTrigger
        if (!st) return

        if (tween.data._visualizer.type === 'waypoint') {
          if (!(root.tween instanceof gsap.core.Timeline)) return

          // scroll to label
          const foundLabel = root.tween?.labels[tween.data._visualizer.label]
          if (foundLabel) {
            const targetPx = st.labelToScroll(tween.data._visualizer.label)
            window.scrollTo({ top: targetPx + 0, behavior: 'smooth' })
          }
        }
      }}
    >
      <span className={clsx(s['onReverseCall'], lastState === 'reverse-complete' && s['active'])}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M6.375 9.75L2.625 6L6.375 2.25M9.375 9.75L5.625 6L9.375 2.25"
            stroke="white"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M1.5 1.5V2.25V1.5ZM1.5 10.5V7.5V10.5ZM1.5 7.5L2.885 7.1535C3.9272 6.89302 5.0282 7.01398 5.989 7.4945L6.043 7.5215C6.98459 7.9921 8.06137 8.11772 9.086 7.8765L10.643 7.5105C10.4523 5.76591 10.4515 4.00577 10.6405 2.261L9.0855 2.627C8.06097 2.86794 6.98439 2.74215 6.043 2.2715L5.989 2.2445C5.0282 1.76398 3.9272 1.64302 2.885 1.9035L1.5 2.25M1.5 7.5V2.25V7.5Z"
          fill="white"
          fillOpacity="0.12"
        />
        <path
          d="M1.5 1.5V2.25M1.5 2.25L2.885 1.9035C3.9272 1.64302 5.0282 1.76398 5.989 2.2445L6.043 2.2715C6.98439 2.74215 8.06097 2.86794 9.0855 2.627L10.6405 2.261C10.4515 4.00577 10.4523 5.76591 10.643 7.5105L9.086 7.8765C8.06137 8.11772 6.98459 7.9921 6.043 7.5215L5.989 7.4945C5.0282 7.01398 3.9272 6.89302 2.885 7.1535L1.5 7.5M1.5 2.25V7.5M1.5 10.5V7.5"
          stroke="white"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className={clsx(s['onCall'], lastState === 'complete' && s['active'])}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M5.625 2.25L9.375 6L5.625 9.75M2.625 2.25L6.375 6L2.625 9.75"
            stroke="white"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </div>
  )
}

const ProgressStatus = ({ root }: { root: VisualizerRoot | undefined }) => {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handleUpdate = () => {
      const progress = root?.tween?.progress()
      setProgress(progress ?? 0)
    }

    return internalEventEmmiter.on('timeline:update', handleUpdate)
  }, [root?.tween])

  return <>{(progress * 100).toFixed(0)}%</>
}

const Select = (props: React.HTMLAttributes<HTMLSelectElement> & { value: string }) => {
  return (
    <div className={s['selectWrapper']}>
      <select {...props} className={clsx(s['select'], props.className)} />
      <svg
        className={s['arrow']}
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M9.75 4.125L6 7.875L2.25 4.125" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

const Guides = () => {
  console.log('here', s['guides-inner'])
  return (
    <div className={s['guides']}>
      <div className={s['guides-inner']}>
        <div className={s['guide']} style={{ left: '0%' }}>
          <span className={s['percent']}>0%</span>
          <div className={s['line']} />
        </div>
        <div className={s['guide']} style={{ left: '25%' }}>
          <span className={s['percent']}>25%</span>
          <div className={s['line']} />
        </div>
        <div className={s['guide']} style={{ left: '50%' }}>
          <span className={s['percent']}>50%</span>
          <div className={s['line']} />
        </div>
        <div className={s['guide']} style={{ left: '75%' }}>
          <span className={s['percent']}>75%</span>
          <div className={s['line']} />
        </div>
        <div className={s['guide']} style={{ left: '100%' }}>
          <span className={s['percent']}>100%</span>
          <div className={s['line']} />
        </div>
      </div>
    </div>
  )
}

const useSessionStorageConfig = <T extends any>(key: string, defaultValue: T) => {
  const PREFIX = '@bsmnt/timeline-visualizer:'
  const [value, setValue] = useState<T>(() => {
    const storedValue = sessionStorage.getItem(PREFIX + key)
    return storedValue ? JSON.parse(storedValue) : defaultValue
  })
  const ref = useRef(value)

  useEffect(() => {
    sessionStorage.setItem(PREFIX + key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue, ref] as const
}

const calculateStaggeredTweenDuration = (
  tween: VisualizerItem,
): {
  tweenDuration: number
  gap: number
} => {
  if (!(tween instanceof gsap.core.Tween)) return { tweenDuration: 0, gap: 0 }

  if (typeof tween.vars.stagger === 'object') {
    // Use gsap.utils.distribute to calculate the staggered duration
    const { amount, ease, grid, from } = tween.vars.stagger
    const s = gsap.utils.distribute({
      amount,
      ease,
      grid,
      from,
    })
    const trgts = tween.targets()
    const v = trgts.map((t: any, idx: number) => {
      const start = s(idx, t, trgts)
      // @ts-ignore
      const end = start + (tween?.vars?.duration ?? 1)
      return { start, end }
    })
    v
  }

  return {
    tweenDuration: tween.duration(),
    gap: 0,
  }
}

const Info = ({ root, selectedItem }: { root: VisualizerRoot; selectedItem: VisualizerItem | undefined }) => {
  const [state, setState] = useState<'playing' | 'paused'>(root.tween?.isActive() ? 'playing' : 'paused')
  const [loop, setLoop] = useState(root.tween?.repeat() === -1)
  const rootData = root?.tween?.data?._visualizer as DataAttribute

  if (rootData.type !== 'root') throw new Error('Selected root is not root type')

  const totalDuration = root?.tween?.duration() || 0
  const showDurationWarning = rootData.isScrollytelling && totalDuration != 100
  const unit = rootData.isScrollytelling ? '%' : ' seconds'

  const rootInfo = [
    [
      <>Total Duration</>,
      <>
        {totalDuration}
        {unit}
        {showDurationWarning && (
          <span title="This timeline is not normalized! You may experience bad UI.">{' ❗️'}</span>
        )}
      </>,
    ],
    [<>Total Pixels</>, <>{(root.tween?.scrollTrigger?.end ?? 0) - (root.tween?.scrollTrigger?.start ?? 0)} px</>],
    [<>Total Tweens</>, <>{root.children.length} </>],
  ]

  const itemInfo = []

  if (selectedItem) {
    const targets = selectedItem?.targets?.()

    const tws = calculateStaggeredTweenDuration(selectedItem)

    tws

    const targetString = getTargetString(selectedItem)

    itemInfo.push(
      [
        <>Target</>,
        <>
          ({targets?.length}) {targetString}
        </>,
      ],
      [
        <>Duration</>,
        <>
          {selectedItem._dur}
          {unit}
        </>,
      ],
      [
        <>Start</>,
        <>
          {selectedItem._start}
          {unit}
        </>,
      ],
      [
        <>End</>,
        <>
          {selectedItem._start + selectedItem._dur}
          {unit}
        </>,
      ],
    )

    if (selectedItem instanceof gsap.core.Tween) {
      itemInfo.push([
        <>Easing</>,
        <div>
          <p className={s['info-title']} title={selectedItem.vars.ease?.toString()}>
            {selectedItem.vars.ease?.toString() ?? 'No ease provided'}
          </p>
          {selectedItem.vars.ease && <EasePlot tween={selectedItem} />}
        </div>,
      ])
    }
  }

  const handleLoop = () => {
    const loop = root.tween?.repeat() === -1

    if (loop) {
      root.tween?.repeat(0)
    } else {
      root.tween?.repeat(-1)
      root.tween?.repeatDelay(1)
    }

    setLoop(root.tween?.repeat() === -1)
  }

  const handlePlay = () => {
    if (state === 'playing') {
      root.tween?.pause()
      setState('paused')
    } else {
      root.tween?.play()

      /* Attach original callback */
      const onComplete = root.tween?.eventCallback('onComplete')

      root.tween?.eventCallback('onComplete', () => {
        onComplete?.()
        root.tween?.pause()
        setState(root.tween?.isActive() ? 'playing' : 'paused')
      })
      setState('playing')
    }
  }

  const handleRestart = () => {
    root.tween?.seek(0, false)
  }

  useEffect(() => {
    const handleUpdate = () => {
      setState(root.tween?.isActive() ? 'playing' : 'paused')
    }

    return internalEventEmmiter.on('timeline:update', handleUpdate)
  }, [root.tween])

  const hasControls = !rootData.isScrollytelling

  return (
    <div className={clsx(s['side'], hasControls && s['has-controls'])}>
      <div className={s['info']}>
        {rootData.isScrollytelling ? (
          <p className={s['info-title']}>✨ Scrollytelling Timeline ✨</p>
        ) : (
          <p className={s['info-title']}>Selected Root</p>
        )}
        <div className={s['list']}>
          {rootInfo.map((r, idx) => {
            return (
              <Fragment key={idx}>
                <div className={s['key']}>{r[0]}</div>
                <div className={s['value']}>{r[1]}</div>
              </Fragment>
            )
          })}
        </div>
        {selectedItem && (
          <>
            <p className={s['info-title']}>Selected Tween</p>
            <div className={s['list']}>
              {itemInfo.map((r, idx, arr) => {
                return (
                  <>
                    <div className={s['key']}>{r[0]}</div>
                    <div className={clsx(s['value'], idx === arr.length - 1 && s['no-padding'])}>{r[1]}</div>
                  </>
                )
              })}
            </div>
          </>
        )}
      </div>
      {hasControls && (
        <div className={s['controls']}>
          <button className={s['play-pause']} onClick={handlePlay}>
            {state === 'playing' ? '⏸' : '▶️'}
          </button>
          <button className={s['restart']} onClick={handleRestart}>
            ↩
          </button>
          <button className={clsx(s['loop'], loop && s['looping'])} onClick={handleLoop}>
            {loop ? 'looping' : 'loop'}
          </button>
        </div>
      )}
    </div>
  )
}

const ProgressAndThumb = ({ root }: { root: VisualizerRoot | undefined }) => {
  const markerRef = useRef<HTMLDivElement>(null)
  const trailRef = useRef<HTMLDivElement>(null)
  const progressContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleUpdate = () => {
      const progress = root?.tween?.progress()

      if (!markerRef.current || !trailRef.current || progress === undefined) {
        return
      }

      markerRef.current.style.left = `${progress * 100}%`
      trailRef.current.style.left = `${progress * 100}%`
    }

    return internalEventEmmiter.on('timeline:update', handleUpdate)
  }, [root?.tween])

  useEffect(() => {
    const marker = markerRef.current
    const container = progressContainerRef.current

    if (!marker || !container) return

    let isDown = false

    const dragMouseDown = (e: MouseEvent) => {
      e = e || window.event

      e.preventDefault()
      // get the mouse cursor position at startup:
      isDown = true
      document.addEventListener('mouseup', closeDragElement)
      // call a function whenever the cursor moves:
      document.addEventListener('mousemove', elementDrag)
    }

    const elementDrag = (e: MouseEvent) => {
      e = e || window.event
      e.preventDefault()

      if (isDown) {
        const rect = container.getBoundingClientRect()
        const x = e.clientX - rect.left

        const progress = x / rect.width

        root?.tween?.progress(progress)
      }
    }

    function closeDragElement() {
      /* stop moving when mouse button is released */
      document.removeEventListener('mouseup', closeDragElement)
      document.removeEventListener('mousemove', elementDrag)
      isDown = false
    }

    marker.addEventListener('mousedown', dragMouseDown)

    return () => {
      marker.removeEventListener('mousedown', dragMouseDown)
      closeDragElement()
    }
  }, [root])

  return (
    <div className={s['progress']} ref={progressContainerRef}>
      <div className={s['progress-inner']}>
        <div className={s['marker']} ref={markerRef}>
          <span className={s['thumb']}>
            <span className={s['percent']}>
              <ProgressStatus root={root} />
            </span>
            <svg width="8" height="11" viewBox="0 0 8 11" fill="none" xmlns="http://www.w3.org/2000/svg">
              <mask id="path-1-inside-1_2793_1632" fill="white">
                <path fillRule="evenodd" clipRule="evenodd" d="M8 0H0V8L4 11L8 8V0Z" />
              </mask>
              <path fillRule="evenodd" clipRule="evenodd" d="M8 0H0V8L4 11L8 8V0Z" fill="white" />
              <path
                d="M0 0V-1H-1V0H0ZM8 0H9V-1H8V0ZM0 8H-1V8.5L-0.6 8.8L0 8ZM4 11L3.4 11.8L4 12.25L4.6 11.8L4 11ZM8 8L8.6 8.8L9 8.5V8H8ZM0 1H8V-1H0V1ZM1 8V0H-1V8H1ZM4.6 10.2L0.6 7.2L-0.6 8.8L3.4 11.8L4.6 10.2ZM7.4 7.2L3.4 10.2L4.6 11.8L8.6 8.8L7.4 7.2ZM7 0V8H9V0H7Z"
                fill="white"
                mask="url(#path-1-inside-1_2793_1632)"
              />
            </svg>
          </span>
        </div>
        <div className={s['trail']}>
          <div className={s['gradient']} ref={trailRef} />
        </div>
      </div>
    </div>
  )
}

export const Visualizer = () => {
  const panelRef = useRef<HTMLDivElement>(null)
  const panelHeaderRef = useRef<HTMLDivElement>(null)

  const [roots, setRoots] = useState<VisualizerRoot[]>([])
  const [dismiss, setDismiss] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [scrollTop, setScrollTop] = useState<number>()
  const [isUserScroll, _setIsUserScroll] = useState(true)
  const [selectedTween, setSelectedTween] = useState<VisualizerItem | undefined>()

  const [minimize, setMinimize] = useSessionStorageConfig('minimize', false)
  const [ghost, setGhost] = useSessionStorageConfig('ghost', false)
  const [height, setHeight, heightRef] = useSessionStorageConfig('height', 350)
  const [selectedRoot, setSelectedRoot] = useSessionStorageConfig('last-root-selected', '')

  const root = roots.find((r) => r.id === selectedRoot) ?? roots[0]

  /* Temporaly removed */
  useEffect(() => {
    console.log(window)
    return
    if (!isUserScroll) return

    const onScroll = () => {
      setScrollTop(window.scrollY)
    }

    window.addEventListener('scroll', onScroll)

    const activeRoot = roots.find((r) => {
      const progress = r?.tween?.progress() as number
      const roundedProgress = Math.round(progress * 100) / 100

      return roundedProgress !== undefined && roundedProgress > 0 && roundedProgress < 1
    })

    if (!activeRoot) return

    setSelectedRoot(activeRoot?.id ?? '')

    return () => {
      window.removeEventListener('scroll', onScroll)
    }
  }, [isUserScroll, roots, scrollTop])

  useEffect(() => {
    const panel = panelRef.current
    const panelHeader = panelHeaderRef.current

    if (!panel || !panelHeader) return

    /* Recover panel height */
    const height = heightRef.current?.toString() + 'px'
    panel.style.setProperty('height', height)
    panel.style.setProperty('--viewport-height', height)

    let y1 = 0,
      y2 = 0,
      h1 = 0

    const dragMouseDown = (e: MouseEvent) => {
      e = e || window.event

      e.preventDefault()
      // get the mouse cursor position at startup:
      y1 = e.clientY
      h1 = panel.offsetHeight
      document.addEventListener('mouseup', closeDragElement)
      // call a function whenever the cursor moves:
      document.addEventListener('mousemove', elementDrag)
    }

    const elementDrag = (e: MouseEvent) => {
      if (!panel) return

      e = e || window.event
      e.preventDefault()
      // calculate the new cursor position:
      y2 = e.clientY
      // set the element's new position:
      const height = Math.max(h1 + y1 - y2, 0) + 'px'
      panel.style.setProperty('height', height)
      panel.style.setProperty('--viewport-height', height)
    }

    function closeDragElement() {
      /* stop moving when mouse button is released */
      document.removeEventListener('mouseup', closeDragElement)
      document.removeEventListener('mousemove', elementDrag)

      const height = panel?.style.getPropertyValue('height').replace('px', '')
      panel?.style.height && setHeight(Number(height) ?? 350)
    }

    panelHeader.addEventListener('mousedown', dragMouseDown)

    setInitialized(true)

    return () => {
      panelHeader.removeEventListener('mousedown', dragMouseDown)
      closeDragElement()
    }
  }, [setMinimize, setGhost, setInitialized])

  useEffect(() => {
    return internalEventEmmiter.on('timeline:refresh', () => {
      const roots: VisualizerRoot[] = []

      gsap.globalTimeline.getChildren().forEach((t) => {
        if (!t.data?._visualizer) return

        const data = t.data._visualizer as DataAttribute

        if (data.type === 'root') {
          if (!data.debug) return // not a scrollytelling tween

          if (t instanceof gsap.core.Timeline) {
            const existingRootItem = roots.find((r) => r.tween === t)

            if (!existingRootItem) {
              roots.push({
                id: data?.id,
                label: data?.label,
                debug: true,
                children: [],
                tween: t as any,
              })
            } else {
              existingRootItem.debug = true
              existingRootItem.tween = t as any
              existingRootItem.label = data?.label
            }
          } else {
            roots.push({
              id: data?.id,
              label: data?.label,
              debug: true,
              children: [t as any],
              tween: t as any,
            })
          }
        } else if (data.type === 'animation' || data.type === 'waypoint' || data.type === 'instant-animation') {
          const existingRootItem = roots.find((r) => r.tween === t.parent)

          if (!existingRootItem) {
            if (!t.parent) return

            roots.push({
              id: '',
              debug: false,
              label: '',
              children: [t as any],
              tween: t.parent,
            })
          } else {
            existingRootItem.children.push(t as any)
          }
        }
      })

      // sort by trigger's top distance to top of the document
      roots.sort((a, b) => {
        const aTriggerEl = a.tween?.scrollTrigger?.trigger
        const bTriggerEl = b.tween?.scrollTrigger?.trigger

        if (!aTriggerEl || !bTriggerEl) return 0

        const aTop = aTriggerEl.getBoundingClientRect().top
        const bTop = bTriggerEl.getBoundingClientRect().top

        return aTop - bTop
      })

      setRoots(roots.filter((r) => r.debug))
    })
  }, [])

  useEffect(() => {
    // Force refresh on mount
    internalEventEmmiter.emit('timeline:refresh')
  }, [])

  if (dismiss) return <></>

  return (
    <div className={clsx(s['root'], initialized && s['initialized'], ghost && s['ghost'])}>
      <header className={s['header']}>
        <div className={s['actions']}>
          <Select
            value={selectedRoot}
            onChange={(e) => {
              setSelectedRoot(e.currentTarget.value)
              setSelectedTween(undefined)
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {roots.map((r) => {
              return (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              )
            })}
          </Select>
        </div>

        <div
          className={s['handle']}
          style={
            {
              '--viewport-height': height + 'px',
              visibility: minimize ? 'hidden' : 'visible',
              pointerEvents: minimize ? 'none' : 'auto',
            } as React.CSSProperties
          }
          ref={panelHeaderRef}
        />

        <div className={s['actions']}>
          <button
            style={{
              textDecoration: ghost ? 'line-through' : 'none',
            }}
            className={s['button']}
            onClick={() => setGhost((g) => !g)}
          >
            G
          </button>
          <button className={s['button']} onClick={() => setMinimize((p) => !p)}>
            {minimize ? (
              <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M2.43359 8C2.43359 7.72386 2.65745 7.5 2.93359 7.5H13.0669C13.3431 7.5 13.5669 7.72386 13.5669 8C13.5669 8.27614 13.3431 8.5 13.0669 8.5H2.93359C2.65745 8.5 2.43359 8.27614 2.43359 8Z"
                  fill="white"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M8 2.43311C8.27614 2.43311 8.5 2.65697 8.5 2.93311L8.5 13.0664C8.5 13.3426 8.27614 13.5664 8 13.5664C7.72386 13.5664 7.5 13.3426 7.5 13.0664L7.5 2.93311C7.5 2.65697 7.72386 2.43311 8 2.43311Z"
                  fill="white"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M2.43359 8C2.43359 7.72386 2.65745 7.5 2.93359 7.5H13.0669C13.3431 7.5 13.5669 7.72386 13.5669 8C13.5669 8.27614 13.3431 8.5 13.0669 8.5H2.93359C2.65745 8.5 2.43359 8.27614 2.43359 8Z"
                  fill="white"
                />
              </svg>
            )}
          </button>
          <button className={s['button']} onClick={() => setDismiss(true)}>
            <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12.5402 4.27333C12.7648 4.04878 12.7648 3.68471 12.5402 3.46016C12.3157 3.23561 11.9516 3.23561 11.7271 3.46016L8.00033 7.18691L4.27358 3.46016C4.04903 3.23561 3.68496 3.23561 3.46041 3.46016C3.23585 3.68471 3.23585 4.04878 3.46041 4.27333L7.18715 8.00008L3.46041 11.7268C3.23585 11.9514 3.23585 12.3154 3.46041 12.54C3.68496 12.7646 4.04903 12.7646 4.27358 12.54L8.00033 8.81325L11.7271 12.54C11.9516 12.7646 12.3157 12.7646 12.5402 12.54C12.7648 12.3154 12.7648 11.9514 12.5402 11.7268L8.8135 8.00008L12.5402 4.27333Z"
                fill="white"
              />
            </svg>
          </button>
        </div>
      </header>

      <div style={{ display: minimize ? 'none' : 'block' }}>
        <div
          // onMouseDown={() => setSelectedTween(undefined)}
          className={s['main']}
          ref={panelRef}
        >
          {root && <Info selectedItem={selectedTween} root={root} />}

          <div className={s['timeline']}>
            <div className={s['timeline-inside']}>
              <Guides />
              <div className={s['tweens']}>
                {root?.children.map((t, idx) => {
                  const data = t.data._visualizer

                  if (data.type === 'animation' || data.type === 'root') {
                    return (
                      <div className={s['row']} key={idx}>
                        <Tween
                          selected={selectedTween === t}
                          onSelect={setSelectedTween}
                          tween={t}
                          root={root}
                          idx={idx}
                        />
                      </div>
                    )
                  }

                  if (data.type === 'instant-animation') {
                    return (
                      <div className={s['row']} key={idx}>
                        <Set
                          selected={selectedTween === t}
                          onSelect={setSelectedTween}
                          tween={t}
                          root={root}
                          idx={idx}
                        />
                      </div>
                    )
                  }

                  if (data.type === 'waypoint') {
                    return (
                      <div className={s['row']} key={idx}>
                        <Waypoint tween={t} root={root} idx={idx} />
                      </div>
                    )
                  }

                  return <></>
                })}
              </div>
              <ProgressAndThumb root={root} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
