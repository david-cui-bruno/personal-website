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
import { Terrain } from './Terrain'
import { Water } from './Water'
import { PalmTree } from './PalmTree'
import { Scatter } from './Scatter'
import { PlayerCat } from './PlayerCat'
import { ItemsHost } from './items/ItemsHost'
import { PALMS } from '../config/content'
import { PALETTE } from '../config/palette'
import { useGame } from '../state/store'

type Controls = ComponentRef<typeof CameraControls>

export function Experience() {
  const controls = useRef<Controls>(null)
  const quality = useGame((s) => s.quality)
  const setQuality = useGame((s) => s.setQuality)

  useEffect(() => {
    // start behind the spawn point, looking inland at the island
    controls.current?.setLookAt(0, 4.6, 30, 0, 1.2, 18, false)
  }, [])

  return (
    <>
      {/* golden hour */}
      <Sky sunPosition={[45, 5, -60]} turbidity={7.5} rayleigh={2.6} mieCoefficient={0.008} mieDirectionalG={0.85} />
      <Environment frames={1} resolution={128} background={false} environmentIntensity={0.55}>
        <Lightformer form="circle" intensity={4} color="#ffb26b" position={[8, 2, -10]} scale={12} />
        <Lightformer intensity={1.1} color="#ffe6c7" position={[0, 10, 0]} rotation-x={Math.PI / 2} scale={[30, 30, 1]} />
        <Lightformer intensity={0.5} color="#8fb8d8" position={[-10, 4, 8]} rotation-y={Math.PI / 2} scale={[20, 8, 1]} />
      </Environment>
      <directionalLight
        castShadow
        color={PALETTE.sunLight}
        intensity={2.6}
        position={[26, 14, -30]}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={24}
        shadow-camera-bottom={-24}
        shadow-camera-near={1}
        shadow-camera-far={90}
        shadow-normalBias={0.04}
      />
      <hemisphereLight color="#ffd7a8" groundColor="#9a7c58" intensity={0.5} />
      <fog attach="fog" args={[PALETTE.fogColor, 45, 150]} />

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

      <PerformanceMonitor onDecline={() => setQuality(0)} flipflops={2} />
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
