import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import {
  IGNITION_DURATION,
  MAX_STEP,
  MOUNT_HEIGHT,
  altitudeAt,
  throttleAt,
  velocityAt,
} from '../launch/timeline'
import { getLaunchTime } from '../launch/launchStore'
import { PAD } from './constants'

/** Low vantage beside the launch mount, matching the reference framing. */
const PAD_CAMERA = new THREE.Vector3(78, 16, 90)
const ROCKET_BASE_Y = PAD.padHeight + MOUNT_HEIGHT
const BASE_FOV = 45

/** Follow offsets, tightened as the vehicle accelerates. */
const FOLLOW_WIDE = new THREE.Vector3(56, 14, 70)
const FOLLOW_TIGHT = new THREE.Vector3(50, 11, 62)

/**
 * Ground camera that pans up as the vehicle rises, then hands over to a
 * tracking shot that keeps the rocket framed against the sky.
 */
export function CameraRig() {
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera
  const size = useThree((state) => state.size)
  const lookTarget = useRef(new THREE.Vector3(0, ROCKET_BASE_Y + 26, 0))
  const groundPosition = useRef(new THREE.Vector3())
  const followPosition = useRef(new THREE.Vector3())
  const desiredLook = useRef(new THREE.Vector3())
  const lastFov = useRef(BASE_FOV)

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, MAX_STEP)
    const t = getLaunchTime()
    const altitude = altitudeAt(t)
    const velocity = velocityAt(t)
    const throttle = throttleAt(t)
    const baseY = ROCKET_BASE_Y + altitude
    const midY = baseY + 26

    // Hand over from the pad vantage to the tracking shot as the rocket climbs.
    const blend = THREE.MathUtils.smoothstep(altitude, 40, 210)
    const speedK = THREE.MathUtils.clamp(velocity / 260, 0, 1)

    groundPosition.current.set(
      PAD_CAMERA.x,
      PAD_CAMERA.y + altitude * 0.05,
      PAD_CAMERA.z,
    )
    followPosition.current.set(
      THREE.MathUtils.lerp(FOLLOW_WIDE.x, FOLLOW_TIGHT.x, speedK),
      baseY + THREE.MathUtils.lerp(FOLLOW_WIDE.y, FOLLOW_TIGHT.y, speedK),
      THREE.MathUtils.lerp(FOLLOW_WIDE.z, FOLLOW_TIGHT.z, speedK),
    )

    camera.position.lerpVectors(
      groundPosition.current,
      followPosition.current,
      blend,
    )

    // The ground camera trails the vehicle slightly, so the rocket climbs up
    // the frame before the shot catches up. Once tracking takes over the aim
    // is exact, otherwise a lag would push the vehicle out of frame at speed.
    const dampedY = THREE.MathUtils.damp(lookTarget.current.y, midY, 2.2, dt)
    lookTarget.current.y = THREE.MathUtils.clamp(dampedY, midY - 45, midY)
    const aimedY = THREE.MathUtils.lerp(lookTarget.current.y, midY, blend)
    desiredLook.current.set(0, aimedY, 0)

    // Engine rumble: strongest while the plume is hammering the pad.
    const ignitionShake =
      t > 0 && t < IGNITION_DURATION
        ? Math.pow(1 - t / IGNITION_DURATION, 2) * 1.1
        : 0
    const burnShake = throttle * Math.max(0, 1 - altitude / 600) * 0.34
    const shake = ignitionShake + burnShake
    const shakeX =
      Math.sin(t * 37.1) * Math.sin(t * 11.3 + 1.2) * shake
    const shakeY =
      Math.sin(t * 41.7 + 2.1) * Math.sin(t * 9.4) * shake
    const shakeZ = Math.sin(t * 29.3 + 0.7) * shake * 0.6

    camera.lookAt(
      desiredLook.current.x + shakeX * 0.4,
      desiredLook.current.y + shakeY * 0.4,
      desiredLook.current.z + shakeZ * 0.4,
    )
    camera.position.x += shakeX * 0.8
    camera.position.y += shakeY * 0.8
    camera.position.z += shakeZ * 0.4

    // Gentle roll keeps the ascent from feeling mechanical.
    camera.rotateZ(Math.sin(t * 0.21) * 0.016 * blend)

    if (import.meta.env.DEV) {
      const globals = window as unknown as Record<string, unknown>
      const samples = (globals.__rigSamples ??= [] as unknown[]) as unknown[]
      samples.push({
        wall: Number(performance.now().toFixed(0)),
        t: Number(t.toFixed(3)),
        dt: Number(dt.toFixed(4)),
        D: Math.round(midY),
        L: Math.round(desiredLook.current.y),
      })
      if (samples.length > 12) samples.shift()
      globals.__rig = samples
    }

    // Keep the vehicle framed on narrow windows and add a little punch at speed.
    const aspect = size.width / Math.max(1, size.height)
    const fovScale =
      aspect >= 1.5 ? 1 : Math.min(1.5, Math.pow(1.5 / aspect, 0.45))
    const fov = (BASE_FOV + speedK * 4) * fovScale
    if (Math.abs(fov - lastFov.current) > 0.01) {
      camera.fov = fov
      camera.updateProjectionMatrix()
      lastFov.current = fov
    }
  })

  return null
}
