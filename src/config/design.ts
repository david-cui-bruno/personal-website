// Design variants, switchable via URL params so options can be compared in-engine:
//   ?mood=b&water=c&palm=b&cat=c&beacon=a
// Defaults (all 'a') are the shipped look. Extra dev params:
//   autostart  — skip the intro (screenshot harness)
//   cam=x,y,z,tx,ty,tz — fixed camera, disables follow-cam
//   hq — lock quality high (no PerformanceMonitor degrade in headless renders)

const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()

function pick<T extends string>(key: string, allowed: readonly T[]): T {
  const v = params.get(key)
  return (allowed.includes(v as T) ? v : allowed[0]) as T
}

export const DESIGN = {
  mood: pick('mood', ['a', 'b', 'c', 'd'] as const),
  water: pick('water', ['a', 'b', 'c'] as const),
  palm: pick('palm', ['a', 'b', 'c'] as const),
  cat: pick('cat', ['a', 'b', 'c', 'd'] as const),
  beacon: pick('beacon', ['a', 'b', 'c'] as const),
  autostart: params.has('autostart'),
  cam: params.get('cam'),
  lockQuality: params.has('hq'),
}

// ---------------------------------------------------------------------------
// Moods: sky + light + fog + water color + ground palette, as one package.
// ---------------------------------------------------------------------------

export interface Mood {
  sky: { sunPosition: [number, number, number]; turbidity: number; rayleigh: number; mieCoefficient: number; mieDirectionalG: number }
  fog: { color: string; near: number; far: number }
  sun: { color: string; intensity: number; position: [number, number, number] }
  hemi: { sky: string; ground: string; intensity: number }
  envIntensity: number
  exposure: number
  water: { near: string; far: string }
  ground: { sandDry: string; sandWet: string; grass: string; grassDeep: string; underwaterSand: string }
}

const MOODS: Record<'a' | 'b' | 'c' | 'd', Mood> = {
  // A — golden hour (the current look)
  a: {
    sky: { sunPosition: [45, 5, -60], turbidity: 7.5, rayleigh: 2.6, mieCoefficient: 0.008, mieDirectionalG: 0.85 },
    fog: { color: '#f2bd8d', near: 45, far: 150 },
    sun: { color: '#ffc98f', intensity: 2.6, position: [26, 14, -30] },
    hemi: { sky: '#ffd7a8', ground: '#9a7c58', intensity: 0.5 },
    envIntensity: 0.55,
    exposure: 1.12,
    water: { near: '#5ed3c4', far: '#1e7f9e' },
    ground: { sandDry: '#e9d29c', sandWet: '#c9ad76', grass: '#88b060', grassDeep: '#6d9a4e', underwaterSand: '#b3986b' },
  },
  // B — high noon: postcard blues, vivid turquoise, crisp light
  b: {
    sky: { sunPosition: [30, 55, 10], turbidity: 2, rayleigh: 0.5, mieCoefficient: 0.003, mieDirectionalG: 0.7 },
    fog: { color: '#cfe4ec', near: 50, far: 165 },
    sun: { color: '#fff2dc', intensity: 2.3, position: [20, 32, -14] },
    hemi: { sky: '#dff2ff', ground: '#a08a67', intensity: 0.45 },
    envIntensity: 0.4,
    exposure: 1.0,
    water: { near: '#46d7c8', far: '#1e93c4' },
    ground: { sandDry: '#f1e0ab', sandWet: '#d3ba85', grass: '#7fbe5f', grassDeep: '#63a34a', underwaterSand: '#b7a071' },
  },
  // C — cotton-candy sunset: pink sky, lavender-blue deep water
  c: {
    sky: { sunPosition: [-60, 4, 80], turbidity: 10, rayleigh: 3.4, mieCoefficient: 0.02, mieDirectionalG: 0.82 },
    fog: { color: '#ecb9c9', near: 45, far: 140 },
    sun: { color: '#ffb1a0', intensity: 2.2, position: [-24, 12, 26] },
    hemi: { sky: '#ffd3e0', ground: '#9a7c6a', intensity: 0.5 },
    envIntensity: 0.55,
    exposure: 1.08,
    water: { near: '#74dcd2', far: '#5b7fc7' },
    ground: { sandDry: '#f4dcb4', sandWet: '#d9b98a', grass: '#93bb74', grassDeep: '#79a35e', underwaterSand: '#bd9f7d' },
  },
  // D — dusk ember: deep warm twilight, fire and beacons glow
  d: {
    sky: { sunPosition: [-50, 1.5, -80], turbidity: 9, rayleigh: 4, mieCoefficient: 0.015, mieDirectionalG: 0.88 },
    fog: { color: '#8a5f70', near: 40, far: 130 },
    sun: { color: '#ff8f5e', intensity: 1.7, position: [-28, 9, -30] },
    hemi: { sky: '#b78bb0', ground: '#5f4a44', intensity: 0.4 },
    envIntensity: 0.4,
    exposure: 0.98,
    water: { near: '#37a49b', far: '#1d4a72' },
    ground: { sandDry: '#d9b98d', sandWet: '#b39468', grass: '#6f9757', grassDeep: '#57814a', underwaterSand: '#97815f' },
  },
}

