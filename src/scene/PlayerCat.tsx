import { useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useKeyboardControls, type CameraControls } from '@react-three/drei'
import { terrainHeight, WALKABLE_MIN_HEIGHT } from '../lib/terrain'
import { ITEMS, EXTRA_COLLIDERS } from '../config/content'
import { catPosition, joystick, useGame } from '../state/store'
import { TABBY } from '../config/palette'
import { DESIGN } from '../config/design'
import { setAudioLevels } from '../lib/audio'

const WALK_SPEED = 3.2
const RUN_MULT = 1.75
const CAT_RADIUS = 0.35

const COLLIDERS = [
  ...EXTRA_COLLIDERS,
  ...ITEMS.filter((i) => i.colliderRadius > 0).map((i) => ({ x: i.position[0], z: i.position[1], r: i.colliderRadius })),
]

const fire = ITEMS.find((i) => i.id === 'food')!
const CAMPFIRE = { x: fire.position[0], z: fire.position[1] }

function dampAngle(current: number, target: number, k: number, dt: number): number {
  let d = (target - current) % (Math.PI * 2)
  if (d > Math.PI) d -= Math.PI * 2
  if (d < -Math.PI) d += Math.PI * 2
  return current + d * (1 - Math.exp(-k * dt))
}

// ---------------------------------------------------------------------------
// Bebo: hand-built from boxes, standing on two legs like the little mascot
// he is. Tabby markings included. Animated procedurally — alternating leg
// steps, opposite arm swings, waddle roll, tail sway, ear twitches.
// ---------------------------------------------------------------------------

