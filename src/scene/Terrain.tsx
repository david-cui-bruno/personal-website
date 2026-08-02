import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import CustomShaderMaterial from 'three-custom-shader-material'
import { terrainHeight } from '../lib/terrain'
import { SNOISE_2D, WATER_BOB } from '../lib/glsl'
import { PALETTE } from '../config/palette'

const vertexShader = /* glsl */ `
varying vec3 vWorldPos;
void main() {
  vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
}
`

const fragmentShader = /* glsl */ `
uniform float uTime;
uniform vec3 uSandDry;
uniform vec3 uSandWet;
uniform vec3 uGrass;
uniform vec3 uGrassDeep;
uniform vec3 uUnderwater;
uniform vec3 uFoam;
varying vec3 vWorldPos;
${SNOISE_2D}
${WATER_BOB}
void main() {
  float h = vWorldPos.y;
  float breakup = snoise(vWorldPos.xz * 0.35) * 0.5 + snoise(vWorldPos.xz * 1.4) * 0.5;

  // sand -> grass by height, with a noisy border so it doesn't ring the island
  float grassMask = smoothstep(1.05, 1.75, h + breakup * 0.35);
  vec3 grass = mix(uGrass, uGrassDeep, smoothstep(1.8, 3.2, h + breakup * 0.5));
  vec3 col = mix(uSandDry, grass, grassMask);

  // wet sand near the waterline, underwater sand tint below it
  col = mix(uSandWet, col, smoothstep(0.03, 0.38, h));
  col = mix(uUnderwater, col, smoothstep(-0.6, 0.05, h));

  // shoreline foam: a tight band just above the waterline, driven by the same
  // bob curve as the water surface so the foam laps in sync with the waves
  float waterY = waterBob(vWorldPos.xz, uTime);
  float band = smoothstep(waterY - 0.015, waterY + 0.01, h) * (1.0 - smoothstep(waterY + 0.045, waterY + 0.09, h));
  band *= 0.6 + 0.4 * snoise(vWorldPos.xz * 3.2 + vec2(uTime * 0.35, 0.0));
  col = mix(col, uFoam, clamp(band, 0.0, 1.0));

  col += breakup * 0.022; // subtle grain
  csm_DiffuseColor = vec4(col, 1.0);
}
`

// Coarse invisible copy of the island used by CameraControls as a collision
// mesh, so the camera can't dive inside the hill. ~1k tris keeps the per-frame
// raycasts cheap.
export const terrainCollider: { current: THREE.Mesh | null } = { current: null }

export function Terrain() {
  const matRef = useRef<{ uniforms: Record<string, THREE.IUniform> }>(null)

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(130, 130, 170, 170)
    geo.rotateX(-Math.PI / 2)
    const pos = geo.attributes.position
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, terrainHeight(pos.getX(i), pos.getZ(i)))
    }
    geo.computeVertexNormals()
    return geo
  }, [])

  const colliderGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(64, 64, 24, 24)
    geo.rotateX(-Math.PI / 2)
    const pos = geo.attributes.position
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, terrainHeight(pos.getX(i), pos.getZ(i)))
    }
    return geo
  }, [])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSandDry: { value: new THREE.Color(PALETTE.sandDry) },
      uSandWet: { value: new THREE.Color(PALETTE.sandWet) },
      uGrass: { value: new THREE.Color(PALETTE.grass) },
      uGrassDeep: { value: new THREE.Color(PALETTE.grassDeep) },
      uUnderwater: { value: new THREE.Color(PALETTE.underwaterSand) },
      uFoam: { value: new THREE.Color(PALETTE.foam) },
    }),
    [],
  )

  useFrame((state) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = state.clock.elapsedTime
  })

  return (
    <>
      <mesh geometry={geometry} receiveShadow>
        <CustomShaderMaterial
          ref={matRef as never}
          baseMaterial={THREE.MeshStandardMaterial}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          flatShading
          roughness={0.95}
          metalness={0}
        />
      </mesh>
      <mesh
        ref={(m) => {
          terrainCollider.current = m
        }}
        geometry={colliderGeometry}
        visible={false}
      >
        <meshBasicMaterial />
      </mesh>
    </>
  )
}
