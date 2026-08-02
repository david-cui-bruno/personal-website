import { useEffect, useRef, useState, type ComponentRef } from 'react'
import { useThree } from '@react-three/fiber'
import {
  CameraControls,
  Environment,
  Lightformer,
  PerformanceMonitor,
  Sky,
  Sparkles,
  Stars,
} from '@react-three/drei'
import { EffectComposer, N8AO, Bloom, Vignette } from '@react-three/postprocessing'
import { Terrain, terrainCollider } from './Terrain'
import { Water } from './Water'
import { PalmTree } from './PalmTree'
import { Scatter } from './Scatter'
import { PlayerCat } from './PlayerCat'
import { ItemsHost } from './items/ItemsHost'
import { PALMS } from '../config/content'
import { DESIGN, currentMood } from '../config/design'
import { useGame } from '../state/store'

type Controls = ComponentRef<typeof CameraControls>

export function Experience() {
  const controls = useRef<Controls>(null)
  const quality = useGame((s) => s.quality)
  const setQuality = useGame((s) => s.setQuality)
  const gl = useThree((s) => s.gl)

  // the island follows the visitor's clock (or a frozen ?time=H)
  const [mood, setMood] = useState(currentMood)
  useEffect(() => {
    if (DESIGN.time !== null) return
    const id = setInterval(() => setMood(currentMood()), 30_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    gl.toneMappingExposure = mood.exposure
  }, [gl, mood.exposure])

  useEffect(() => {
    const cam = DESIGN.cam?.split(',').map(Number)
    if (cam && cam.length === 6 && cam.every(Number.isFinite)) {
      // fixed camera for design screenshots
      controls.current?.setLookAt(cam[0], cam[1], cam[2], cam[3], cam[4], cam[5], false)
    } else {
      // start behind the spawn point, looking inland at the island
      controls.current?.setLookAt(0, 4.4, 25, 0, 1.1, 14.8, false)
    }
    // keep the camera from diving inside the hill
    if (controls.current && terrainCollider.current) {
      controls.current.colliderMeshes = [terrainCollider.current]
    }
  }, [])

  return (
    <>
      <Sky
        sunPosition={mood.sky.sun}
        turbidity={mood.sky.turbidity}
        rayleigh={mood.sky.rayleigh}
        mieCoefficient={mood.sky.mie}
        mieDirectionalG={mood.sky.g}
      />
      {mood.stars > 0.05 && (
        <Stars radius={220} depth={40} count={1400} factor={3.2} saturation={0.3} fade speed={0.6} />
      )}
      <Environment frames={1} resolution={128} background={false} environmentIntensity={mood.env}>
        <Lightformer form="circle" intensity={4} color="#ffb9c9" position={[8, 2, -10]} scale={12} />
        <Lightformer intensity={1.1} color="#ffe6d9" position={[0, 10, 0]} rotation-x={Math.PI / 2} scale={[30, 30, 1]} />
        <Lightformer intensity={0.5} color="#9db4dd" position={[-10, 4, 8]} rotation-y={Math.PI / 2} scale={[20, 8, 1]} />
      </Environment>
      <directionalLight
        castShadow
        color={mood.sun.color}
        intensity={mood.sun.intensity}
        position={mood.sun.position}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-camera-near={1}
        shadow-camera-far={80}
        shadow-normalBias={0.04}
      />
      <hemisphereLight color={mood.hemi.sky} groundColor={mood.hemi.ground} intensity={mood.hemi.intensity} />
      <fog attach="fog" args={[mood.fog.color, mood.fog.near, mood.fog.far]} />

      {/* the island */}
      <Terrain />
      <Water />
      <Sparkles count={60} scale={[48, 2.5, 48]} position={[0, 0.5, 0]} size={2.4} speed={0.25} opacity={0.55} color="#fff3d6" />
      {PALMS.map((p, i) => (
        <PalmTree key={i} x={p.x} z={p.z} scale={p.scale} rotY={p.rotY} swayPhase={p.swayPhase} />
      ))}
      <Scatter />
      <ItemsHost />

      {/* the cat + its camera */}
      <PlayerCat controls={controls} />
      <CameraControls
        ref={controls}
        makeDefault
        smoothTime={0.18}
        minDistance={4.5}
        maxDistance={12}
        minPolarAngle={0.35}
        maxPolarAngle={1.42}
      />

      {!DESIGN.lockQuality && <PerformanceMonitor onDecline={() => setQuality(0)} flipflops={2} />}
      <EffectComposer multisampling={quality > 0 ? 4 : 0}>
        {quality > 0 ? (
          <N8AO quality="medium" halfRes aoRadius={1.1} intensity={2} distanceFalloff={1} />
        ) : (
          <></>
        )}
        <Bloom mipmapBlur luminanceThreshold={0.85} intensity={0.4} />
        <Vignette offset={0.15} darkness={0.55} eskil={false} />
      </EffectComposer>
    </>
  )
}
