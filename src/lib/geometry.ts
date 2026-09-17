import * as THREE from 'three'

const UP = new THREE.Vector3(0, 1, 0)

/**
 * Orients an object so a unit-height box spans from `from` to `to`.
 * Used to build lattice structures from a single instanced box.
 */
export function orientBeam(
  target: THREE.Object3D,
  from: THREE.Vector3,
  to: THREE.Vector3,
  thickness: number,
) {
  target.position.copy(from).add(to).multiplyScalar(0.5)
  const direction = new THREE.Vector3().subVectors(to, from)
  const length = direction.length()
  target.quaternion.setFromUnitVectors(UP, direction.normalize())
  target.scale.set(thickness, length, thickness)
}
