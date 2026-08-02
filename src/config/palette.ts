import { PALETTE_CHOICE, CAT } from './design'

export const PALETTE = {
  // world colors come from the chosen cotton-candy palette (design.ts)
  sandDry: PALETTE_CHOICE.ground.sandDry,
  sandWet: PALETTE_CHOICE.ground.sandWet,
  grass: PALETTE_CHOICE.ground.grass,
  grassDeep: PALETTE_CHOICE.ground.grassDeep,
  underwaterSand: PALETTE_CHOICE.ground.underwaterSand,
  waterNear: PALETTE_CHOICE.water.near,
  waterFar: PALETTE_CHOICE.water.far,
  foam: '#fff6e8',
  flowerA: PALETTE_CHOICE.flowers[0],
  flowerB: PALETTE_CHOICE.flowers[1],

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
