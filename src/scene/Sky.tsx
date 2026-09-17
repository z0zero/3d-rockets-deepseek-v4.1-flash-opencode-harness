import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const vertexShader = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  varying vec3 vDir;
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  uniform vec3 uSunColor;
  uniform vec3 uSunDir;

  void main() {
    vec3 dir = normalize(vDir);
    float h = clamp(dir.y, -0.1, 1.0);

    // Vertical gradient with a compressed band near the horizon.
    float t = smoothstep(-0.01, 0.30, h);
    vec3 color = mix(uHorizon, uZenith, t);
    color = mix(color, uZenith, smoothstep(0.30, 0.9, h) * 0.4);

    // Broad sun bloom plus a tighter core.
    float sun = max(dot(dir, normalize(uSunDir)), 0.0);
    color += uSunColor * pow(sun, 6.0) * 0.18;
    color += uSunColor * pow(sun, 90.0) * 0.5;

    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`

interface SkyProps {
  sunDirection: [number, number, number]
}

/** Gradient sky dome that follows the camera so the horizon never shifts. */
export function Sky({ sunDirection }: SkyProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const camera = useThree((state) => state.camera)

  const uniforms = useMemo(
    () => ({
      uZenith: { value: new THREE.Color('#1a67d6') },
      uHorizon: { value: new THREE.Color('#d8ecfd') },
      uSunColor: { value: new THREE.Color('#fff3d6') },
      uSunDir: { value: new THREE.Vector3(...sunDirection) },
    }),
    [sunDirection],
  )

  useFrame(() => {
    meshRef.current?.position.copy(camera.position)
  })

  return (
    <mesh ref={meshRef} frustumCulled={false} renderOrder={-1000}>
      <sphereGeometry args={[14000, 32, 24]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={THREE.BackSide}
        depthWrite={false}
        fog={false}
        toneMapped={false}
      />
    </mesh>
  )
}
