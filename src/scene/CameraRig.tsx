import { useLayoutEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

export const PAD_CAMERA = new THREE.Vector3(78, 16, 90)
export const PAD_LOOK_AT = new THREE.Vector3(0, 27, 0)

/** Places the camera on the pad vantage. Cinematic tracking comes later. */
export function CameraRig() {
  const camera = useThree((state) => state.camera)

  useLayoutEffect(() => {
    camera.position.copy(PAD_CAMERA)
    camera.lookAt(PAD_LOOK_AT)
    camera.updateProjectionMatrix()
  }, [camera])

  return null
}
