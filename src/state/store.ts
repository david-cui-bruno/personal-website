import { create } from 'zustand'
import { isMuted, setMuted } from '../lib/audio'

const STORAGE_KEY = 'davids-island-discovered-v1'

function loadDiscovered(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

interface GameState {
  started: boolean
  /** id of the item the cat is standing near, if any */
  nearItemId: string | null
  /** id of the open overlay panel, if any */
  activePanel: string | null
  discovered: string[]
  toast: string | null
  /** transient helper text shown in the prompt slot (e.g. "walk closer") */
  hint: string | null
  /** 1 = full quality, 0 = degraded (mobile / weak GPU) */
  quality: number
  muted: boolean
  start: () => void
  setNearItem: (id: string | null) => void
  openPanel: (id: string) => void
  closePanel: () => void
  clearToast: () => void
  setHint: (h: string | null) => void
  setQuality: (q: number) => void
  toggleMuted: () => void
}

export const useGame = create<GameState>((set, get) => ({
  started: false,
  nearItemId: null,
  activePanel: null,
  discovered: loadDiscovered(),
  toast: null,
  hint: null,
  quality: typeof window !== 'undefined' && matchMedia('(pointer: coarse)').matches ? 0 : 1,
  muted: typeof window !== 'undefined' ? isMuted() : false,
  start: () => set({ started: true }),
  toggleMuted: () => {
    const next = !get().muted
    setMuted(next)
    set({ muted: next })
  },
  setNearItem: (id) => {
    if (get().nearItemId !== id) set({ nearItemId: id })
  },
  openPanel: (id) => {
    const { discovered } = get()
    const isNew = !discovered.includes(id)
    const next = isNew ? [...discovered, id] : discovered
    if (isNew) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        /* private mode */
      }
    }
    // the canvas never gets a pointer-leave once the overlay covers it
    document.body.style.cursor = 'auto'
    set({ activePanel: id, discovered: next, toast: isNew ? id : null, hint: null })
  },
  closePanel: () => set({ activePanel: null }),
  clearToast: () => set({ toast: null }),
  setHint: (h) => set({ hint: h }),
  setQuality: (q) => set({ quality: q }),
}))

// High-frequency values live outside React state (written/read every frame).
// Plain object, not a THREE.Vector3 — importing three here would pull the whole
// engine into the eagerly-loaded UI bundle.
export const catPosition = { x: 0, y: 0, z: 22 }
export const joystick = { x: 0, y: 0, active: false }

// Handy for driving the game from the console / test scripts.
if (import.meta.env.DEV && typeof window !== 'undefined') {
  const w = window as unknown as Record<string, unknown>
  w.__game = useGame
  w.__cat = catPosition
}
