import { PALETTE } from '../../config/palette'

export function MedKit() {
  return (
    <group rotation={[0.06, -0.7, 0.1]} position={[0, -0.04, 0]}>
      {/* case */}
      <mesh castShadow position={[0, 0.2, 0]}>
        <boxGeometry args={[0.58, 0.4, 0.42]} />
        <meshStandardMaterial color="#f5f2ea" flatShading roughness={0.7} />
      </mesh>
      {/* lid seam */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[0.6, 0.02, 0.44]} />
        <meshStandardMaterial color="#d8d2c4" flatShading />
      </mesh>
      {/* red cross, top */}
      <mesh position={[0, 0.41, 0]}>
        <boxGeometry args={[0.3, 0.02, 0.1]} />
        <meshStandardMaterial color="#d84f43" flatShading />
      </mesh>
      <mesh position={[0, 0.41, 0]}>
        <boxGeometry args={[0.1, 0.02, 0.3]} />
        <meshStandardMaterial color="#d84f43" flatShading />
      </mesh>
      {/* red cross, front */}
      <mesh position={[0, 0.2, 0.215]}>
        <boxGeometry args={[0.2, 0.07, 0.02]} />
        <meshStandardMaterial color="#d84f43" flatShading />
      </mesh>
      <mesh position={[0, 0.2, 0.215]}>
        <boxGeometry args={[0.07, 0.2, 0.02]} />
        <meshStandardMaterial color="#d84f43" flatShading />
      </mesh>
      {/* latch */}
      <mesh position={[0, 0.28, 0.22]}>
        <boxGeometry args={[0.08, 0.06, 0.03]} />
        <meshStandardMaterial color={PALETTE.rock} flatShading metalness={0.3} />
      </mesh>
    </group>
  )
}
