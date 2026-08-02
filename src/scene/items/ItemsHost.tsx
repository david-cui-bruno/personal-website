import { useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { terrainHeight } from '../../lib/terrain'
import { ITEMS, type IslandItem } from '../../config/content'
import { DESIGN } from '../../config/design'
import { catPosition, useGame } from '../../state/store'
import { Chest } from './Chest'
import { MedKit } from './MedKit'
import { Speaker } from './Speaker'
import { Campfire } from './Campfire'
import { Bottle } from './Bottle'
import { Journal } from './Journal'

const MODELS: Record<string, ReactNode> = {
  projects: <Chest />,
  framewise: <MedKit />,
  music: <Speaker />,
  food: <Campfire />,
  bottle: <Bottle />,
  journal: <Journal />,
}

function ItemAnchor({ item }: { item: IslandItem }) {
  const marker = useRef<THREE.Mesh>(null)
  const ring = useRef<THREE.Mesh>(null)
  const near = useGame((s) => s.nearItemId === item.id)
  const discovered = useGame((s) => s.discovered.includes(item.id))
  const openPanel = useGame((s) => s.openPanel)
  const setHint = useGame((s) => s.setHint)

  const [x, z] = item.position
  const y = terrainHeight(x, z)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (marker.current) {
      marker.current.position.y = 1.7 + Math.sin(t * 2.2) * 0.13
      marker.current.rotation.y = t * 1.4
    }
    if (ring.current) {
      const mat = ring.current.material as THREE.MeshBasicMaterial
      mat.opacity = near ? 0.75 + Math.sin(t * 5) * 0.2 : 0.2
      ring.current.scale.setScalar(near ? 1 + Math.sin(t * 5) * 0.04 : 1)
    }
  })

  return (
    <group
      position={[x, y, z]}
      onClick={() => (near ? openPanel(item.id) : setHint('walk closer to open it'))}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = 'auto')}
    >
      {MODELS[item.id]}
      {/* beacon until discovered — unfogged + overbright so it blooms and
          reads across the island. Style variants via ?beacon= (design.ts). */}
      {!discovered && DESIGN.beacon === 'b' && (
        <mesh position={[0, 1.15, 0]}>
          <cylinderGeometry args={[0.05, 0.1, 2.3, 8, 1, true]} />
          <meshBasicMaterial
            color={[1.7, 1.4, 0.8] as unknown as THREE.Color}
            transparent
            opacity={0.3}
            toneMapped={false}
            fog={false}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      {!discovered && (
        <mesh ref={marker} position={[0, 1.7, 0]}>
          {DESIGN.beacon === 'c' ? <sphereGeometry args={[0.17, 12, 10]} /> : <octahedronGeometry args={[DESIGN.beacon === 'b' ? 0.13 : 0.2, 0]} />}
          <meshBasicMaterial color={[2.2, 1.9, 1.1] as unknown as THREE.Color} toneMapped={false} fog={false} />
        </mesh>
      )}
      {/* ground ring, pulses when the cat is close */}
      <mesh ref={ring} position={[0, 0.06, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[item.interactRadius * 0.48, item.interactRadius * 0.56, 40]} />
        <meshBasicMaterial color="#ffe9ad" transparent opacity={0.2} toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  )
}

export function ItemsHost() {
  const setNear = useGame((s) => s.setNearItem)

  useFrame(() => {
    let best: string | null = null
    let bestD = Infinity
    for (const item of ITEMS) {
      const d = Math.hypot(catPosition.x - item.position[0], catPosition.z - item.position[1])
      if (d < item.interactRadius && d < bestD) {
        best = item.id
        bestD = d
      }
    }
    setNear(best)
  })

  return (
    <>
      {ITEMS.map((item) => (
        <ItemAnchor key={item.id} item={item} />
      ))}
    </>
  )
}
