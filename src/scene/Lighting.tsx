import { SUN_DIRECTION } from './constants'

/** Key light, sky bounce and the shadow setup that grounds the pad. */
export function Lighting() {
  return (
    <>
      <hemisphereLight args={['#bcd8ff', '#6f7f52', 1.15]} />
      <ambientLight intensity={0.25} />
      <directionalLight
        position={[
          SUN_DIRECTION[0] * 120,
          SUN_DIRECTION[1] * 120,
          SUN_DIRECTION[2] * 120,
        ]}
        intensity={2.1}
        color="#fff6e6"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={10}
        shadow-camera-far={420}
        shadow-camera-left={-150}
        shadow-camera-right={150}
        shadow-camera-top={150}
        shadow-camera-bottom={-150}
        shadow-normalBias={0.35}
        shadow-bias={-0.0004}
      />
    </>
  )
}
