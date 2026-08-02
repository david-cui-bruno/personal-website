import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { terrainHeight } from '../lib/terrain'
import { PALETTE } from '../config/palette'
import { TREE_STYLE } from '../config/design'

// Five tree designs, selected via ?tree=a..e (design.ts):
//  a Classic palm · b Layered lush palm · c Fan palm · d Round-canopy tree ·
//  e Leaning coconut palm

interface TreeProps {
  x: number
  z: number
  scale?: number
  rotY?: number
  swayPhase?: number
}

// trunk segments follow an accumulated curve so they stay connected at any
// lean; returns the exact top point so crowns can sit on it
function buildTrunk(lean: number, height: number) {
  const segLen = 0.5 * height
  const segs: { x: number; y: number; rotZ: number; r: number }[] = []
  let ex = 0
  let ey = 0
  for (let i = 0; i < 6; i++) {
    const theta = (0.04 + i * 0.056) * lean
    const dx = Math.sin(theta)
    const dy = Math.cos(theta)
    segs.push({ x: ex + dx * segLen * 0.5, y: ey + dy * segLen * 0.5, rotZ: -theta, r: 0.17 - i * 0.012 })
    ex += dx * segLen
    ey += dy * segLen
  }
  return { segs, top: { x: ex, y: ey } }
}

function Trunk({ segs, color = PALETTE.palmTrunk }: { segs: ReturnType<typeof buildTrunk>['segs']; color?: string }) {
  return (
    <>
      {segs.map((s, i) => (
        <mesh key={i} castShadow position={[s.x, s.y, 0]} rotation-z={s.rotZ}>
          <cylinderGeometry args={[s.r * 0.88, s.r, 0.52, 5]} />
          <meshStandardMaterial color={color} flatShading />
        </mesh>
      ))}
    </>
  )
}

function Frond({
  angle,
  droop,
  length = 1,
  width = 1,
  color,
}: {
  angle: number
  droop: number
  length?: number
  width?: number
  color: string
}) {
  return (
    <group rotation-y={angle} rotation-x={-0.22 - droop} scale={[width, 1, length]}>
      <mesh castShadow position={[0, 0, 0.44]}>
        <boxGeometry args={[0.24, 0.035, 0.88]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
      <group position={[0, 0, 0.86]} rotation-x={-0.38 - droop * 0.55}>
        <mesh castShadow position={[0, 0, 0.3]}>
          <boxGeometry args={[0.18, 0.03, 0.6]} />
          <meshStandardMaterial color={color} flatShading />
        </mesh>
        <group position={[0, 0, 0.58]} rotation-x={-0.45}>
          <mesh castShadow position={[0, 0, 0.2]}>
            <boxGeometry args={[0.11, 0.025, 0.4]} />
            <meshStandardMaterial color={color} flatShading />
          </mesh>
        </group>
      </group>
    </group>
  )
}

function Coconuts({ count, color = PALETTE.woodDark }: { count: number; color?: string }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <mesh key={i} castShadow position={[[0.14, -0.12, 0.02, -0.03][i] ?? 0, -0.16, i * 0.13 - 0.14]}>
          <icosahedronGeometry args={[0.11, 0]} />
          <meshStandardMaterial color={color} flatShading />
        </mesh>
      ))}
    </>
  )
}

function LeafBlob({ pos, r, color }: { pos: [number, number, number]; r: number; color: string }) {
  return (
    <mesh castShadow position={pos}>
      <icosahedronGeometry args={[r, 0]} />
      <meshStandardMaterial color={color} flatShading />
    </mesh>
  )
}

const LEANS: Record<string, [number, number]> = {
  a: [1, 1],
  b: [1, 1],
  c: [0.55, 1.1],
  d: [0.4, 0.9],
  e: [1.9, 1.05],
}

