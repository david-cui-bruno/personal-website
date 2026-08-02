// Design system, switchable via URL params for evaluation:
//   ?palette=c1..c4  — cotton-candy color family (ground/water/sunset tints)
//   ?water=a|b1..b4  — water surface style (b* = toon-band variants)
//   ?tree=a..e       — tree design
//   ?cat=a..d        — Bebo colorway
//   ?beacon=a..c     — undiscovered-item beacon style
//   ?time=19.5       — freeze the clock at an hour (0-24); otherwise the
//                      island follows the visitor's local time of day
// Dev params: autostart, cam=x,y,z,tx,ty,tz, hq
//
// NOTE: no `three` imports here — this file loads in the eager UI bundle.

const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()

function pick<T extends string>(key: string, allowed: readonly T[]): T {
  const v = params.get(key)
  return (allowed.includes(v as T) ? v : allowed[0]) as T
}

const timeParam = params.get('time')

export const DESIGN = {
  // first entry = shipped default (David's picks)
  palette: pick('palette', ['c2', 'c1', 'c3', 'c4'] as const),
  water: pick('water', ['b1', 'b2', 'b3', 'b4', 'a'] as const),
  tree: pick('tree', ['a', 'b', 'c', 'd', 'e'] as const),
  cat: pick('cat', ['a', 'b', 'c', 'd'] as const),
  beacon: pick('beacon', ['c', 'a', 'b'] as const),
  /** frozen clock hour for previews, or null to follow real local time */
  time: timeParam !== null && Number.isFinite(Number(timeParam)) ? ((Number(timeParam) % 24) + 24) % 24 : null,
  autostart: params.has('autostart'),
  cam: params.get('cam'),
  lockQuality: params.has('hq'),
}

// ---------------------------------------------------------------------------
// Cotton-candy palettes: time-independent world colors + the sunset signature.
// ---------------------------------------------------------------------------

export interface Palette {
  ground: { sandDry: string; sandWet: string; grass: string; grassDeep: string; underwaterSand: string }
  water: { near: string; far: string }
  flowers: [string, string]
  sunset: { fog: string; sun: string; hemiSky: string }
}

const PALETTES: Record<'c1' | 'c2' | 'c3' | 'c4', Palette> = {
  // c1 — the original cotton candy
  c1: {
    ground: { sandDry: '#f4dcb4', sandWet: '#d9b98a', grass: '#93bb74', grassDeep: '#79a35e', underwaterSand: '#bd9f7d' },
    water: { near: '#74dcd2', far: '#5b7fc7' },
    flowers: ['#fff3f6', '#ffc9dd'],
    sunset: { fog: '#ecb9c9', sun: '#ffb1a0', hemiSky: '#ffd3e0' },
  },
  // c2 — peach lilac: warmer sand, lighter lavender deep water
  c2: {
    ground: { sandDry: '#f6e2bd', sandWet: '#dfc093', grass: '#9cc182', grassDeep: '#82a968', underwaterSand: '#c4a884' },
    water: { near: '#7fe0d2', far: '#6d8fd8' },
    flowers: ['#fff6ef', '#ffd2c9'],
    sunset: { fog: '#f2c3c4', sun: '#ffb8a5', hemiSky: '#ffd9d6' },
  },
  // c3 — berry cream: deeper berry-blue water, magenta-leaning sky
  c3: {
    ground: { sandDry: '#f1d6ae', sandWet: '#d2b184', grass: '#8ab06d', grassDeep: '#6f9757', underwaterSand: '#b89a76' },
    water: { near: '#6bd6cd', far: '#4f6ab5' },
    flowers: ['#fdeef6', '#f3a8cd'],
    sunset: { fog: '#e6a9c6', sun: '#ff9fae', hemiSky: '#f7c2dd' },
  },
  // c4 — pastel milk: everything lighter and milkier
  c4: {
    ground: { sandDry: '#f8e8c9', sandWet: '#e3cba1', grass: '#a5c98e', grassDeep: '#8bb274', underwaterSand: '#cbb38d' },
    water: { near: '#8ce4da', far: '#7ba1d8' },
    flowers: ['#ffffff', '#ffd9e6'],
    sunset: { fog: '#f4cdd6', sun: '#ffc2b3', hemiSky: '#ffe2e8' },
  },
}

export const PALETTE_CHOICE = PALETTES[DESIGN.palette]

// ---------------------------------------------------------------------------
// Time of day: keyframes blended by the (local) clock. Ground/water albedo
// stays constant — the lights, sky, fog, and exposure do the day-turning.
// ---------------------------------------------------------------------------

export interface MoodFrame {
  h: number
  sky: { sun: [number, number, number]; turbidity: number; rayleigh: number; mie: number; g: number }
  sun: { color: string; intensity: number; position: [number, number, number] }
  hemi: { sky: string; ground: string; intensity: number }
  env: number
  fog: { color: string; near: number; far: number }
  exposure: number
  stars: number
}

