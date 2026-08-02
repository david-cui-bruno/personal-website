import { useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useKeyboardControls, type CameraControls } from '@react-three/drei'
import { terrainHeight, WALKABLE_MIN_HEIGHT } from '../lib/terrain'
import { ITEMS, EXTRA_COLLIDERS } from '../config/content'
import { catPosition, joystick, useGame } from '../state/store'
import { TABBY } from '../config/palette'

const WALK_SPEED = 3.2
const RUN_MULT = 1.75
const CAT_RADIUS = 0.35

const COLLIDERS = [
  ...EXTRA_COLLIDERS,
  ...ITEMS.filter((i) => i.colliderRadius > 0).map((i) => ({ x: i.position[0], z: i.position[1], r: i.colliderRadius })),
]

function dampAngle(current: number, target: number, k: number, dt: number): number {
  let d = (target - current) % (Math.PI * 2)
  if (d > Math.PI) d -= Math.PI * 2
  if (d < -Math.PI) d += Math.PI * 2
  return current + d * (1 - Math.exp(-k * dt))
}

// ---------------------------------------------------------------------------
// The cat itself: hand-built from boxes, tabby markings included.
// Animated procedurally — diagonal leg pairs, body bob, tail sway, ear twitch.
// ---------------------------------------------------------------------------

interface CatRefs {
  body: RefObject<THREE.Group | null>
  head: RefObject<THREE.Group | null>
  earL: RefObject<THREE.Mesh | null>
  earR: RefObject<THREE.Mesh | null>
  tail: RefObject<THREE.Group | null>[]
  legs: RefObject<THREE.Group | null>[]
}

