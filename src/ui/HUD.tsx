import { useEffect, useState } from 'react'
import { ITEMS } from '../config/content'
import { useGame } from '../state/store'

const isTouch = typeof window !== 'undefined' && matchMedia('(pointer: coarse)').matches
// keep in sync with the `toast` CSS animation duration in styles.css
const TOAST_MS = 3200

export function HUD() {
  const started = useGame((s) => s.started)
  const nearItemId = useGame((s) => s.nearItemId)
  const activePanel = useGame((s) => s.activePanel)
  const discovered = useGame((s) => s.discovered)
  const toast = useGame((s) => s.toast)
  const hint = useGame((s) => s.hint)
  const openPanel = useGame((s) => s.openPanel)
  const clearToast = useGame((s) => s.clearToast)
  const setHint = useGame((s) => s.setHint)
  const muted = useGame((s) => s.muted)
  const toggleMuted = useGame((s) => s.toggleMuted)
  // controls reminder for people who insta-dismissed the intro
  const [showControls, setShowControls] = useState(!isTouch)

  // E to interact
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'KeyE') return
      const { nearItemId: near, activePanel: open } = useGame.getState()
      if (near && !open) useGame.getState().openPanel(near)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(clearToast, TOAST_MS)
    return () => clearTimeout(id)
  }, [toast, clearToast])

  // transient "walk closer" hint auto-clears
  useEffect(() => {
    if (!hint) return
    const id = setTimeout(() => setHint(null), 2000)
    return () => clearTimeout(id)
  }, [hint, setHint])

  // hide the controls reminder on first movement key, or after 9s
  useEffect(() => {
    if (!started || !showControls) return
    const done = () => setShowControls(false)
    const onKey = (e: KeyboardEvent) => {
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) done()
    }
    const id = setTimeout(done, 9000)
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(id)
      window.removeEventListener('keydown', onKey)
    }
  }, [started, showControls])

  if (!started) return null

  const nearItem = ITEMS.find((i) => i.id === nearItemId)
  const toastItem = ITEMS.find((i) => i.id === toast)

  return (
    <>
      <div className="hud-title">
        <h1>David Cui</h1>
        <p>somewhere in the Pacific</p>
      </div>

      <div
        className="hud-progress"
        role="status"
        aria-label={`${discovered.length} of ${ITEMS.length} things discovered`}
      >
        {ITEMS.map((i) => (
          <span key={i.id} aria-hidden="true" className={discovered.includes(i.id) ? 'found' : 'lost'}>
            {i.emoji}
          </span>
        ))}
        <b>
          {discovered.length}/{ITEMS.length}
        </b>
      </div>

      <button
        className="hud-mute"
        onClick={toggleMuted}
        aria-label={muted ? 'Unmute sound' : 'Mute sound'}
        aria-pressed={muted}
      >
        {muted ? '🔇' : '🔊'}
      </button>

      {hint && !activePanel && <div className="hud-prompt">{hint}</div>}
      {!hint && nearItem && !activePanel && !isTouch && (
        <div className="hud-prompt">
          Press <kbd>E</kbd> — {nearItem.title}
        </div>
      )}
      {!hint && nearItem && !activePanel && isTouch && (
        <button className="hud-interact" onClick={() => openPanel(nearItem.id)} aria-label={`Open ${nearItem.title}`}>
          {nearItem.emoji} open
        </button>
      )}
      {!hint && !nearItem && !activePanel && showControls && (
        <div className="hud-prompt">WASD to walk · drag to look · shift to trot</div>
      )}

      {toastItem && (
        <div className="hud-toast" key={toastItem.id}>
          {toastItem.emoji} Discovered: <b>{toastItem.title}</b>
        </div>
      )}
    </>
  )
}
