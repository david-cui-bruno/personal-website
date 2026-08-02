import { useGame } from '../state/store'
import { startAudio } from '../lib/audio'

const isTouch = typeof window !== 'undefined' && matchMedia('(pointer: coarse)').matches

export function Intro() {
  const started = useGame((s) => s.started)
  const start = useGame((s) => s.start)
  const muted = useGame((s) => s.muted)

  if (started) return null

  const begin = () => {
    if (!muted) startAudio() // must happen inside the click (autoplay policy)
    start()
  }

  return (
    <div className="intro">
      <div className="intro-card">
        <p className="intro-kicker">you wash ashore on</p>
        <h1>David's Island</h1>
        <p className="intro-flavor">
          Nobody's home — well, Bebo is. Wander around and find the things David would bring to a
          deserted island. There are four of them.
        </p>
        <button className="intro-start" onClick={begin}>
          look around 🐾
        </button>
        <p className="intro-controls">
          {isTouch ? 'joystick to walk · drag to look · tap things to open them' : 'WASD to walk · drag to look · E to interact · shift to trot'}
        </p>
      </div>
    </div>
  )
}
