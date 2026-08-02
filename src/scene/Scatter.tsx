import { useMemo } from 'react'
import * as THREE from 'three'
import { Instances, Instance } from '@react-three/drei'
import { scatterPoints } from '../lib/terrain'
import { ITEMS, PALMS } from '../config/content'
import { PALETTE } from '../config/palette'

const KEEP_OUT = [
  ...ITEMS.map((i) => ({ x: i.position[0], z: i.position[1], r: 2.6 })),
  ...PALMS.map((p) => ({ x: p.x, z: p.z, r: 1.6 })),
]

export function Scatter() {
  const rocks = useMemo(
    () =>
      scatterPoints({ seed: 11, count: 14, minRadius: 5, maxRadius: 18, minHeight: 0.12, maxSlope: 0.95, keepOut: KEEP_OUT }),
    [],
  )
  const grass = useMemo(
    () =>
      scatterPoints({ seed: 7, count: 240, minRadius: 1.6, maxRadius: 15, minHeight: 1.0, maxSlope: 0.6, keepOut: KEEP_OUT }),
    [],
  )
  const flowers = useMemo(
    () =>
      scatterPoints({ seed: 23, count: 42, minRadius: 2, maxRadius: 13, minHeight: 1.15, maxSlope: 0.5, keepOut: KEEP_OUT }),
    [],
  )
  const grassA = useMemo(() => new THREE.Color(PALETTE.grass).offsetHSL(0.01, 0.08, 0.13), [])
  const grassB = useMemo(() => new THREE.Color(PALETTE.grass).offsetHSL(-0.01, 0.05, 0.05), [])
  const flowerA = useMemo(() => new THREE.Color(PALETTE.flowerA), [])
  const flowerB = useMemo(() => new THREE.Color(PALETTE.flowerB), [])

  return (
    <>
      <Instances limit={rocks.length} castShadow receiveShadow>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color={PALETTE.rock} flatShading roughness={0.9} />
        {rocks.map((p, i) => {
          const s = 0.18 + p.rand * 0.55
          return (
            <Instance
              key={i}
              position={[p.x, p.y + s * 0.25, p.z]}
              scale={[s, s * 0.72, s]}
              rotation={[p.rand * 2, p.rand * 6.28, p.rand]}
            />
          )
        })}
      </Instances>

      <Instances limit={grass.length} castShadow>
        <coneGeometry args={[0.12, 0.22, 5]} />
        <meshStandardMaterial flatShading roughness={0.9} />
        {grass.map((p, i) => {
          const s = 0.55 + p.rand * 0.75
          return (
            <Instance
              key={i}
              position={[p.x, p.y + 0.08 * s, p.z]}
              scale={[s, s * (0.9 + p.rand * 0.6), s]}
              rotation={[0, p.rand * 6.28, (p.rand - 0.5) * 0.18]}
              color={p.rand > 0.5 ? grassA : grassB}
            />
          )
        })}
      </Instances>

      {/* tiny meadow flowers — cotton-candy confetti */}
      <Instances limit={flowers.length}>
        <octahedronGeometry args={[0.055, 0]} />
        <meshStandardMaterial flatShading roughness={0.7} />
        {flowers.map((p, i) => (
          <Instance
            key={i}
            position={[p.x, p.y + 0.09, p.z]}
            scale={[1, 0.55, 1]}
            rotation={[0, p.rand * 6.28, 0]}
            color={p.rand > 0.5 ? flowerA : flowerB}
          />
        ))}
      </Instances>
    </>
  )
}
