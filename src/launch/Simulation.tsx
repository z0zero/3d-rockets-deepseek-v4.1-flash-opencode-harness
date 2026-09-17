import { useFrame } from '@react-three/fiber'
import { useLaunchStore } from './launchStore'

/** Advances the launch clock exactly once per frame, before other consumers. */
export function Simulation() {
  useFrame((_, delta) => {
    useLaunchStore.getState().tick(delta)
  })
  return null
}
