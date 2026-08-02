// The island is an analytic heightfield: the same function builds the terrain
// mesh, clamps the cat to the ground, and places items/props. No raycasts needed.

export const WATER_LEVEL = 0
export const ISLAND_RADIUS = 24.5 // dome reaches 0 height around r≈19.3
export const WALKABLE_MIN_HEIGHT = -0.05 // paws may get slightly wet

function hash(ix: number, iz: number): number {
  let h = (ix * 374761393 + iz * 668265263) | 0
  h = ((h ^ (h >> 13)) * 1274126177) | 0
  return ((h ^ (h >> 16)) >>> 0) / 4294967295
}

function smooth(t: number) {
  return t * t * (3 - 2 * t)
}

export function valueNoise(x: number, z: number): number {
  const ix = Math.floor(x)
  const iz = Math.floor(z)
  const fx = x - ix
  const fz = z - iz
  const a = hash(ix, iz)
  const b = hash(ix + 1, iz)
  const c = hash(ix, iz + 1)
  const d = hash(ix + 1, iz + 1)
  const u = smooth(fx)
  const v = smooth(fz)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

function fbm(x: number, z: number): number {
  return valueNoise(x, z) * 0.65 + valueNoise(x * 2.13 + 7.7, z * 2.13 - 3.1) * 0.35
}

export function terrainHeight(x: number, z: number): number {
  const r = Math.hypot(x, z) / ISLAND_RADIUS
  // main dome, dips to -0.9 offshore and keeps falling on the skirt
  const dome = Math.pow(Math.max(0, 1 - r * r), 1.6) * 4.0 - 0.9
  // the dune the hero palm stands on
  const dune = Math.exp(-((x - 5.7) ** 2 + (z + 4.1) ** 2) / 13) * 1.45
  // gentle rolling variation, fading out toward the water
  const n = (fbm(x * 0.11 + 3.7, z * 0.11 - 1.3) - 0.5) * 1.6 * Math.max(0, 1 - r)
  // deepen far offshore so the water gets a real deep-color zone
  const abyss = -Math.max(0, r - 1) * 2.4
  return dome + dune + n + abyss
}

export function terrainSlope(x: number, z: number): number {
  const e = 0.35
  const dx = terrainHeight(x + e, z) - terrainHeight(x - e, z)
  const dz = terrainHeight(x, z + e) - terrainHeight(x, z - e)
  return Math.hypot(dx, dz) / (2 * e)
}

// Deterministic scatter helper (no Math.random — same island every visit).
export function scatterPoints(opts: {
  seed: number
  count: number
  minRadius: number
  maxRadius: number
  minHeight?: number
  maxSlope?: number
  keepOut?: { x: number; z: number; r: number }[]
}): { x: number; z: number; y: number; rand: number }[] {
  const pts: { x: number; z: number; y: number; rand: number }[] = []
  const { seed, count, minRadius, maxRadius, minHeight = 0.25, maxSlope = 0.5, keepOut = [] } = opts
  let i = 0
  let attempts = 0
  while (pts.length < count && attempts < count * 40) {
    attempts++
    const a = hash(seed + i, attempts) * Math.PI * 2
    const rr = minRadius + hash(attempts, seed - i) * (maxRadius - minRadius)
    const x = Math.cos(a) * rr
    const z = Math.sin(a) * rr
    i++
    const y = terrainHeight(x, z)
    if (y < minHeight) continue
    if (terrainSlope(x, z) > maxSlope) continue
    if (keepOut.some((k) => Math.hypot(x - k.x, z - k.z) < k.r)) continue
    pts.push({ x, z, y, rand: hash(attempts * 31, seed * 17) })
  }
  return pts
}
