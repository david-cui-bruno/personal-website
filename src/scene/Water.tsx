import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import CustomShaderMaterial from 'three-custom-shader-material'
import { SNOISE_2D, WATER_BOB } from '../lib/glsl'
import { PALETTE } from '../config/palette'

const vertexShader = /* glsl */ `
uniform float uTime;
varying vec3 vWorldPos;
${WATER_BOB}
void main() {
  vec3 wp = (modelMatrix * vec4(position, 1.0)).xyz;
  float bob = waterBob(wp.xz, uTime);
  csm_Position = position + vec3(0.0, bob, 0.0);
  vWorldPos = wp + vec3(0.0, bob, 0.0);
}
`

const fragmentShader = /* glsl */ `
uniform float uTime;
uniform vec3 uNear;
uniform vec3 uFar;
uniform vec3 uFoam;
varying vec3 vWorldPos;
${SNOISE_2D}
void main() {
  float dist = length(vWorldPos.xz);

  // shallow turquoise hugging the island, deep blue offshore
  vec3 col = mix(uFar, uNear, smoothstep(31.0, 16.0, dist));

  // drifting foam flecks / whitecaps
  float n1 = snoise(vWorldPos.xz * 0.8 + vec2(uTime * 0.22, uTime * 0.13));
  float n2 = snoise(vWorldPos.xz * 1.9 - vec2(uTime * 0.11, uTime * 0.19));
  float flecks = smoothstep(0.64, 0.78, n1 * 0.6 + n2 * 0.4) * 0.75;

  // extra churn where the water meets the beach
  float lap = smoothstep(19.0, 21.5, dist) * (1.0 - smoothstep(22.5, 25.5, dist));
  lap *= 0.5 + 0.5 * snoise(vWorldPos.xz * 0.8 + vec2(uTime * 0.35, uTime * 0.2));

  float foam = clamp(flecks + lap * 0.75, 0.0, 1.0);
  csm_DiffuseColor = vec4(mix(col, uFoam, foam), 0.93);
}
`

export function Water() {
  const matRef = useRef<{ uniforms: Record<string, THREE.IUniform> }>(null)

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(420, 420, 32, 32)
    geo.rotateX(-Math.PI / 2)
    return geo
  }, [])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uNear: { value: new THREE.Color(PALETTE.waterNear) },
      uFar: { value: new THREE.Color(PALETTE.waterFar) },
      uFoam: { value: new THREE.Color(PALETTE.foam) },
    }),
    [],
  )

  useFrame((state) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = state.clock.elapsedTime
  })

  return (
    <mesh geometry={geometry} renderOrder={1}>
      <CustomShaderMaterial
        ref={matRef as never}
        baseMaterial={THREE.MeshStandardMaterial}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        roughness={0.4}
        metalness={0}
      />
    </mesh>
  )
}
