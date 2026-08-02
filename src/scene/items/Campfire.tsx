import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { PALETTE } from '../../config/palette'

const FLAMES = [
  { r: 0.16, h: 0.42, color: '#ff7a2f', speed: 9 },
  { r: 0.11, h: 0.3, color: '#ffb347', speed: 12 },
  { r: 0.07, h: 0.2, color: '#ffe08a', speed: 15 },
]

export function Campfire() {
  const flames = useRef<(THREE.Mesh | null)[]>([])
  const light = useRef<THREE.PointLight>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    flames.current.forEach((f, i) => {
      if (!f) return
      const s = 1 + Math.sin(t * FLAMES[i].speed + i * 2.1) * 0.12 + Math.sin(t * 5.3 + i) * 0.06
      f.scale.set(s, 1 + Math.sin(t * FLAMES[i].speed * 0.7 + i) * 0.18, s)
      f.rotation.y = t * (1.2 + i * 0.4)
    })
    if (light.current) {
      light.current.intensity = 14 + Math.sin(t * 11) * 2.5 + Math.sin(t * 4.7) * 2
    }
  })

  return (
    <group>
      {/* stone ring */}
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2
        return (
          <mesh key={i} castShadow position={[Math.cos(a) * 0.58, 0.08, Math.sin(a) * 0.58]} scale={[1, 0.7, 1]} rotation-y={a}>
            <icosahedronGeometry args={[0.14, 0]} />
            <meshStandardMaterial color={PALETTE.rock} flatShading roughness={0.95} />
          </mesh>
        )
      })}
      {/* crossed logs */}
      {[0.2, 1.9, 3.7].map((a, i) => (
        <mesh key={i} castShadow position={[0, 0.13, 0]} rotation={[0.16, a, Math.PI / 2 - 0.35]}>
          <cylinderGeometry args={[0.06, 0.07, 0.72, 6]} />
          <meshStandardMaterial color={PALETTE.woodDark} flatShading roughness={0.9} />
        </mesh>
      ))}
      {/* flames */}
      {FLAMES.map((f, i) => (
        <mesh
          key={i}
          ref={(el) => {
            flames.current[i] = el
          }}
          position={[0, 0.22 + f.h / 2, 0]}
        >
          <coneGeometry args={[f.r, f.h, 6]} />
          <meshStandardMaterial color={f.color} emissive={f.color} emissiveIntensity={2.4} flatShading />
        </mesh>
      ))}
      <pointLight ref={light} position={[0, 0.85, 0]} color="#ff9c4f" intensity={14} distance={9} decay={2} />

      {/* cooking tripod + pot */}
      {[0, 2.1, 4.2].map((a, i) => (
        <mesh key={i} castShadow position={[Math.cos(a) * 0.4, 0.55, Math.sin(a) * 0.4]} rotation={[Math.sin(a) * 0.42, 0, Math.cos(a) * -0.42]}>
          <cylinderGeometry args={[0.025, 0.025, 1.15, 5]} />
          <meshStandardMaterial color={PALETTE.palmTrunk} flatShading roughness={0.9} />
        </mesh>
      ))}
      <mesh castShadow position={[0, 0.78, 0]}>
        <cylinderGeometry args={[0.17, 0.14, 0.2, 10]} />
        <meshStandardMaterial color="#3a3a40" flatShading roughness={0.7} metalness={0.35} />
      </mesh>
      <mesh position={[0, 0.95, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.16, 4]} />
        <meshStandardMaterial color="#1b1b1f" flatShading />
      </mesh>
      {/* a coconut bowl on the sand */}
      <mesh castShadow position={[0.85, 0.08, 0.35]}>
        <icosahedronGeometry args={[0.11, 0]} />
        <meshStandardMaterial color={PALETTE.woodDark} flatShading />
      </mesh>
    </group>
  )
}
