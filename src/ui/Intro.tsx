import { useGame } from '../state/store'

const isTouch = typeof window !== 'undefined' && matchMedia('(pointer: coarse)').matches

export function Intro() {
  const started = useGame((s) => s.started)
  const start = useGame((s) => s.start)

  if (started) return null

  return (
    <div className="intro">
      <div className="intro-card">
        <p className="intro-kicker">you wash ashore on</p>
        <h1>David's Island</h1>
        <p className="intro-flavor">
          Nobody's home — well, Bebo is. Wander around and find the things David would bring to a
          deserted island. There are four of them.
        </p>
        <button className="intro-start" onClick={start}>
          look around 🐾
        </button>
        <p className="intro-controls">
          {isTouch ? 'joystick to walk · drag to look · tap things to open them' : 'WASD to walk · drag to look · E to interact · shift to trot'}
        </p>
      </div>
    </div>
  )
}
