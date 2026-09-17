import { useMemo } from 'react'
import * as THREE from 'three'
import { orientBeam } from '../lib/geometry'
import { MOUNT_HEIGHT } from '../launch/timeline'
import { InstancedField } from './InstancedField'
import { PAD } from './constants'

const TOWER = {
  center: new THREE.Vector3(-11.5, 0, 0),
  half: 7.5,
  height: 68,
  levels: 11,
}

const WHITE = '#eef1f5'
const RED = '#c8452f'
const DARK_RED = '#a33325'

const WHITE_METAL = '#dfe4e8'

/** Lattice service tower with platforms, crane and propellant lines. */
export function Tower() {
  const masts = useMemo(() => {
    const { center, half, height } = TOWER
    return [
      new THREE.Vector3(center.x - half, 0, center.z - half),
      new THREE.Vector3(center.x + half, 0, center.z - half),
      new THREE.Vector3(center.x - half, 0, center.z + half),
      new THREE.Vector3(center.x + half, 0, center.z + half),
    ].map((base) => ({
      base,
      top: new THREE.Vector3(base.x, height, base.z),
    }))
  }, [])

  const beams = useMemo(() => {
    const list: Array<{ a: THREE.Vector3; b: THREE.Vector3; t: number }> = []
    const { height, levels, half, center } = TOWER
    const step = height / levels

    // Vertical masts
    for (const mast of masts) list.push({ a: mast.base, b: mast.top, t: 1.0 })

    // Ring beams and cross bracing between levels
    for (let level = 0; level < levels; level++) {
      const y0 = level * step
      const y1 = (level + 1) * step
      const corners = [
        [center.x - half, center.z - half],
        [center.x + half, center.z - half],
        [center.x + half, center.z + half],
        [center.x - half, center.z + half],
      ]

      for (let i = 0; i < 4; i++) {
        const [x0, z0] = corners[i]
        const [x1, z1] = corners[(i + 1) % 4]
        list.push({
          a: new THREE.Vector3(x0, y0, z0),
          b: new THREE.Vector3(x1, y0, z1),
          t: 0.75,
        })
        list.push({
          a: new THREE.Vector3(x0, y0, z0),
          b: new THREE.Vector3(x1, y1, z1),
          t: 0.5,
        })
      }
    }
    return list
  }, [masts])

  const beamGeometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), [])
  const beamMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: WHITE, roughness: 0.7, metalness: 0.1 }),
    [],
  )
  const redMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: RED, roughness: 0.65 }),
    [],
  )
  const whiteMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: WHITE_METAL,
        roughness: 0.6,
        metalness: 0.25,
      }),
    [],
  )

  const platforms = useMemo(
    () => [14, 30, 46, 62].map((y) => y),
    [],
  )

  const redBeams = useMemo(() => {
    const { half, center } = TOWER
    const list: Array<{ a: THREE.Vector3; b: THREE.Vector3; t: number }> = []
    for (const y of [2.5, 34, 66]) {
      list.push({
        a: new THREE.Vector3(center.x - half, y, center.z - half),
        b: new THREE.Vector3(center.x + half, y, center.z + half),
        t: 0.6,
      })
    }
    return list
  }, [])

  const { center, half, height } = TOWER
  const craneTip = new THREE.Vector3(center.x + half + 17, height - 2, center.z)

  return (
    <group>
      <InstancedField
        count={beams.length}
        geometry={beamGeometry}
        material={beamMaterial}
        build={(i, dummy) => {
          const beam = beams[i]
          orientBeam(dummy, beam.a, beam.b, beam.t)
        }}
        castShadow
      />

      <InstancedField
        count={redBeams.length}
        geometry={beamGeometry}
        material={redMaterial}
        build={(i, dummy) => {
          const beam = redBeams[i]
          orientBeam(dummy, beam.a, beam.b, beam.t)
        }}
        castShadow
      />

      {/* Platforms */}
      {platforms.map((y) => (
        <mesh
          key={y}
          position={[center.x, y, center.z]}
          material={whiteMaterial}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[half * 2 + 1.6, 0.45, half * 2 + 1.6]} />
        </mesh>
      ))}

      {/* Crane arm and cable */}
      <mesh
        position={[(center.x + half + craneTip.x) / 2, height - 2, center.z]}
        material={whiteMaterial}
        castShadow
      >
        <boxGeometry args={[craneTip.x - (center.x + half), 0.9, 1.4]} />
      </mesh>
      <mesh position={[craneTip.x, height - 8, craneTip.z]} material={whiteMaterial}>
        <cylinderGeometry args={[0.12, 0.12, 12, 6]} />
      </mesh>
      <mesh position={[craneTip.x, height - 14.6, craneTip.z]} material={redMaterial}>
        <boxGeometry args={[1.4, 1.6, 1.4]} />
      </mesh>

      {/* Hazard-striped panel near the top, echoing the reference tower */}
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={i}
          position={[center.x - half - 0.3, 55 + i * 1.5, center.z]}
          material={i % 2 === 0 ? redMaterial : whiteMaterial}
        >
          <boxGeometry args={[0.3, 1.5, 6]} />
        </mesh>
      ))}

      {/* Propellant lines running up the mast */}
      <mesh position={[center.x - half - 0.9, height / 2, center.z + half - 1.4]}>
        <cylinderGeometry args={[0.45, 0.45, height, 10]} />
        <meshStandardMaterial color="#2f7fd0" roughness={0.5} />
      </mesh>
      <mesh position={[center.x - half - 0.9, height / 2, center.z + half + 0.2]}>
        <cylinderGeometry args={[0.3, 0.3, height * 0.82, 10]} />
        <meshStandardMaterial color="#e8b83a" roughness={0.5} />
      </mesh>
    </group>
  )
}

