import { lazy, Suspense } from 'react'
import { HUD } from './ui/HUD'
import { Panels } from './ui/Panels'
import { Joystick } from './ui/Joystick'
import { Intro } from './ui/Intro'
import { useGame } from './state/store'

// keeps three.js and friends out of the first-paint bundle
const World = lazy(() => import('./scene/World'))

const isTouch = typeof window !== 'undefined' && matchMedia('(pointer: coarse)').matches

export default function App() {
  const started = useGame((s) => s.started)

  return (
    <>
      <Suspense fallback={<div className="boot">drifting toward shore…</div>}>
        <World />
      </Suspense>
      <Intro />
      <HUD />
      <Panels />
      {started && isTouch && <Joystick />}
    </>
  )
}
