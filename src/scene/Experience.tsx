import { useEffect, useRef, type ComponentRef } from 'react'
import {
  CameraControls,
  Environment,
  Lightformer,
  PerformanceMonitor,
  Sky,
  Sparkles,
} from '@react-three/drei'
import { EffectComposer, N8AO, Bloom, Vignette } from '@react-three/postprocessing'
import { Terrain, terrainCollider } from './Terrain'
import { Water } from './Water'
import { PalmTree } from './PalmTree'
import { Scatter } from './Scatter'
import { PlayerCat } from './PlayerCat'
import { ItemsHost } from './items/ItemsHost'
import { PALMS } from '../config/content'
import { DESIGN, MOOD } from '../config/design'
import { useGame } from '../state/store'

type Controls = ComponentRef<typeof CameraControls>

export function Experience() {
  const controls = useRef<Controls>(null)
  const quality = useGame((s) => s.quality)
  const setQuality = useGame((s) => s.setQuality)

  useEffect(() => {
    const cam = DESIGN.cam?.split(',').map(Number)
    if (cam && cam.length === 6 && cam.every(Number.isFinite)) {
      // fixed camera for design screenshots
      controls.current?.setLookAt(cam[0], cam[1], cam[2], cam[3], cam[4], cam[5], false)
    } else {
      // start behind the spawn point, looking inland at the island
      controls.current?.setLookAt(0, 4.6, 30, 0, 1.2, 18, false)
    }
    // keep the camera from diving inside the hill
    if (controls.current && terrainCollider.current) {
      controls.current.colliderMeshes = [terrainCollider.current]
    }
  }, [])

  return (
    <>
      <Sky
        sunPosition={MOOD.sky.sunPosition}
        turbidity={MOOD.sky.turbidity}
        rayleigh={MOOD.sky.rayleigh}
        mieCoefficient={MOOD.sky.mieCoefficient}
        mieDirectionalG={MOOD.sky.mieDirectionalG}
      />
      <Environment frames={1} resolution={128} background={false} environmentIntensity={MOOD.envIntensity}>
        <Lightformer form="circle" intensity={4} color="#ffb26b" position={[8, 2, -10]} scale={12} />
        <Lightformer intensity={1.1} color="#ffe6c7" position={[0, 10, 0]} rotation-x={Math.PI / 2} scale={[30, 30, 1]} />
        <Lightformer intensity={0.5} color="#8fb8d8" position={[-10, 4, 8]} rotation-y={Math.PI / 2} scale={[20, 8, 1]} />
      </Environment>
      <directionalLight
        castShadow
        color={MOOD.sun.color}
        intensity={MOOD.sun.intensity}
        position={MOOD.sun.position}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={24}
        shadow-camera-bottom={-24}
        shadow-camera-near={1}
        shadow-camera-far={90}
        shadow-normalBias={0.04}
      />
      <hemisphereLight color={MOOD.hemi.sky} groundColor={MOOD.hemi.ground} intensity={MOOD.hemi.intensity} />
      <fog attach="fog" args={[MOOD.fog.color, MOOD.fog.near, MOOD.fog.far]} />

      {/* the island */}
      <Terrain />
      <Water />
      <Sparkles count={70} scale={[58, 2.5, 58]} position={[0, 0.5, 0]} size={2.4} speed={0.25} opacity={0.55} color="#fff3d6" />
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
        maxDistance={14}
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
