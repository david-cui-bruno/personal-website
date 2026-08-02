import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { terrainHeight } from '../lib/terrain'
import { PALETTE } from '../config/palette'
import { PALM_STYLE } from '../config/design'

// trunk segments: stacked, curving cylinders
const TRUNK = [
  { x: 0.0, y: 0.0, rotZ: 0.04, r: 0.17 },
  { x: 0.04, y: 0.46, rotZ: 0.09, r: 0.16 },
  { x: 0.12, y: 0.92, rotZ: 0.14, r: 0.145 },
  { x: 0.24, y: 1.38, rotZ: 0.2, r: 0.13 },
  { x: 0.4, y: 1.82, rotZ: 0.26, r: 0.12 },
  { x: 0.58, y: 2.24, rotZ: 0.32, r: 0.11 },
]

const S = PALM_STYLE

function Frond({ angle, droop }: { angle: number; droop: number }) {
  return (
    <group rotation-y={angle} rotation-x={-0.22 - droop * 0.15 - S.droop} scale={[S.width, 1, S.length]}>
      <mesh castShadow position={[0, 0, 0.44]}>
        <boxGeometry args={[0.24, 0.035, 0.88]} />
        <meshStandardMaterial color={S.frondColor} flatShading />
      </mesh>
      <group position={[0, 0, 0.86]} rotation-x={-0.38 - droop * 0.1 - S.droop * 0.5}>
        <mesh castShadow position={[0, 0, 0.3]}>
          <boxGeometry args={[0.18, 0.03, 0.6]} />
          <meshStandardMaterial color={S.frondColor} flatShading />
        </mesh>
        <group position={[0, 0, 0.58]} rotation-x={-0.45}>
          <mesh castShadow position={[0, 0, 0.2]}>
            <boxGeometry args={[0.11, 0.025, 0.4]} />
            <meshStandardMaterial color={S.frondColor} flatShading />
          </mesh>
        </group>
      </group>
    </group>
  )
}

export function PalmTree({
  x,
  z,
  scale = 1,
  rotY = 0,
  swayPhase = 0,
}: {
  x: number
  z: number
  scale?: number
  rotY?: number
  swayPhase?: number
}) {
  const crown = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!crown.current) return
    const t = state.clock.elapsedTime
    crown.current.rotation.z = Math.sin(t * 0.85 + swayPhase) * 0.045
    crown.current.rotation.x = Math.cos(t * 0.7 + swayPhase) * 0.03
  })

  return (
    <group position={[x, terrainHeight(x, z) - 0.08, z]} scale={[scale, scale * S.height, scale]} rotation-y={rotY}>
      {TRUNK.map((s, i) => (
        <mesh key={i} castShadow position={[s.x, s.y + 0.24, 0]} rotation-z={s.rotZ}>
          <cylinderGeometry args={[s.r * 0.88, s.r, 0.5, 5]} />
          <meshStandardMaterial color={PALETTE.palmTrunk} flatShading />
        </mesh>
      ))}
      <group ref={crown} position={[0.68, 2.76, 0]} scale={1 / Math.sqrt(S.height)}>
        {/* leafy core hides the frond roots */}
        <mesh castShadow scale={S.coreScale}>
          <icosahedronGeometry args={[0.24, 0]} />
          <meshStandardMaterial color={S.frondColor} flatShading />
        </mesh>
        {Array.from({ length: S.fronds }, (_, i) => (
          <Frond key={i} angle={(i / S.fronds) * Math.PI * 2 + 0.3} droop={i % 2} />
        ))}
        {Array.from({ length: S.coconuts }, (_, i) => (
          <mesh key={i} castShadow position={[[0.14, -0.12, 0.02, -0.03][i] ?? 0, -0.16, i * 0.13 - 0.14]}>
            <icosahedronGeometry args={[0.11, 0]} />
            <meshStandardMaterial color={PALETTE.woodDark} flatShading />
          </mesh>
        ))}
      </group>
    </group>
  )
}
