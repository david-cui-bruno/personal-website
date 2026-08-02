import { MOOD, CAT } from './design'

export const PALETTE = {
  // world colors come from the active mood preset (see design.ts)
  sandDry: MOOD.ground.sandDry,
  sandWet: MOOD.ground.sandWet,
  grass: MOOD.ground.grass,
  grassDeep: MOOD.ground.grassDeep,
  underwaterSand: MOOD.ground.underwaterSand,
  waterNear: MOOD.water.near,
  waterFar: MOOD.water.far,
  foam: '#fff6e8',
  fogColor: MOOD.fog.color,
  sunLight: MOOD.sun.color,

  // props
  palmTrunk: '#96653c',
  palmFrond: '#6cae52',
  wood: '#7a4f2c',
  woodDark: '#5c3a1e',
  gold: '#f0b840',
  rock: '#9b9284',
} as const

// Bebo, David's tabby. The active colorway comes from design.ts (?cat=a|b|c|d).
export const TABBY = CAT
