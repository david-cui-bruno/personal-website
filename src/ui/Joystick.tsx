import { useRef, useState } from 'react'
import { joystick } from '../state/store'

const RADIUS = 48

// Touch joystick, bottom-left. Writes straight into the shared `joystick`
// object — no React state on the movement path.
export function Joystick() {
  const base = useRef<HTMLDivElement>(null)
  const [nub, setNub] = useState({ x: 0, y: 0 })

  const update = (e: React.PointerEvent) => {
    const el = base.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    let dx = e.clientX - (rect.left + rect.width / 2)
    let dy = e.clientY - (rect.top + rect.height / 2)
    const len = Math.hypot(dx, dy)
    if (len > RADIUS) {
      dx = (dx / len) * RADIUS
      dy = (dy / len) * RADIUS
    }
    joystick.x = dx / RADIUS
    joystick.y = -dy / RADIUS
    joystick.active = true
    setNub({ x: dx, y: dy })
  }

  const reset = () => {
    joystick.x = 0
    joystick.y = 0
    joystick.active = false
    setNub({ x: 0, y: 0 })
  }

  return (
    <div
      ref={base}
      className="joystick"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        update(e)
      }}
      onPointerMove={(e) => joystick.active && update(e)}
      onPointerUp={reset}
      onPointerCancel={reset}
    >
      <div className="joystick-nub" style={{ transform: `translate(${nub.x}px, ${nub.y}px)` }} />
    </div>
  )
}