export function PalmTree({ x, z, scale = 1, rotY = 0, swayPhase = 0 }: TreeProps) {
  const crown = useRef<THREE.Group>(null)
  const [lean, height] = LEANS[TREE_STYLE]
  const trunk = useMemo(() => buildTrunk(lean, height), [lean, height])

  useFrame((state) => {
    if (!crown.current) return
    const t = state.clock.elapsedTime
    crown.current.rotation.z = Math.sin(t * 0.85 + swayPhase) * 0.045
    crown.current.rotation.x = Math.cos(t * 0.7 + swayPhase) * 0.03
  })

  const g = '#6cae52' // classic frond green
  const top: [number, number, number] = [trunk.top.x, trunk.top.y, 0]

  return (
    <group position={[x, terrainHeight(x, z) - 0.08, z]} scale={scale} rotation-y={rotY}>
      <Trunk segs={trunk.segs} color={TREE_STYLE === 'd' ? '#8a5f3a' : PALETTE.palmTrunk} />

      {TREE_STYLE === 'a' && (
        <group ref={crown} position={top}>
          <mesh castShadow>
            <icosahedronGeometry args={[0.24, 0]} />
            <meshStandardMaterial color={g} flatShading />
          </mesh>
          {Array.from({ length: 9 }, (_, i) => (
            <Frond key={i} angle={(i / 9) * Math.PI * 2 + 0.3} droop={(i % 2) * 0.15} color={g} />
          ))}
          <Coconuts count={3} />
        </group>
      )}

      {TREE_STYLE === 'b' && (
        <group ref={crown} position={top}>
          <mesh castShadow scale={1.3}>
            <icosahedronGeometry args={[0.24, 0]} />
            <meshStandardMaterial color="#569b45" flatShading />
          </mesh>
          {/* lower tier: long droopers */}
          {Array.from({ length: 9 }, (_, i) => (
            <Frond key={`lo${i}`} angle={(i / 9) * Math.PI * 2 + 0.3} droop={0.32 + (i % 2) * 0.1} length={1.28} width={1.15} color="#569b45" />
          ))}
          {/* upper tier: short upswept */}
          <group position={[0, 0.14, 0]}>
            {Array.from({ length: 7 }, (_, i) => (
              <Frond key={`hi${i}`} angle={(i / 7) * Math.PI * 2 + 0.75} droop={-0.12} length={0.7} width={0.9} color="#63a94e" />
            ))}
          </group>
          <Coconuts count={4} />
        </group>
      )}

      {TREE_STYLE === 'c' && (
        <group ref={crown} position={top}>
          <mesh castShadow scale={0.9}>
            <icosahedronGeometry args={[0.24, 0]} />
            <meshStandardMaterial color="#82c25f" flatShading />
          </mesh>
          {/* upright fan of narrow fronds */}
          {Array.from({ length: 11 }, (_, i) => (
            <Frond key={i} angle={(i / 11) * Math.PI * 2} droop={-0.34 + (i % 3) * 0.1} length={1.35} width={0.62} color="#82c25f" />
          ))}
          <Coconuts count={2} />
        </group>
      )}

      {TREE_STYLE === 'd' && (
        /* round stylized canopy — clustered leaf blobs */
        <group ref={crown} position={top}>
          <LeafBlob pos={[0, 0.35, 0]} r={0.85} color="#6fb257" />
          <LeafBlob pos={[0.62, 0.13, 0.3]} r={0.55} color="#7dbf62" />
          <LeafBlob pos={[-0.58, 0.17, 0.22]} r={0.5} color="#63a84e" />
          <LeafBlob pos={[0.1, 0.07, -0.6]} r={0.52} color="#77b95e" />
          <LeafBlob pos={[-0.15, 0.8, -0.1]} r={0.5} color="#84c468" />
          <LeafBlob pos={[0.45, 0.67, -0.35]} r={0.42} color="#6fb257" />
        </group>
      )}

      {TREE_STYLE === 'e' && (
        <group ref={crown} position={top} rotation-z={-0.28}>
          <mesh castShadow>
            <icosahedronGeometry args={[0.22, 0]} />
            <meshStandardMaterial color={g} flatShading />
          </mesh>
          {/* sparse, extra-long droopers — postcard coconut palm */}
          {Array.from({ length: 7 }, (_, i) => (
            <Frond key={i} angle={(i / 7) * Math.PI * 2 + 0.2} droop={0.34 + (i % 2) * 0.12} length={1.45} width={0.95} color={g} />
          ))}
          <Coconuts count={3} />
        </group>
      )}
    </group>
  )
}
