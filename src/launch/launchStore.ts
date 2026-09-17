import { create } from 'zustand'
import { MAX_STEP, altitudeAt, phaseAt, type Phase } from './timeline'

interface LaunchState {
  phase: Phase
  /** Start (or replay) the launch sequence. */
  launch: () => void
  /** Return the rocket to the pad. */
  reset: () => void
  /** Advance the simulation; called once per frame from inside the canvas. */
  tick: (dt: number) => void
}

/**
 * Authoritative clock lives outside React so per-frame consumers can read it
 * without triggering re-renders. Only phase changes go through the store.
 */
const sim = { t: 0 }

export const getLaunchTime = () => sim.t
export const getRocketAltitude = () => altitudeAt(sim.t)

export const useLaunchStore = create<LaunchState>((set, get) => ({
  phase: 'idle',
  launch: () => {
    sim.t = 0
    set({ phase: 'ignition' })
  },
  reset: () => {
    sim.t = 0
    set({ phase: 'idle' })
  },
  tick: (dt) => {
    const phase = get().phase
    if (phase === 'idle' || phase === 'complete') return
    sim.t += Math.min(dt, MAX_STEP)
    const next = phaseAt(sim.t)
    if (next !== phase) set({ phase: next })
  },
}))
