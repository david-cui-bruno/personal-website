import { useEffect, useRef } from 'react'
import { ITEMS, PANEL_CONTENT } from '../config/content'
import { useGame } from '../state/store'

export function Panels() {
  const activePanel = useGame((s) => s.activePanel)
  const closePanel = useGame((s) => s.closePanel)
  const closeButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Escape') return
      // first Escape while typing just leaves the field (protects form drafts)
      const el = document.activeElement
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        el.blur()
        return
      }
      closePanel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closePanel])

  // move focus into the dialog when it opens
  useEffect(() => {
    if (activePanel) closeButton.current?.focus()
  }, [activePanel])

  if (!activePanel) return null
  const item = ITEMS.find((i) => i.id === activePanel)
  const content = PANEL_CONTENT[activePanel]
  if (!item || !content) return null

  return (
    <div className="panel-backdrop" onClick={closePanel}>
      <section
        className="panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="panel-heading"
        onClick={(e) => e.stopPropagation()}
      >
        <header>
          <span className="panel-emoji" aria-hidden="true">
            {item.emoji}
          </span>
          <h2 id="panel-heading">{content.heading}</h2>
          <button ref={closeButton} className="panel-close" onClick={closePanel} aria-label="Close panel">
            ✕
          </button>
        </header>
        <div className="panel-body">{content.body}</div>
      </section>
    </div>
  )
}
