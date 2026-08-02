import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGame } from '../../state/store'
import { PALETTE } from '../../config/palette'

export function Chest() {
  const lid = useRef<THREE.Group>(null)
  const glow = useRef<THREE.Mesh>(null)

  useFrame((_, dt) => {
    const open = useGame.getState().activePanel === 'projects'
    if (lid.current) {
      const target = open ? -1.15 : 0
      lid.current.rotation.x += (target - lid.current.rotation.x) * (1 - Math.exp(-8 * dt))
    }
    if (glow.current) {
      const mat = glow.current.material as THREE.MeshStandardMaterial
      const target = open ? 1.6 : 0
      mat.emissiveIntensity += (target - mat.emissiveIntensity) * (1 - Math.exp(-6 * dt))
    }
  })

  return (
    <group rotation-y={0.6}>
      {/* base */}
      <mesh castShadow position={[0, 0.26, 0]}>
        <boxGeometry args={[0.95, 0.52, 0.62]} />
        <meshStandardMaterial color={PALETTE.wood} flatShading roughness={0.85} />
      </mesh>
      {/* straps */}
      {[-0.3, 0.3].map((x, i) => (
        <mesh key={i} position={[x, 0.26, 0]}>
          <boxGeometry args={[0.09, 0.54, 0.65]} />
          <meshStandardMaterial color={PALETTE.gold} flatShading metalness={0.4} roughness={0.5} />
        </mesh>
      ))}
      {/* gold inside, revealed when the lid opens */}
      <mesh ref={glow} position={[0, 0.45, 0]}>
        <boxGeometry args={[0.8, 0.14, 0.48]} />
        <meshStandardMaterial color={PALETTE.gold} emissive="#ffb830" emissiveIntensity={0} flatShading />
      </mesh>
      {/* lid, hinged at the back */}
      <group ref={lid} position={[0, 0.52, -0.31]}>
        <mesh castShadow position={[0, 0.14, 0.31]}>
          <boxGeometry args={[0.95, 0.28, 0.62]} />
          <meshStandardMaterial color={PALETTE.woodDark} flatShading roughness={0.85} />
        </mesh>
        {[-0.3, 0.3].map((x, i) => (
          <mesh key={i} position={[x, 0.14, 0.31]}>
            <boxGeometry args={[0.09, 0.3, 0.65]} />
            <meshStandardMaterial color={PALETTE.gold} flatShading metalness={0.4} roughness={0.5} />
          </mesh>
        ))}
        {/* lock */}
        <mesh position={[0, 0.05, 0.63]}>
          <boxGeometry args={[0.14, 0.16, 0.05]} />
          <meshStandardMaterial color={PALETTE.gold} flatShading metalness={0.5} roughness={0.4} />
        </mesh>
      </group>
    </group>
  )
}
