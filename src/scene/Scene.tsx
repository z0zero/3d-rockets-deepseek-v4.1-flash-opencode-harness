import { Canvas } from '@react-three/fiber'
import { CameraRig } from './CameraRig'
import { Rocket } from './Rocket'
import { LaunchMount, PadSupport, Tower } from './Tower'
import { World } from './World'
import { Simulation } from '../launch/Simulation'

/** Root canvas composing the world, the launch complex and the vehicle. */
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
      <Tower />
      <LaunchMount />
      <PadSupport />
      <Rocket />
    </Canvas>
  )
}
