import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import CustomShaderMaterial from 'three-custom-shader-material'
import { SNOISE_2D, WATER_BOB } from '../lib/glsl'
import { PALETTE } from '../config/palette'
import { WATER_STYLE } from '../config/design'
import { ISLAND_RADIUS } from '../lib/terrain'

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
uniform float uFleckLo;
uniform float uFleckHi;
uniform float uFleckScale;
uniform float uOpacity;
uniform float uBands;
uniform float uBandSoft;
uniform float uContour;
uniform float uSparkle;
uniform float uGradNear;
uniform float uGradFar;
uniform float uLap0;
uniform float uLap1;
uniform float uLap2;
uniform float uLap3;
varying vec3 vWorldPos;
${SNOISE_2D}
void main() {
  float dist = length(vWorldPos.xz);

  // shallow -> deep gradient, wobbled a little so bands aren't perfect circles
  float wobble = snoise(vWorldPos.xz * 0.05 + vec2(uTime * 0.01, 0.0)) * 0.06;
  float grad = smoothstep(uGradFar, uGradNear, dist) + wobble;

  float shaped = grad;
  if (uBands > 0.5) {
    float crisp = floor(grad * uBands + 0.5) / uBands;
    shaped = mix(crisp, grad, uBandSoft); // soft-posterize
  }
  vec3 col = mix(uFar, uNear, clamp(shaped, 0.0, 1.0));

  // large-scale mottling so flat bands still have life
  float mottle = snoise(vWorldPos.xz * 0.16 + vec2(uTime * 0.03, uTime * 0.02));
  col *= 1.0 + mottle * 0.045;

  // drifting foam flecks / whitecaps
  float n1 = snoise(vWorldPos.xz * 0.8 * uFleckScale + vec2(uTime * 0.22, uTime * 0.13));
  float n2 = snoise(vWorldPos.xz * 1.9 * uFleckScale - vec2(uTime * 0.11, uTime * 0.19));
  float flecks = smoothstep(uFleckLo, uFleckHi, n1 * 0.6 + n2 * 0.4) * 0.75;

  // foam contour lines tracing the band boundaries
  float contour = 0.0;
  if (uContour > 0.5 && uBands > 0.5) {
    float edge = abs(fract(clamp(grad, 0.001, 0.999) * uBands) - 0.5);
    contour = smoothstep(0.40, 0.485, edge);
    contour *= 0.55 + 0.45 * snoise(vWorldPos.xz * 1.4 + vec2(uTime * 0.15, uTime * 0.1));
    contour *= step(dist, uGradFar); // not on open ocean
  }

  // extra churn where the water meets the beach
  float lap = smoothstep(uLap0, uLap1, dist) * (1.0 - smoothstep(uLap2, uLap3, dist));
  lap *= 0.5 + 0.5 * snoise(vWorldPos.xz * 0.8 + vec2(uTime * 0.35, uTime * 0.2));

  float foam = clamp(flecks + contour * 0.8 + lap * 0.75, 0.0, 1.0);
  col = mix(col, uFoam, foam);

  // sparkle glints
  if (uSparkle > 0.5) {
    float sp = snoise(vWorldPos.xz * 6.0 + vec2(uTime * 0.8, -uTime * 0.6));
    col += smoothstep(0.86, 0.97, sp) * 0.55;
  }

  csm_DiffuseColor = vec4(col, uOpacity);
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
      uFleckLo: { value: WATER_STYLE.fleckLo },
      uFleckHi: { value: WATER_STYLE.fleckHi },
      uFleckScale: { value: WATER_STYLE.fleckScale },
      uOpacity: { value: WATER_STYLE.opacity },
      uBands: { value: WATER_STYLE.bands },
      uBandSoft: { value: WATER_STYLE.bandSoft },
      uContour: { value: WATER_STYLE.contour },
      uSparkle: { value: WATER_STYLE.sparkle },
      uGradNear: { value: ISLAND_RADIUS * 0.53 },
      uGradFar: { value: ISLAND_RADIUS * 1.03 },
      uLap0: { value: ISLAND_RADIUS * 0.63 },
      uLap1: { value: ISLAND_RADIUS * 0.72 },
      uLap2: { value: ISLAND_RADIUS * 0.75 },
      uLap3: { value: ISLAND_RADIUS * 0.85 },
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
