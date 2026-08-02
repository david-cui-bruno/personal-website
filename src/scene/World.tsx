import { Canvas } from '@react-three/fiber'
import { KeyboardControls } from '@react-three/drei'
import { Experience } from './Experience'
import { useGame } from '../state/store'

const KEYMAP = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'back', keys: ['ArrowDown', 'KeyS'] },
  { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'right', keys: ['ArrowRight', 'KeyD'] },
  { name: 'run', keys: ['ShiftLeft', 'ShiftRight'] },
]

// The whole three.js payload hangs off this module so React.lazy in App keeps
// the first paint (intro screen) free of it.
export default function World() {
  const quality = useGame((s) => s.quality)
  return (
    <KeyboardControls map={KEYMAP}>
      <Canvas
        shadows
        dpr={quality > 0 ? [1, 2] : [1, 1.5]}
        camera={{ fov: 42, near: 0.5, far: 400, position: [0, 6, 33] }}
        gl={{ antialias: false, powerPreference: 'high-performance', toneMappingExposure: 1.12 }}
      >
        <Experience />
      </Canvas>
    </KeyboardControls>
  )
}
