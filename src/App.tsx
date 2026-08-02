import { Component, lazy, Suspense, type ReactNode } from 'react'
import { HUD } from './ui/HUD'
import { Panels } from './ui/Panels'
import { Joystick } from './ui/Joystick'
import { Intro } from './ui/Intro'
import { useGame } from './state/store'

// keeps three.js and friends out of the first-paint bundle
const World = lazy(() => import('./scene/World'))

const isTouch = typeof window !== 'undefined' && matchMedia('(pointer: coarse)').matches

// If WebGL is unavailable (locked-down laptop, ancient GPU) or the 3D chunk
// fails to load, show a way to reach David instead of a blank page.
class WorldBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (this.state.failed) {
      return (
        <div className="boot">
          <p>
            This island needs WebGL and it couldn't start here.
            <br />
            Say hi instead: <a href="mailto:davidcui824@gmail.com">davidcui824@gmail.com</a>
          </p>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  const started = useGame((s) => s.started)

  return (
    <>
      <WorldBoundary>
        <Suspense fallback={<div className="boot">drifting toward shore…</div>}>
          <World />
        </Suspense>
        <Intro />
        <HUD />
        <Panels />
        {started && isTouch && <Joystick />}
      </WorldBoundary>
    </>
  )
}