interface CatRefs {
  body: RefObject<THREE.Group | null>
  head: RefObject<THREE.Group | null>
  earL: RefObject<THREE.Mesh | null>
  earR: RefObject<THREE.Mesh | null>
  tail: RefObject<THREE.Group | null>[]
  legs: RefObject<THREE.Group | null>[] // [left, right]
  arms: RefObject<THREE.Group | null>[] // [left, right]
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
      shine: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.2 }),
    }),
    [],
  )

  return (
    <group scale={0.92}>
      <group ref={refs.body}>
        {/* two-part torso: wider hips, tapered chest */}
        <mesh castShadow material={mats.base} position={[0, 0.45, 0]}>
          <boxGeometry args={[0.46, 0.24, 0.33]} />
        </mesh>
        <mesh castShadow material={mats.base} position={[0, 0.65, 0]}>
          <boxGeometry args={[0.4, 0.3, 0.28]} />
        </mesh>
        {/* cream belly, front */}
        <mesh material={mats.belly} position={[0, 0.53, 0.15]}>
          <boxGeometry args={[0.28, 0.3, 0.04]} />
        </mesh>
        {/* chest-fluff diamond */}
        <mesh material={mats.belly} position={[0, 0.72, 0.135]} rotation-z={Math.PI / 4}>
          <boxGeometry args={[0.16, 0.16, 0.05]} />
        </mesh>
        {/* chunky back stripes, slightly tilted */}
        {[
          { y: 0.5, tilt: 0.12 },
          { y: 0.62, tilt: -0.1 },
          { y: 0.73, tilt: 0.08 },
        ].map((s, i) => (
          <mesh key={i} material={mats.stripe} position={[0, s.y, -0.145]} rotation-z={s.tilt}>
            <boxGeometry args={[0.34, 0.06, 0.05]} />
          </mesh>
        ))}
        {/* zigzag flank stripes, low on the hips so the arms stay clean */}
        {[-1, 1].map((side) =>
          [
            { z: -0.1, y: 0.47, tilt: 0.3 },
            { z: 0.0, y: 0.44, tilt: -0.3 },
            { z: 0.09, y: 0.47, tilt: 0.25 },
          ].map((s, i) => (
            <mesh key={`${side}${i}`} material={mats.stripe} position={[side * 0.235, s.y, s.z]} rotation-x={s.tilt}>
              <boxGeometry args={[0.03, 0.13, 0.05]} />
            </mesh>
          )),
        )}

        {/* head (chibi-big) */}
        <group ref={refs.head} position={[0, 0.98, 0.02]}>
          <mesh castShadow material={mats.base}>
            <boxGeometry args={[0.36, 0.3, 0.3]} />
          </mesh>
          {/* little hair tuft */}
          <mesh castShadow material={mats.base} position={[0.06, 0.18, 0.05]} rotation-z={-0.35}>
            <coneGeometry args={[0.045, 0.09, 4]} />
          </mesh>
          {/* forehead "M" */}
          {[-0.05, 0, 0.05].map((x, i) => (
            <mesh key={i} material={mats.stripe} position={[x, 0.155, 0.02]} rotation-y={x * -3}>
              <boxGeometry args={[0.028, 0.014, 0.14]} />
            </mesh>
          ))}
          {/* cheek fluff tufts */}
          <mesh castShadow material={mats.base} position={[-0.2, -0.07, 0.05]} rotation-z={Math.PI / 2 + 0.5}>
            <coneGeometry args={[0.065, 0.13, 4]} />
          </mesh>
          <mesh castShadow material={mats.base} position={[0.2, -0.07, 0.05]} rotation-z={-Math.PI / 2 - 0.5}>
            <coneGeometry args={[0.065, 0.13, 4]} />
          </mesh>
          {/* muzzle, nose, mouth, fang */}
          <mesh material={mats.belly} position={[0, -0.06, 0.175]}>
            <boxGeometry args={[0.17, 0.12, 0.1]} />
          </mesh>
          <mesh material={mats.nose} position={[0, -0.02, 0.228]}>
            <boxGeometry args={[0.05, 0.035, 0.03]} />
          </mesh>
          <mesh material={mats.stripe} position={[0, -0.065, 0.226]}>
            <boxGeometry args={[0.014, 0.03, 0.02]} />
          </mesh>
          <mesh material={mats.shine} position={[0.04, -0.115, 0.2]}>
            <boxGeometry args={[0.022, 0.035, 0.02]} />
          </mesh>
          {/* whisker dots — two per side, out on the cheeks */}
          {[-1, 1].map((side) =>
            [
              [0.125, -0.03],
              [0.14, -0.065],
            ].map(([x, y], i) => (
              <mesh key={`${side}${i}`} material={mats.stripe} position={[side * x, y, 0.152]}>
                <boxGeometry args={[0.018, 0.018, 0.012]} />
              </mesh>
            )),
          )}
          {/* eyes + shine + brow marks */}
          {[-0.09, 0.09].map((x, i) => (
            <group key={i}>
              <mesh material={mats.eye} position={[x, 0.035, 0.155]}>
                <boxGeometry args={[0.055, 0.075, 0.02]} />
              </mesh>
              <mesh material={mats.shine} position={[x + 0.014, 0.058, 0.157]}>
                <boxGeometry args={[0.018, 0.022, 0.021]} />
              </mesh>
              <mesh material={mats.stripe} position={[x, 0.1, 0.155]} rotation-z={x > 0 ? -0.2 : 0.2}>
                <boxGeometry args={[0.05, 0.016, 0.02]} />
              </mesh>
            </group>
          ))}
          {/* ears: splayed, dark-tipped, pink inside */}
          <mesh ref={refs.earL} castShadow material={mats.base} position={[-0.125, 0.2, -0.02]} rotation-z={0.14}>
            <coneGeometry args={[0.09, 0.18, 4]} />
          </mesh>
          <mesh ref={refs.earR} castShadow material={mats.base} position={[0.125, 0.2, -0.02]} rotation-z={-0.14}>
            <coneGeometry args={[0.09, 0.18, 4]} />
          </mesh>
          <mesh material={mats.stripe} position={[-0.152, 0.28, -0.02]} rotation-z={0.14}>
            <coneGeometry args={[0.032, 0.06, 4]} />
          </mesh>
          <mesh material={mats.stripe} position={[0.152, 0.28, -0.02]} rotation-z={-0.14}>
            <coneGeometry args={[0.032, 0.06, 4]} />
          </mesh>
          <mesh material={mats.earInner} position={[-0.118, 0.17, 0.015]} rotation-z={0.14}>
            <coneGeometry args={[0.05, 0.1, 4]} />
          </mesh>
          <mesh material={mats.earInner} position={[0.118, 0.17, 0.015]} rotation-z={-0.14}>
            <coneGeometry args={[0.05, 0.1, 4]} />
          </mesh>
        </group>

        {/* tail: four chained segments with tabby rings and a subtle kink */}
        <group ref={refs.tail[0]} position={[0, 0.42, -0.18]} rotation-x={0.7}>
          <mesh castShadow material={mats.base} position={[0.01, 0, -0.12]}>
            <boxGeometry args={[0.09, 0.09, 0.24]} />
          </mesh>
          <group ref={refs.tail[1]} position={[0, 0, -0.24]}>
            <mesh castShadow material={mats.stripe} position={[-0.012, 0, -0.1]}>
              <boxGeometry args={[0.08, 0.08, 0.2]} />
            </mesh>
            <group ref={refs.tail[2]} position={[0, 0, -0.2]}>
              <mesh castShadow material={mats.base} position={[0.01, 0, -0.085]}>
                <boxGeometry args={[0.07, 0.07, 0.17]} />
              </mesh>
              <mesh castShadow material={mats.stripe} position={[0, 0.005, -0.21]}>
                <boxGeometry args={[0.06, 0.06, 0.1]} />
              </mesh>
            </group>
          </group>
        </group>

        {/* arms, hanging from the shoulders */}
        {[-1, 1].map((side, i) => (
          <group key={i} ref={refs.arms[i]} position={[side * 0.25, 0.72, 0]} rotation-z={side * 0.1}>
            <mesh castShadow material={mats.base} position={[0, -0.11, 0]}>
              <boxGeometry args={[0.11, 0.24, 0.12]} />
            </mesh>
            {/* white paw */}
            <mesh material={mats.belly} position={[0, -0.235, 0.01]}>
              <boxGeometry args={[0.115, 0.08, 0.125]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* legs pivot at the hip so they step */}
      {[-1, 1].map((side, i) => (
        <group key={i} ref={refs.legs[i]} position={[side * 0.11, 0.34, 0]}>
          <mesh castShadow material={mats.base} position={[0, -0.14, 0]}>
            <boxGeometry args={[0.14, 0.28, 0.15]} />
          </mesh>
          {/* white foot, toes forward */}
          <mesh castShadow material={mats.belly} position={[0, -0.275, 0.03]}>
            <boxGeometry args={[0.15, 0.09, 0.21]} />
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
    legs: [useRef(null), useRef(null)],
    arms: [useRef(null), useRef(null)],
  }

  const [, getKeys] = useKeyboardControls()
  const vel = useRef(new THREE.Vector3())
  const heading = useRef(Math.PI)
  const phase = useRef(0)
  const idleTime = useRef(0)
  const sitW = useRef(0) // 0 = standing, 1 = sitting
  const audioClock = useRef(0)

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

    const { started, activePanel } = useGame.getState()
    if (!started) {
      catPosition.x = g.position.x
      catPosition.y = g.position.y
      catPosition.z = g.position.z
      return
    }

    // ---- input (keyboard + joystick), camera-relative
    // ignored while a panel is open, so typing "wasd" in the contact form
    // doesn't send Bebo wandering off
    const keys = getKeys() as Record<string, boolean>
    let ix = activePanel ? 0 : (keys.right ? 1 : 0) - (keys.left ? 1 : 0) + joystick.x
    let iy = activePanel ? 0 : (keys.forward ? 1 : 0) - (keys.back ? 1 : 0) + joystick.y
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

    // ---- camera follow (disabled when a fixed design-shot camera is set)
    if (!DESIGN.cam) controls.current?.moveTo(g.position.x, g.position.y + 0.7, g.position.z, true)

    // ---- ambient audio levels (throttled)
    audioClock.current += dt
    if (audioClock.current > 0.15) {
      audioClock.current = 0
      const surf = Math.max(0, Math.min(1, 1 - g.position.y / 3.2))
      const fireDist = Math.hypot(g.position.x - CAMPFIRE.x, g.position.z - CAMPFIRE.z)
      const fire = Math.max(0, 1 - fireDist / 8) ** 2 * 0.9
      setAudioLevels(surf, fire)
    }

    // ---- gait + idle animation
    const t = state.clock.elapsedTime
    const speedN = Math.min(speed / WALK_SPEED, 1.6)
    if (speed > 0.05) phase.current += dt * (5 + 7 * speedN)

    // Bebo plops down after a while with nothing to do
    idleTime.current = speed < 0.05 && !useGame.getState().activePanel ? idleTime.current + dt : 0
    const sitTarget = idleTime.current > 7 ? 1 : 0
    sitW.current += (sitTarget - sitW.current) * (1 - Math.exp(-(sitTarget ? 3 : 7) * dt))
    const sit = sitW.current
    const stand = 1 - sit

    // biped gait: legs alternate, arms swing opposite
    const amp = Math.min(1, speedN + 0.15)
    const step = Math.sin(phase.current) * 0.62 * amp
    const [legL, legR] = refs.legs
    if (legL.current) legL.current.rotation.x = step * stand + 1.42 * sit
    if (legR.current) legR.current.rotation.x = -step * stand + 1.42 * sit
    const [armL, armR] = refs.arms
    if (armL.current) {
      armL.current.rotation.x = -step * 0.55 * stand - 0.25 * sit
      armL.current.rotation.z = -0.1 - 0.22 * sit
    }
    if (armR.current) {
      armR.current.rotation.x = step * 0.55 * stand - 0.25 * sit
      armR.current.rotation.z = 0.1 + 0.22 * sit
    }

    if (refs.body.current) {
      refs.body.current.position.y =
        Math.abs(Math.sin(phase.current)) * 0.035 * speedN * stand - 0.14 * sit + Math.sin(t * 2.1) * 0.006
      // lean into the walk, tip back a little when sitting
      refs.body.current.rotation.x = (0.09 * speedN + Math.sin(phase.current * 2) * 0.015 * speedN) * stand - 0.12 * sit
      // waddle
      refs.body.current.rotation.z = Math.sin(phase.current) * 0.05 * speedN * stand
    }
    if (refs.head.current) {
      refs.head.current.rotation.x = (Math.sin(phase.current * 2 + 1) * 0.03 * speedN - 0.06 * speedN) * stand + 0.1 * sit
    }
    // tail: lifts with speed, lazy sway at rest, curls around when sitting
    if (refs.tail[0].current) {
      refs.tail[0].current.rotation.x = (0.7 + speedN * 0.3 + Math.sin(t * 1.4) * 0.07) * stand + 0.28 * sit
      refs.tail[0].current.rotation.y = Math.sin(t * 1.1) * 0.18 + 0.95 * sit
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
    <group ref={root} position={[0, terrainHeight(0, 18), 18]} rotation-y={Math.PI}>
      <CatModel refs={refs} />
    </group>
  )
}
