import { useEffect } from 'react'
import { ITEMS } from '../config/content'
import { useGame } from '../state/store'

const isTouch = typeof window !== 'undefined' && matchMedia('(pointer: coarse)').matches

export function HUD() {
  const started = useGame((s) => s.started)
  const nearItemId = useGame((s) => s.nearItemId)
  const activePanel = useGame((s) => s.activePanel)
  const discovered = useGame((s) => s.discovered)
  const toast = useGame((s) => s.toast)
  const openPanel = useGame((s) => s.openPanel)
  const clearToast = useGame((s) => s.clearToast)
  const muted = useGame((s) => s.muted)
  const toggleMuted = useGame((s) => s.toggleMuted)

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
    const id = setTimeout(clearToast, 2600)
    return () => clearTimeout(id)
  }, [toast, clearToast])

  if (!started) return null

  const nearItem = ITEMS.find((i) => i.id === nearItemId)
  const toastItem = ITEMS.find((i) => i.id === toast)

  return (
    <>
      <div className="hud-title">
        <h1>David Cui</h1>
        <p>somewhere in the Pacific</p>
      </div>

      <div className="hud-progress" title="things discovered">
        {ITEMS.map((i) => (
          <span key={i.id} className={discovered.includes(i.id) ? 'found' : 'lost'}>
            {i.emoji}
          </span>
        ))}
        <b>
          {discovered.length}/{ITEMS.length}
        </b>
      </div>

      <button className="hud-mute" onClick={toggleMuted} title={muted ? 'unmute' : 'mute'}>
        {muted ? '🔇' : '🔊'}
      </button>

      {nearItem && !activePanel && !isTouch && (
        <div className="hud-prompt">
          Press <kbd>E</kbd> — {nearItem.title}
        </div>
      )}
      {nearItem && !activePanel && isTouch && (
        <button className="hud-interact" onClick={() => openPanel(nearItem.id)}>
          {nearItem.emoji} open
        </button>
      )}

      {toastItem && (
        <div className="hud-toast" key={toastItem.id}>
          {toastItem.emoji} Discovered: <b>{toastItem.title}</b>
        </div>
      )}
    </>
  )
}