/** Steel hold-down mount the vehicle sits on, with a flame trench below. */
export function LaunchMount() {
  const legs = useMemo(() => {
    const count = 8
    const bottomRadius = 8.2
    const topRadius = 5.4
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + Math.PI / count
      return {
        a: new THREE.Vector3(
          Math.cos(angle) * bottomRadius,
          PAD.padHeight,
          Math.sin(angle) * bottomRadius,
        ),
        b: new THREE.Vector3(
          Math.cos(angle) * topRadius,
          PAD.padHeight + MOUNT_HEIGHT,
          Math.sin(angle) * topRadius,
        ),
      }
    })
  }, [])

  const braces = useMemo(() => {
    const list: Array<{ a: THREE.Vector3; b: THREE.Vector3; t: number }> = []
    const levelYs = [2.4, 4.6]
    for (const levelY of levelYs) {
      for (let i = 0; i < 8; i++) {
        const a0 = (i / 8) * Math.PI * 2 + Math.PI / 8
        const a1 = ((i + 1) / 8) * Math.PI * 2 + Math.PI / 8
        const r = 8.2 - (levelY / MOUNT_HEIGHT) * 2.8
        const p0 = new THREE.Vector3(
          Math.cos(a0) * r,
          PAD.padHeight + levelY,
          Math.sin(a0) * r,
        )
        const p1 = new THREE.Vector3(
          Math.cos(a1) * r,
          PAD.padHeight + levelY,
          Math.sin(a1) * r,
        )
        list.push({ a: p0, b: p1, t: 0.5 })
      }
    }
    return list
  }, [])

  const boxGeometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), [])
  const frameMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: RED, roughness: 0.6, metalness: 0.2 }),
    [],
  )
  const darkFrameMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: DARK_RED, roughness: 0.65, metalness: 0.2 }),
    [],
  )

  return (
    <group>
      {/* Flame trench */}
      <mesh position={[0, PAD.padHeight + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[9.5, 32]} />
        <meshStandardMaterial color="#14161a" roughness={1} />
      </mesh>

      <InstancedField
        count={legs.length}
        geometry={boxGeometry}
        material={frameMaterial}
        build={(i, dummy) => {
          orientBeam(dummy, legs[i].a, legs[i].b, 1.0)
        }}
        castShadow
      />

      <InstancedField
        count={braces.length}
        geometry={boxGeometry}
        material={darkFrameMaterial}
        build={(i, dummy) => {
          const brace = braces[i]
          orientBeam(dummy, brace.a, brace.b, brace.t)
        }}
        castShadow
      />

      {/* Top ring the vehicle rests on */}
      <mesh
        position={[0, PAD.padHeight + MOUNT_HEIGHT - 0.4, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={frameMaterial}
        castShadow
      >
        <torusGeometry args={[5.4, 0.55, 8, 8]} />
      </mesh>
      <mesh
        position={[0, PAD.padHeight + 1.2, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={darkFrameMaterial}
      >
        <torusGeometry args={[8.2, 0.45, 6, 8]} />
      </mesh>
    </group>
  )
}

/** Small ground-support clutter that sells the scale of the pad. */
export function PadSupport() {
  const pipeMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#f2f4f6', roughness: 0.5, metalness: 0.15 }),
    [],
  )
  const tankMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#e3e7ea', roughness: 0.55, metalness: 0.2 }),
    [],
  )

  const pipes = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * Math.PI * 2 + 0.4
        return {
          position: [
            Math.cos(angle) * 46,
            PAD.padHeight + 0.5,
            Math.sin(angle) * 46,
          ] as [number, number, number],
          rotation: angle,
        }
      }),
    [],
  )

  return (
    <group>
      {pipes.map((pipe, i) => (
        <mesh
          key={i}
          position={pipe.position}
          rotation={[0, -pipe.rotation, Math.PI / 2]}
          material={pipeMaterial}
          castShadow
        >
          <cylinderGeometry args={[0.55, 0.55, 22, 8]} />
        </mesh>
      ))}

      {[
        [46, 14, -42],
        [-52, 17, 38],
        [16, 12, 62],
        [-24, 15, -58],
      ].map(([x, y, z], i) => (
        <mesh key={i} position={[x, PAD.padHeight + y / 2, z]} material={tankMaterial} castShadow>
          <cylinderGeometry args={[1.9, 1.9, y, 12]} />
        </mesh>
      ))}
    </group>
  )
}
