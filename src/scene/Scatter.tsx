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
      scatterPoints({ seed: 11, count: 15, minRadius: 6, maxRadius: 22, minHeight: 0.12, maxSlope: 0.9, keepOut: KEEP_OUT }),
    [],
  )
  const grass = useMemo(
    () =>
      scatterPoints({ seed: 7, count: 170, minRadius: 2, maxRadius: 18, minHeight: 1.05, maxSlope: 0.55, keepOut: KEEP_OUT }),
    [],
  )
  const grassA = useMemo(() => new THREE.Color(PALETTE.grass).offsetHSL(0.01, 0.08, 0.13), [])
  const grassB = useMemo(() => new THREE.Color(PALETTE.grass).offsetHSL(-0.01, 0.05, 0.05), [])

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
          const s = 0.6 + p.rand * 0.7
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
    </>
  )
}
