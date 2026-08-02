import { PALETTE } from '../../config/palette'

const GLASS = '#9fd4c3'

export function Bottle() {
  return (
    <group rotation={[0, 0.6, 1.32]} position={[0, 0.14, 0]}>
      {/* glass body */}
      <mesh castShadow>
        <cylinderGeometry args={[0.13, 0.13, 0.4, 8]} />
        <meshStandardMaterial color={GLASS} transparent opacity={0.45} roughness={0.15} />
      </mesh>
      {/* shoulder + neck */}
      <mesh position={[0, 0.24, 0]}>
        <cylinderGeometry args={[0.05, 0.11, 0.1, 8]} />
        <meshStandardMaterial color={GLASS} transparent opacity={0.45} roughness={0.15} />
      </mesh>
      <mesh position={[0, 0.33, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.1, 8]} />
        <meshStandardMaterial color={GLASS} transparent opacity={0.45} roughness={0.15} />
      </mesh>
      {/* cork */}
      <mesh castShadow position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.055, 0.05, 0.08, 8]} />
        <meshStandardMaterial color={PALETTE.palmTrunk} flatShading roughness={0.9} />
      </mesh>
      {/* rolled-up note inside */}
      <mesh position={[0, -0.02, 0]} rotation-z={0.12}>
        <cylinderGeometry args={[0.045, 0.045, 0.3, 6]} />
        <meshStandardMaterial color="#f4e8d2" roughness={0.9} />
      </mesh>
    </group>
  )
}