export const MOOD = MOODS[DESIGN.mood]

// ---------------------------------------------------------------------------
// Water surface styles (colors come from the mood).
// ---------------------------------------------------------------------------

export interface WaterStyle {
  fleckLo: number
  fleckHi: number
  fleckScale: number
  opacity: number
  /** 0 = smooth gradient, N = posterized color bands */
  bands: number
}

const WATER_STYLES: Record<'a' | 'b' | 'c', WaterStyle> = {
  a: { fleckLo: 0.64, fleckHi: 0.78, fleckScale: 1.0, opacity: 0.93, bands: 0 }, // soft gradient (current)
  b: { fleckLo: 0.55, fleckHi: 0.6, fleckScale: 0.65, opacity: 0.96, bands: 3 }, // toon bands, bold foam
  c: { fleckLo: 0.75, fleckHi: 0.87, fleckScale: 1.4, opacity: 0.84, bands: 0 }, // glassy calm
}

export const WATER_STYLE = WATER_STYLES[DESIGN.water]

// ---------------------------------------------------------------------------
// Palm styles.
// ---------------------------------------------------------------------------

export interface PalmStyle {
  fronds: number
  /** frond length multiplier */
  length: number
  /** frond width multiplier */
  width: number
  /** extra droop (radians) added to every frond */
  droop: number
  /** whole-tree height multiplier */
  height: number
  frondColor: string
  coconuts: number
  coreScale: number
}

const PALM_STYLES: Record<'a' | 'b' | 'c', PalmStyle> = {
  a: { fronds: 9, length: 1, width: 1, droop: 0, height: 1, frondColor: '#6cae52', coconuts: 3, coreScale: 1 }, // current
  b: { fronds: 13, length: 1.22, width: 1.15, droop: 0.17, height: 1.02, frondColor: '#569b45', coconuts: 4, coreScale: 1.35 }, // lush
  c: { fronds: 7, length: 1.3, width: 0.7, droop: -0.07, height: 1.14, frondColor: '#82c25f', coconuts: 2, coreScale: 0.9 }, // breezy
}

export const PALM_STYLE = PALM_STYLES[DESIGN.palm]

// ---------------------------------------------------------------------------
// Bebo colorways.
// ---------------------------------------------------------------------------

export interface CatColors {
  base: string
  stripe: string
  belly: string
  earInner: string
  nose: string
  eye: string
}

const CAT_COLORS: Record<'a' | 'b' | 'c' | 'd', CatColors> = {
  a: { base: '#a68d70', stripe: '#63503e', belly: '#f4ecdf', earInner: '#dda49b', nose: '#c76d64', eye: '#3a5a34' }, // brown tabby (current)
  b: { base: '#9a9a9e', stripe: '#54545c', belly: '#f0f0ea', earInner: '#d9a1a1', nose: '#b56a6a', eye: '#b5892f' }, // grey tabby
  c: { base: '#d99147', stripe: '#a65e2b', belly: '#f6ead8', earInner: '#e8a89a', nose: '#c96a55', eye: '#a8742f' }, // orange tabby
  d: { base: '#3d3b40', stripe: '#2b292e', belly: '#f4f2ec', earInner: '#c98f90', nose: '#a86868', eye: '#d1a53c' }, // tuxedo black
}

export const CAT = CAT_COLORS[DESIGN.cat]
