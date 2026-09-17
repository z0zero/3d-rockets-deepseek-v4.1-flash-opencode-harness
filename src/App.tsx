import { Canvas } from '@react-three/fiber'

export default function App() {
  return (
    <Canvas camera={{ position: [6, 4, 8], fov: 50 }}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 8, 5]} intensity={1.5} />
      <mesh>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#e8eef8" />
      </mesh>
    </Canvas>
  )
}
