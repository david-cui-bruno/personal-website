import { useEffect } from 'react'
import { ITEMS, PANEL_CONTENT } from '../config/content'
import { useGame } from '../state/store'

export function Panels() {
  const activePanel = useGame((s) => s.activePanel)
  const closePanel = useGame((s) => s.closePanel)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') closePanel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closePanel])

  if (!activePanel) return null
  const item = ITEMS.find((i) => i.id === activePanel)
  const content = PANEL_CONTENT[activePanel]
  if (!item || !content) return null

  return (
    <div className="panel-backdrop" onClick={closePanel}>
      <section className="panel" onClick={(e) => e.stopPropagation()}>
        <header>
          <span className="panel-emoji">{item.emoji}</span>
          <h2>{content.heading}</h2>
          <button className="panel-close" onClick={closePanel} aria-label="close">
            ✕
          </button>
        </header>
        <div className="panel-body">{content.body}</div>
      </section>
    </div>
  )
}
