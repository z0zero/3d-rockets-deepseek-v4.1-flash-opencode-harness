import { Canvas } from '@react-three/fiber'
import { CameraRig } from './CameraRig'
import { World } from './World'
import { Simulation } from '../launch/Simulation'

/** Root canvas. The launch vehicle and facilities are added on top of the world. */
export function Scene() {
  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 2]}
      camera={{ position: [44, 14, 52], fov: 45, near: 0.8, far: 20000 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <Simulation />
      <CameraRig />
      <World />
      {/* Placeholder mass simulator, replaced by the launch vehicle. */}
      <mesh position={[0, 32, 0]} castShadow>
        <cylinderGeometry args={[2, 2, 50, 24]} />
        <meshStandardMaterial color="#e8ecf1" roughness={0.6} />
      </mesh>
    </Canvas>
  )
}
