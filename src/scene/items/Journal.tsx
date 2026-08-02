import { PALETTE } from '../../config/palette'

export function Journal() {
  return (
    <group rotation-y={-0.5}>
      {/* cover */}
      <mesh castShadow position={[0, 0.035, 0]}>
        <boxGeometry args={[0.52, 0.04, 0.38]} />
        <meshStandardMaterial color={PALETTE.woodDark} flatShading roughness={0.85} />
      </mesh>
      {/* open pages, slightly tented at the spine */}
      <mesh castShadow position={[-0.12, 0.075, 0]} rotation-z={0.09}>
        <boxGeometry args={[0.24, 0.03, 0.36]} />
        <meshStandardMaterial color="#f7f0df" flatShading roughness={0.95} />
      </mesh>
      <mesh castShadow position={[0.12, 0.075, 0]} rotation-z={-0.09}>
        <boxGeometry args={[0.24, 0.03, 0.36]} />
        <meshStandardMaterial color="#f0e7d2" flatShading roughness={0.95} />
      </mesh>
      {/* scribbles */}
      {[-0.06, 0, 0.06].map((z, i) => (
        <mesh key={i} position={[0.12, 0.092, z]} rotation-z={-0.09}>
          <boxGeometry args={[0.16, 0.002, 0.012]} />
          <meshStandardMaterial color="#8a7455" />
        </mesh>
      ))}
      {/* pencil beside it */}
      <mesh castShadow position={[0.32, 0.03, 0.16]} rotation={[Math.PI / 2, 0, 0.9]}>
        <cylinderGeometry args={[0.018, 0.018, 0.3, 5]} />
        <meshStandardMaterial color="#d9a23f" flatShading roughness={0.8} />
      </mesh>
    </group>
  )
}
