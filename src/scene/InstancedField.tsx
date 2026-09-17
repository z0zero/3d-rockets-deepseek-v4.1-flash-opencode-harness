import { useLayoutEffect, useRef, type ReactNode } from 'react'
import * as THREE from 'three'

interface InstancedFieldProps {
  count: number
  geometry: THREE.BufferGeometry
  material: THREE.Material
  build: (index: number, dummy: THREE.Object3D) => void
  castShadow?: boolean
  children?: ReactNode
}

/**
 * Renders a static set of transforms with a single draw call. Used for the
 * repetitive scenery (trees, tower beams, distant buildings).
 */
export function InstancedField({
  count,
  geometry,
  material,
  build,
  castShadow = false,
}: InstancedFieldProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const buildRef = useRef(build)
  buildRef.current = build

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const dummy = new THREE.Object3D()
    for (let i = 0; i < count; i++) {
      dummy.position.set(0, 0, 0)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.set(1, 1, 1)
      buildRef.current(i, dummy)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [count])

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      castShadow={castShadow}
      receiveShadow
    />
  )
}