const P = PALETTES[DESIGN.palette]

const KEYFRAMES: MoodFrame[] = [
  { h: 0.0, sky: { sun: [-30, -8, -60], turbidity: 3, rayleigh: 0.6, mie: 0.003, g: 0.8 }, sun: { color: '#a8bce8', intensity: 1.0, position: [-20, 18, -24] }, hemi: { sky: '#5d6f9e', ground: '#3a3648', intensity: 0.6 }, env: 0.28, fog: { color: '#454e74', near: 28, far: 95 }, exposure: 1.0, stars: 1 },
  { h: 5.0, sky: { sun: [-30, -8, -60], turbidity: 3, rayleigh: 0.6, mie: 0.003, g: 0.8 }, sun: { color: '#a8bce8', intensity: 1.0, position: [-20, 18, -24] }, hemi: { sky: '#5d6f9e', ground: '#3a3648', intensity: 0.6 }, env: 0.28, fog: { color: '#454e74', near: 28, far: 95 }, exposure: 1.0, stars: 1 },
  { h: 6.75, sky: { sun: [70, 3, 40], turbidity: 8, rayleigh: 2.8, mie: 0.012, g: 0.82 }, sun: { color: '#ffb9a0', intensity: 1.6, position: [26, 10, 18] }, hemi: { sky: '#f6cdd4', ground: '#6f6055', intensity: 0.45 }, env: 0.35, fog: { color: '#e8c3c4', near: 31, far: 98 }, exposure: 1.02, stars: 0 },
  { h: 9.5, sky: { sun: [25, 50, -15], turbidity: 3.2, rayleigh: 1.1, mie: 0.004, g: 0.75 }, sun: { color: '#fff0d6', intensity: 2.25, position: [18, 30, -12] }, hemi: { sky: '#dcecf4', ground: '#9a8a70', intensity: 0.45 }, env: 0.4, fog: { color: '#d9e6e8', near: 35, far: 112 }, exposure: 1.02, stars: 0 },
  { h: 16.0, sky: { sun: [25, 50, -15], turbidity: 3.2, rayleigh: 1.1, mie: 0.004, g: 0.75 }, sun: { color: '#fff0d6', intensity: 2.25, position: [18, 30, -12] }, hemi: { sky: '#dcecf4', ground: '#9a8a70', intensity: 0.45 }, env: 0.4, fog: { color: '#d9e6e8', near: 35, far: 112 }, exposure: 1.02, stars: 0 },
  { h: 17.75, sky: { sun: [42, 7, -55], turbidity: 7, rayleigh: 2.4, mie: 0.009, g: 0.85 }, sun: { color: '#ffc48c', intensity: 2.4, position: [24, 13, -27] }, hemi: { sky: '#ffd9b0', ground: '#8d7458', intensity: 0.5 }, env: 0.5, fog: { color: '#f0c1a6', near: 31, far: 103 }, exposure: 1.08, stars: 0 },
  { h: 19.25, sky: { sun: [-55, 4, 70], turbidity: 9.5, rayleigh: 3.2, mie: 0.02, g: 0.82 }, sun: { color: P.sunset.sun, intensity: 2.15, position: [-22, 11, 24] }, hemi: { sky: P.sunset.hemiSky, ground: '#93786a', intensity: 0.5 }, env: 0.5, fog: { color: P.sunset.fog, near: 30, far: 97 }, exposure: 1.06, stars: 0 },
  { h: 20.75, sky: { sun: [-45, 0.5, -70], turbidity: 8, rayleigh: 3.6, mie: 0.012, g: 0.86 }, sun: { color: '#d98ba0', intensity: 1.35, position: [-24, 10, -26] }, hemi: { sky: '#8f7ba6', ground: '#4c4350', intensity: 0.5 }, env: 0.3, fog: { color: '#8a7396', near: 28, far: 92 }, exposure: 1.0, stars: 0.35 },
  { h: 22.25, sky: { sun: [-30, -8, -60], turbidity: 3, rayleigh: 0.6, mie: 0.003, g: 0.8 }, sun: { color: '#a8bce8', intensity: 1.0, position: [-20, 18, -24] }, hemi: { sky: '#5d6f9e', ground: '#3a3648', intensity: 0.6 }, env: 0.28, fog: { color: '#454e74', near: 28, far: 95 }, exposure: 1.0, stars: 1 },
]

// -- tiny color/number lerp helpers (no three.js in this bundle) --

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function lerpHex(a: string, b: string, t: number): string {
  const ca = hexToRgb(a)
  const cb = hexToRgb(b)
  const c = ca.map((v, i) => Math.round(v + (cb[i] - v) * t))
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const lerp3 = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
]

