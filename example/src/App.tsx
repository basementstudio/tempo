import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import Visualizer from 'tempo/dist/react'
import { debug } from 'tempo/dist/debug'

import './App.css'

function App() {
  useGSAP(() => {
    debug(
      gsap.to('#red-cube', {
        duration: 1,
        rotate: 360,
        ease: 'power2.inOut',
        repeat: -1,
        yoyo: true,
      }),
      {
        label: 'rotate',
      },
    )
  }, {})

  return (
    <>
      <Visualizer />
      <div
        style={{
          height: '100vh',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div
          id="red-cube"
          style={{
            width: '100px',
            height: '100px',
            backgroundColor: 'red',
          }}
        />
      </div>
    </>
  )
}

export default App
