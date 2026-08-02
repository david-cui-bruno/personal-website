import { create } from 'zustand'

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
  /** 1 = full quality, 0 = degraded (mobile / weak GPU) */
  quality: number
  start: () => void
  setNearItem: (id: string | null) => void
  openPanel: (id: string) => void
  closePanel: () => void
  clearToast: () => void
  setQuality: (q: number) => void
}

export const useGame = create<GameState>((set, get) => ({
  started: false,
  nearItemId: null,
  activePanel: null,
  discovered: loadDiscovered(),
  toast: null,
  quality: typeof window !== 'undefined' && matchMedia('(pointer: coarse)').matches ? 0 : 1,
  start: () => set({ started: true }),
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
    set({ activePanel: id, discovered: next, toast: isNew ? id : null })
  },
  closePanel: () => set({ activePanel: null }),
  clearToast: () => set({ toast: null }),
  setQuality: (q) => set({ quality: q }),
}))

// Handy for driving the game from the console / test scripts.
if (import.meta.env.DEV && typeof window !== 'undefined') {
  ;(window as unknown as Record<string, unknown>).__game = useGame
}

// High-frequency values live outside React state (written/read every frame).
// Plain object, not a THREE.Vector3 — importing three here would pull the whole
// engine into the eagerly-loaded UI bundle.
export const catPosition = { x: 0, y: 0, z: 22 }
export const joystick = { x: 0, y: 0, active: false }
