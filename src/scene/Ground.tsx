import { useMemo } from 'react'
import * as THREE from 'three'
import { mulberry32 } from '../lib/random'
import { InstancedField } from './InstancedField'
import { PAD } from './constants'

const GRASS = '#7ba94b'
const CONCRETE = '#c8ccd0'
const PAD_TOP = '#b7bcc0'
const POOL = '#4fb0e4'
const HILL = '#4d6f3c'
const TREE = '#3f6335'
const ROAD = '#9aa0a6'

/** Rolling horizon, distant treeline, service buildings and the pad apron. */
export function Ground() {
  const trees = useMemo(() => {
    const rand = mulberry32(1337)
    return Array.from({ length: 340 }, () => {
      const angle = rand() * Math.PI * 2
      const radius = 220 + Math.pow(rand(), 0.85) * 1700
      return {
        position: [
          Math.cos(angle) * radius,
          0,
          Math.sin(angle) * radius,
        ] as [number, number, number],
        scale: 7 + rand() * 16,
        squash: 0.5 + rand() * 0.4,
        hue: rand(),
      }
    })
  }, [])

  const hills = useMemo(() => {
    const rand = mulberry32(20240)
    return Array.from({ length: 14 }, () => {
      const angle = rand() * Math.PI * 2
      const radius = 3600 + rand() * 5200
      return {
        position: [
          Math.cos(angle) * radius,
          -60 - rand() * 60,
          Math.sin(angle) * radius,
        ] as [number, number, number],
        scale: [900 + rand() * 1400, 90 + rand() * 150, 900 + rand() * 1400] as [
          number,
          number,
          number,
        ],
      }
    })
  }, [])

  const buildings = useMemo(() => {
    const rand = mulberry32(99)
    return Array.from({ length: 15 }, (_, i) => {
      const angle = (i / 15) * Math.PI * 2 + rand() * 0.4
      const radius = 380 + rand() * 1100
      return {
        position: [
          Math.cos(angle) * radius,
          0,
          Math.sin(angle) * radius,
        ] as [number, number, number],
        size: [18 + rand() * 34, 12 + rand() * 26, 18 + rand() * 34] as [
          number,
          number,
          number,
        ],
        rotation: rand() * Math.PI,
      }
    })
  }, [])

  const treeGeometry = useMemo(() => new THREE.SphereGeometry(1, 7, 5), [])
  const hillGeometry = useMemo(() => new THREE.SphereGeometry(1, 20, 14), [])
  const buildingGeometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), [])

  const treeMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: TREE,
        roughness: 0.95,
        flatShading: true,
      }),
    [],
  )
  const hillMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: HILL,
        roughness: 1,
        flatShading: true,
      }),
    [],
  )
  const buildingMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#e7ebef',
        roughness: 0.85,
      }),
    [],
  )

  return (
    <group>
      {/* Grass plain out to the horizon */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[12000, 64]} />
        <meshStandardMaterial color={GRASS} roughness={1} />
      </mesh>

      {/* Concrete apron and the bright deluge pool around the pad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <circleGeometry args={[PAD.apronRadius, 64]} />
        <meshStandardMaterial color={CONCRETE} roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <circleGeometry args={[PAD.poolRadius, 64]} />
        <meshStandardMaterial
          color={POOL}
          roughness={0.18}
          metalness={0.15}
        />
      </mesh>

      {/* Access road heading away from the complex */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 620]}>
        <planeGeometry args={[26, 1200]} />
        <meshStandardMaterial color={ROAD} roughness={0.95} />
      </mesh>

      <InstancedField
        count={trees.length}
        geometry={treeGeometry}
        material={treeMaterial}
        build={(i, dummy) => {
          const tree = trees[i]
          dummy.position.set(...tree.position)
          dummy.scale.set(tree.scale, tree.scale * tree.squash, tree.scale)
          dummy.rotation.y = tree.hue * Math.PI
        }}
      />

      <InstancedField
        count={hills.length}
        geometry={hillGeometry}
        material={hillMaterial}
        build={(i, dummy) => {
          const hill = hills[i]
          dummy.position.set(...hill.position)
          dummy.scale.set(...hill.scale)
        }}
      />

      <InstancedField
        count={buildings.length}
        geometry={buildingGeometry}
        material={buildingMaterial}
        build={(i, dummy) => {
          const building = buildings[i]
          dummy.position.set(...building.position)
          dummy.position.y = building.size[1] / 2
          dummy.rotation.y = building.rotation
          dummy.scale.set(...building.size)
        }}
        castShadow
      />

      {/* Pad deck raises the vehicle above the deluge pool */}
      <mesh position={[0, PAD.padHeight / 2, 0]} receiveShadow castShadow>
        <cylinderGeometry
          args={[PAD.padRadius, PAD.padRadius + 1.5, PAD.padHeight, 64]}
        />
        <meshStandardMaterial color={PAD_TOP} roughness={0.9} />
      </mesh>
    </group>
  )
}
