import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { MOUNT_HEIGHT } from '../launch/timeline'
import { getRocketAltitude } from '../launch/launchStore'
import { PAD } from './constants'

const ROCKET_BODY_RADIUS = 1.85

const MATERIALS = {
  white: { color: '#eef1f5', roughness: 0.5, metalness: 0.06 },
  lightGray: { color: '#c6ccd3', roughness: 0.55, metalness: 0.1 },
  dark: { color: '#2a2e35', roughness: 0.6, metalness: 0.15 },
  red: { color: '#b4372f', roughness: 0.55, metalness: 0.1 },
  metal: { color: '#6d747c', roughness: 0.35, metalness: 0.75 },
}

function useRocketMaterials() {
  return useMemo(() => {
    const make = (options: { color: string; roughness: number; metalness: number }) =>
      new THREE.MeshStandardMaterial(options)
    return {
      white: make(MATERIALS.white),
      lightGray: make(MATERIALS.lightGray),
      dark: make(MATERIALS.dark),
      red: make(MATERIALS.red),
      metal: make(MATERIALS.metal),
    }
  }, [])
}

function Fins({ material }: { material: THREE.Material }) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(1.6, 0)
    shape.lineTo(3.6, 0.4)
    shape.lineTo(1.75, 7.6)
    shape.lineTo(1.6, 7.6)
    shape.closePath()
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.32,
      bevelEnabled: false,
      curveSegments: 1,
    })
    geometry.translate(0, 0, -0.16)
    return geometry
  }, [])

  return (
    <group>
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={i}
          geometry={geometry}
          material={material}
          rotation={[0, (i * Math.PI) / 2, 0]}
          position={[0, 0.6, 0]}
          castShadow
        />
      ))}
    </group>
  )
}

/** Stylized two-stage launch vehicle, built entirely from primitives. */
export function RocketModel() {
  const materials = useRocketMaterials()

  const details = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => {
        const angle = (i * Math.PI * 2) / 9 + 0.35
        const y = 12 + ((i * 29) % 30)
        return {
          position: [
            Math.cos(angle) * (ROCKET_BODY_RADIUS + 0.05),
            y,
            Math.sin(angle) * (ROCKET_BODY_RADIUS + 0.05),
          ] as [number, number, number],
          rotation: -angle + Math.PI / 2,
          scale: [0.85 + (i % 3) * 0.25, 1.1 + (i % 2) * 0.8, 1] as [
            number,
            number,
            number,
          ],
        }
      }),
    [],
  )

  return (
    <group>
      {/* Engine bell and boat-tail */}
      <mesh position={[0, 1.2, 0]} material={materials.metal} castShadow>
        <cylinderGeometry args={[0.85, 1.45, 2.4, 20, 1, true]} />
      </mesh>
      <mesh position={[0, 3.8, 0]} material={materials.dark} castShadow>
        <cylinderGeometry args={[1.9, 1.9, 3.2, 24]} />
      </mesh>

      <Fins material={materials.dark} />

      {/* Body */}
      <mesh position={[0, 25.2, 0]} material={materials.white} castShadow receiveShadow>
        <cylinderGeometry args={[ROCKET_BODY_RADIUS, ROCKET_BODY_RADIUS, 37.6, 28]} />
      </mesh>

      {/* Interstage and accent bands */}
      <mesh position={[0, 6.4, 0]} material={materials.dark}>
        <cylinderGeometry args={[1.87, 1.87, 1.2, 28]} />
      </mesh>
      <mesh position={[0, 13.6, 0]} material={materials.red} castShadow>
        <cylinderGeometry args={[1.88, 1.88, 1.1, 28]} />
      </mesh>
      <mesh position={[0, 40.6, 0]} material={materials.red} castShadow>
        <cylinderGeometry args={[1.88, 1.88, 0.9, 28]} />
      </mesh>
      <mesh position={[0, 36.4, 0]} material={materials.dark}>
        <cylinderGeometry args={[1.87, 1.87, 1.6, 28]} />
      </mesh>

      {/* Segment rings */}
      {[10.2, 17.4, 23.6, 29.8, 33.4, 43.2].map((y) => (
        <mesh key={y} position={[0, y, 0]} material={materials.lightGray}>
          <cylinderGeometry args={[1.9, 1.9, 0.5, 28]} />
        </mesh>
      ))}

      {/* Surface details */}
      {details.map((detail, i) => (
        <mesh
          key={i}
          material={i % 4 === 0 ? materials.red : materials.dark}
          position={detail.position}
          rotation={[0, detail.rotation, 0]}
          scale={detail.scale}
        >
          <boxGeometry args={[0.85, 1.4, 0.3]} />
        </mesh>
      ))}

      {/* Nose cone and tip */}
      <mesh position={[0, 47.1, 0]} material={materials.white} castShadow>
        <coneGeometry args={[ROCKET_BODY_RADIUS, 6.2, 28]} />
      </mesh>
      <mesh position={[0, 50.6, 0]} material={materials.dark}>
        <coneGeometry args={[0.42, 1.1, 16]} />
      </mesh>
      <mesh position={[0, 51.4, 0]} material={materials.metal}>
        <cylinderGeometry args={[0.07, 0.07, 1.4, 6]} />
      </mesh>
    </group>
  )
}

/**
 * Positions the vehicle from the launch clock. Everything attached to the
 * engine (flame, smoke emitters) is parented here so it rides along.
 */
export function Rocket() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(() => {
    const group = groupRef.current
    if (!group) return
    group.position.y = PAD.padHeight + MOUNT_HEIGHT + getRocketAltitude()
  })

  return (
    <group
      ref={groupRef}
      position={[0, PAD.padHeight + MOUNT_HEIGHT, 0]}
      name="rocket"
    >
      <RocketModel />
    </group>
  )
}