/** Blended mood for an hour of the day (0-24). */
export function moodAtHour(hour: number): MoodFrame {
  const h = ((hour % 24) + 24) % 24
  let a = KEYFRAMES[KEYFRAMES.length - 1]
  let b = KEYFRAMES[0]
  let span = 24 - a.h + b.h
  let t = h >= a.h ? (h - a.h) / span : (h + 24 - a.h) / span
  for (let i = 0; i < KEYFRAMES.length - 1; i++) {
    if (h >= KEYFRAMES[i].h && h < KEYFRAMES[i + 1].h) {
      a = KEYFRAMES[i]
      b = KEYFRAMES[i + 1]
      t = (h - a.h) / (b.h - a.h)
      break
    }
  }
  return {
    h,
    sky: {
      sun: lerp3(a.sky.sun, b.sky.sun, t),
      turbidity: lerp(a.sky.turbidity, b.sky.turbidity, t),
      rayleigh: lerp(a.sky.rayleigh, b.sky.rayleigh, t),
      mie: lerp(a.sky.mie, b.sky.mie, t),
      g: lerp(a.sky.g, b.sky.g, t),
    },
    sun: {
      color: lerpHex(a.sun.color, b.sun.color, t),
      intensity: lerp(a.sun.intensity, b.sun.intensity, t),
      position: lerp3(a.sun.position, b.sun.position, t),
    },
    hemi: {
      sky: lerpHex(a.hemi.sky, b.hemi.sky, t),
      ground: lerpHex(a.hemi.ground, b.hemi.ground, t),
      intensity: lerp(a.hemi.intensity, b.hemi.intensity, t),
    },
    env: lerp(a.env, b.env, t),
    fog: {
      color: lerpHex(a.fog.color, b.fog.color, t),
      near: lerp(a.fog.near, b.fog.near, t),
      far: lerp(a.fog.far, b.fog.far, t),
    },
    exposure: lerp(a.exposure, b.exposure, t),
    stars: lerp(a.stars, b.stars, t),
  }
}

/** Current mood: frozen at ?time=H, or following the visitor's clock. */
export function currentMood(): MoodFrame {
  if (DESIGN.time !== null) return moodAtHour(DESIGN.time)
  const now = new Date()
  return moodAtHour(now.getHours() + now.getMinutes() / 60)
}

// ---------------------------------------------------------------------------
// Water surface styles. b* are the toon-band family.
// ---------------------------------------------------------------------------

export interface WaterStyle {
  fleckLo: number
  fleckHi: number
  fleckScale: number
  opacity: number
  bands: number
  /** 0 = crisp band edges, 1 = fully smooth */
  bandSoft: number
  /** foam contour lines along band boundaries */
  contour: number
  /** extra sparkle glints */
  sparkle: number
}

const WATER_STYLES: Record<'a' | 'b1' | 'b2' | 'b3' | 'b4', WaterStyle> = {
  a: { fleckLo: 0.64, fleckHi: 0.78, fleckScale: 1.0, opacity: 0.93, bands: 0, bandSoft: 0, contour: 0, sparkle: 0 },
  b1: { fleckLo: 0.55, fleckHi: 0.6, fleckScale: 0.65, opacity: 0.96, bands: 3, bandSoft: 0.15, contour: 0, sparkle: 0 },
  b2: { fleckLo: 0.6, fleckHi: 0.68, fleckScale: 1.0, opacity: 0.95, bands: 4, bandSoft: 0.45, contour: 0, sparkle: 0 },
  b3: { fleckLo: 0.5, fleckHi: 0.54, fleckScale: 0.5, opacity: 0.97, bands: 2, bandSoft: 0.08, contour: 1, sparkle: 0 },
  b4: { fleckLo: 0.58, fleckHi: 0.64, fleckScale: 0.75, opacity: 0.96, bands: 3, bandSoft: 0.2, contour: 1, sparkle: 1 },
}

export const WATER_STYLE = WATER_STYLES[DESIGN.water]

// ---------------------------------------------------------------------------
// Tree designs (see PalmTree.tsx for the geometry).
// ---------------------------------------------------------------------------

export type TreeStyle = 'a' | 'b' | 'c' | 'd' | 'e'
export const TREE_STYLE: TreeStyle = DESIGN.tree

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
  a: { base: '#a68d70', stripe: '#63503e', belly: '#f4ecdf', earInner: '#dda49b', nose: '#c76d64', eye: '#3a5a34' },
  b: { base: '#9a9a9e', stripe: '#54545c', belly: '#f0f0ea', earInner: '#d9a1a1', nose: '#b56a6a', eye: '#b5892f' },
  c: { base: '#d99147', stripe: '#a65e2b', belly: '#f6ead8', earInner: '#e8a89a', nose: '#c96a55', eye: '#a8742f' },
  d: { base: '#3d3b40', stripe: '#2b292e', belly: '#f4f2ec', earInner: '#c98f90', nose: '#a86868', eye: '#d1a53c' },
}

export const CAT = CAT_COLORS[DESIGN.cat]