function CatModel({ refs }: { refs: CatRefs }) {
  const mats = useMemo(
    () => ({
      base: new THREE.MeshStandardMaterial({ color: TABBY.base, flatShading: true, roughness: 0.9 }),
      stripe: new THREE.MeshStandardMaterial({ color: TABBY.stripe, flatShading: true, roughness: 0.9 }),
      belly: new THREE.MeshStandardMaterial({ color: TABBY.belly, flatShading: true, roughness: 0.9 }),
      earInner: new THREE.MeshStandardMaterial({ color: TABBY.earInner, flatShading: true, roughness: 0.9 }),
      nose: new THREE.MeshStandardMaterial({ color: TABBY.nose, flatShading: true, roughness: 0.8 }),
      eye: new THREE.MeshStandardMaterial({ color: TABBY.eye, roughness: 0.35 }),
    }),
    [],
  )

  const legPositions: [number, number][] = [
    [-0.14, 0.27], // front-left
    [0.14, 0.27], // front-right
    [-0.14, -0.27], // back-left
    [0.14, -0.27], // back-right
  ]

  return (
    <group scale={0.92}>
      <group ref={refs.body}>
        {/* torso */}
        <mesh castShadow material={mats.base} position={[0, 0.5, 0]}>
          <boxGeometry args={[0.42, 0.36, 0.85]} />
        </mesh>
        <mesh material={mats.belly} position={[0, 0.35, 0.02]}>
          <boxGeometry args={[0.36, 0.1, 0.62]} />
        </mesh>
        {/* back stripes */}
        {[-0.28, -0.12, 0.05, 0.22].map((z, i) => (
          <mesh key={i} material={mats.stripe} position={[0, 0.675, z]}>
            <boxGeometry args={[0.44, 0.035, 0.09]} />
          </mesh>
        ))}
        {/* side stripes */}
        {[-0.2, 0.13].map((z, i) => (
          <mesh key={i} material={mats.stripe} position={[0, 0.56, z]}>
            <boxGeometry args={[0.45, 0.16, 0.06]} />
          </mesh>
        ))}

        {/* head */}
        <group ref={refs.head} position={[0, 0.72, 0.47]}>
          <mesh castShadow material={mats.base} position={[0, 0, 0]}>
            <boxGeometry args={[0.32, 0.28, 0.28]} />
          </mesh>
          {/* forehead "M" */}
          {[-0.05, 0, 0.05].map((x, i) => (
            <mesh key={i} material={mats.stripe} position={[x, 0.145, 0.01]} rotation-y={x * -3}>
              <boxGeometry args={[0.025, 0.012, 0.14]} />
            </mesh>
          ))}
          <mesh material={mats.belly} position={[0, -0.06, 0.17]}>
            <boxGeometry args={[0.16, 0.11, 0.09]} />
          </mesh>
          <mesh material={mats.nose} position={[0, -0.025, 0.218]}>
            <boxGeometry args={[0.05, 0.035, 0.03]} />
          </mesh>
          {/* eyes */}
          {[-0.09, 0.09].map((x, i) => (
            <mesh key={i} material={mats.eye} position={[x, 0.035, 0.143]}>
              <boxGeometry args={[0.05, 0.06, 0.02]} />
            </mesh>
          ))}
          {/* ears */}
          <mesh ref={refs.earL} castShadow material={mats.base} position={[-0.11, 0.19, -0.02]}>
            <coneGeometry args={[0.075, 0.15, 4]} />
          </mesh>
          <mesh ref={refs.earR} castShadow material={mats.base} position={[0.11, 0.19, -0.02]}>
            <coneGeometry args={[0.075, 0.15, 4]} />
          </mesh>
          <mesh material={mats.earInner} position={[-0.11, 0.16, 0.015]}>
            <coneGeometry args={[0.04, 0.08, 4]} />
          </mesh>
          <mesh material={mats.earInner} position={[0.11, 0.16, 0.015]}>
            <coneGeometry args={[0.04, 0.08, 4]} />
          </mesh>
        </group>

        {/* tail: three chained segments with tabby rings */}
        <group ref={refs.tail[0]} position={[0, 0.6, -0.42]} rotation-x={0.9}>
          <mesh castShadow material={mats.base} position={[0, 0, -0.13]}>
            <boxGeometry args={[0.085, 0.085, 0.26]} />
          </mesh>
          <group ref={refs.tail[1]} position={[0, 0, -0.26]}>
            <mesh castShadow material={mats.stripe} position={[0, 0, -0.11]}>
              <boxGeometry args={[0.075, 0.075, 0.22]} />
            </mesh>
            <group ref={refs.tail[2]} position={[0, 0, -0.22]}>
              <mesh castShadow material={mats.base} position={[0, 0, -0.08]}>
                <boxGeometry args={[0.065, 0.065, 0.16]} />
              </mesh>
              <mesh material={mats.stripe} position={[0, 0, -0.17]}>
                <boxGeometry args={[0.06, 0.06, 0.06]} />
              </mesh>
            </group>
          </group>
        </group>
      </group>

      {/* legs pivot at the hip so they swing */}
      {legPositions.map(([x, z], i) => (
        <group key={i} ref={refs.legs[i]} position={[x, 0.32, z]}>
          <mesh castShadow material={mats.base} position={[0, -0.15, 0]}>
            <boxGeometry args={[0.12, 0.3, 0.12]} />
          </mesh>
          <mesh material={mats.belly} position={[0, -0.29, 0.012]}>
            <boxGeometry args={[0.125, 0.08, 0.135]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// ---------------------------------------------------------------------------
// Movement + camera follow + gait, all in one frame loop.
// ---------------------------------------------------------------------------

export function PlayerCat({ controls }: { controls: RefObject<CameraControls | null> }) {
  const root = useRef<THREE.Group>(null)
  const refs: CatRefs = {
    body: useRef(null),
    head: useRef(null),
    earL: useRef(null),
    earR: useRef(null),
    tail: [useRef(null), useRef(null), useRef(null)],
    legs: [useRef(null), useRef(null), useRef(null), useRef(null)],
  }

  const [, getKeys] = useKeyboardControls()
  const vel = useRef(new THREE.Vector3())
  const heading = useRef(Math.PI)
  const phase = useRef(0)

  const tmp = useMemo(
    () => ({
      fwd: new THREE.Vector3(),
      right: new THREE.Vector3(),
      desired: new THREE.Vector3(),
      next: new THREE.Vector3(),
    }),
    [],
  )

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const g = root.current
    if (!g) return

    if (!useGame.getState().started) {
      catPosition.x = g.position.x
      catPosition.y = g.position.y
      catPosition.z = g.position.z
      return
    }

    // ---- input (keyboard + joystick), camera-relative
    const keys = getKeys() as Record<string, boolean>
    let ix = (keys.right ? 1 : 0) - (keys.left ? 1 : 0) + joystick.x
    let iy = (keys.forward ? 1 : 0) - (keys.back ? 1 : 0) + joystick.y
    const ilen = Math.hypot(ix, iy)
    if (ilen > 1) {
      ix /= ilen
      iy /= ilen
    }

    const { fwd, right, desired, next } = tmp
    fwd.set(0, 0, -1).applyQuaternion(state.camera.quaternion)
    fwd.y = 0
    fwd.normalize()
    right.set(1, 0, 0).applyQuaternion(state.camera.quaternion)
    right.y = 0
    right.normalize()

    const targetSpeed = WALK_SPEED * (keys.run ? RUN_MULT : 1) * Math.min(1, ilen)
    desired.copy(right).multiplyScalar(ix).addScaledVector(fwd, iy)
    if (desired.lengthSq() > 0) desired.normalize().multiplyScalar(targetSpeed)

    const damp = 1 - Math.exp(-(ilen > 0.01 ? 8 : 11) * dt)
    vel.current.lerp(desired, damp)
    vel.current.y = 0
    if (vel.current.lengthSq() < 0.0004) vel.current.set(0, 0, 0)

    // ---- integrate + collide
    next.copy(g.position).addScaledVector(vel.current, dt)
    for (const c of COLLIDERS) {
      const dx = next.x - c.x
      const dz = next.z - c.z
      const d = Math.hypot(dx, dz)
      const min = c.r + CAT_RADIUS
      if (d < min && d > 1e-4) {
        next.x = c.x + (dx / d) * min
        next.z = c.z + (dz / d) * min
      }
    }
    // stay out of the water (slide along the shoreline)
    if (terrainHeight(next.x, next.z) < WALKABLE_MIN_HEIGHT) {
      if (terrainHeight(next.x, g.position.z) >= WALKABLE_MIN_HEIGHT) {
        next.z = g.position.z
      } else if (terrainHeight(g.position.x, next.z) >= WALKABLE_MIN_HEIGHT) {
        next.x = g.position.x
      } else {
        next.x = g.position.x
        next.z = g.position.z
      }
    }
    g.position.x = next.x
    g.position.z = next.z
    const groundY = terrainHeight(next.x, next.z)
    g.position.y += (groundY - g.position.y) * (1 - Math.exp(-20 * dt))
    catPosition.x = g.position.x
    catPosition.y = g.position.y
    catPosition.z = g.position.z

    // ---- heading
    const speed = Math.hypot(vel.current.x, vel.current.z)
    if (speed > 0.15) {
      heading.current = dampAngle(heading.current, Math.atan2(vel.current.x, vel.current.z), 10, dt)
    }
    g.rotation.y = heading.current

    // ---- camera follow
    controls.current?.moveTo(g.position.x, g.position.y + 0.7, g.position.z, true)

    // ---- gait + idle animation
    const t = state.clock.elapsedTime
    const speedN = Math.min(speed / WALK_SPEED, 1.6)
    if (speed > 0.05) phase.current += dt * (5 + 7 * speedN)

    const swing = Math.sin(phase.current) * 0.6 * Math.min(1, speedN + 0.15)
    const [fl, fr, bl, br] = refs.legs
    if (fl.current) fl.current.rotation.x = swing
    if (br.current) br.current.rotation.x = swing
    if (fr.current) fr.current.rotation.x = -swing
    if (bl.current) bl.current.rotation.x = -swing

    if (refs.body.current) {
      refs.body.current.position.y = Math.abs(Math.sin(phase.current * 2)) * 0.028 * speedN + Math.sin(t * 2.1) * 0.006
      refs.body.current.rotation.x = Math.sin(phase.current * 2) * 0.02 * speedN
    }
    if (refs.head.current) {
      refs.head.current.rotation.x = Math.sin(phase.current * 2 + 1) * 0.03 * speedN
    }
    // tail: lifts with speed, lazy figure-eight sway at rest
    if (refs.tail[0].current) {
      refs.tail[0].current.rotation.x = 0.9 + speedN * 0.28 + Math.sin(t * 1.4) * 0.07
      refs.tail[0].current.rotation.y = Math.sin(t * 1.1) * 0.18
    }
    for (let i = 1; i < 3; i++) {
      const seg = refs.tail[i].current
      if (seg) {
        seg.rotation.y = Math.sin(t * 1.5 + i * 0.9) * 0.22
        seg.rotation.x = Math.sin(t * 1.2 + i * 0.6) * 0.1
      }
    }
    // occasional ear twitch
    const twL = Math.exp(-90 * (((t * 0.17) % 1) - 0.5) ** 2)
    const twR = Math.exp(-90 * (((t * 0.13 + 0.4) % 1) - 0.5) ** 2)
    if (refs.earL.current) refs.earL.current.rotation.z = 0.08 + twL * 0.35
    if (refs.earR.current) refs.earR.current.rotation.z = -0.08 - twR * 0.35
  })

  return (
    <group ref={root} position={[0, terrainHeight(0, 22), 22]} rotation-y={Math.PI}>
      <CatModel refs={refs} />
    </group>
  )
}
