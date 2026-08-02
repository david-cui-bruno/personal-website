import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { PALETTE } from '../../config/palette'

const SPOTIFY_GREEN = '#1db954'

export function Speaker() {
  const led = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (led.current) {
      const mat = led.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 1.4 + Math.sin(state.clock.elapsedTime * 3.2) * 0.7
    }
  })

  return (
    <group rotation-y={0.9}>
      {/* rock perch */}
      <mesh castShadow receiveShadow position={[0, 0.18, 0]} scale={[1.1, 0.5, 0.9]}>
        <icosahedronGeometry args={[0.6, 0]} />
        <meshStandardMaterial color={PALETTE.rock} flatShading roughness={0.95} />
      </mesh>
      <mesh castShadow position={[0.7, 0.12, 0.3]} scale={[0.5, 0.3, 0.45]}>
        <icosahedronGeometry args={[0.6, 0]} />
        <meshStandardMaterial color={PALETTE.rock} flatShading roughness={0.95} />
      </mesh>

      <group position={[0, 0.62, 0]} rotation-z={0.05}>
        {/* body */}
        <mesh castShadow>
          <boxGeometry args={[0.74, 0.46, 0.3]} />
          <meshStandardMaterial color="#2e2e33" flatShading roughness={0.6} />
        </mesh>
        {/* woofers */}
        {[-0.2, 0.2].map((x, i) => (
          <group key={i} position={[x, 0, 0.16]}>
            <mesh rotation-x={Math.PI / 2}>
              <cylinderGeometry args={[0.13, 0.13, 0.03, 12]} />
              <meshStandardMaterial color="#1b1b1f" flatShading />
            </mesh>
            <mesh rotation-x={Math.PI / 2} position={[0, 0, 0.012]}>
              <cylinderGeometry args={[0.05, 0.05, 0.025, 10]} />
              <meshStandardMaterial color="#4a4a52" flatShading />
            </mesh>
          </group>
        ))}
        {/* status LED — spotify green */}
        <mesh ref={led} position={[0, 0.13, 0.16]}>
          <boxGeometry args={[0.05, 0.03, 0.02]} />
          <meshStandardMaterial color={SPOTIFY_GREEN} emissive={SPOTIFY_GREEN} emissiveIntensity={1.5} />
        </mesh>
        {/* handle */}
        {[-0.26, 0.26].map((x, i) => (
          <mesh key={i} position={[x, 0.29, 0]}>
            <boxGeometry args={[0.05, 0.12, 0.06]} />
            <meshStandardMaterial color="#1b1b1f" flatShading />
          </mesh>
        ))}
        <mesh position={[0, 0.34, 0]}>
          <boxGeometry args={[0.58, 0.05, 0.06]} />
          <meshStandardMaterial color="#1b1b1f" flatShading />
        </mesh>
        {/* antenna */}
        <mesh position={[0.32, 0.36, -0.06]} rotation-z={-0.3}>
          <cylinderGeometry args={[0.012, 0.012, 0.3, 5]} />
          <meshStandardMaterial color="#4a4a52" flatShading />
        </mesh>
      </group>
    </group>
  )
}
