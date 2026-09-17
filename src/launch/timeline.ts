export type Phase = 'idle' | 'ignition' | 'liftoff' | 'ascent' | 'complete'

/** Seconds of engine spool-up before the rocket leaves the pad. */
export const IGNITION_DURATION = 3.4
/** Altitude (m) at which the rocket is considered clear of the pad. */
export const LIFTOFF_ALTITUDE = 55
/** Altitude (m) at which the launch sequence ends. */
export const MECO_ALTITUDE = 5200

export const ROCKET_HEIGHT = 51
/** Height of the hold-down mount the rocket sits on. */
export const MOUNT_HEIGHT = 7

const A_MAX = 12
const SPOOL = 3

/** Seconds since the launch command. */
function burnTime(t: number) {
  return t - IGNITION_DURATION
}

/** Altitude in meters, integrated from a smoothly spooling acceleration. */
export function altitudeAt(t: number): number {
  const t2 = burnTime(t)
  if (t2 <= 0) return 0
  return (
    A_MAX *
    ((t2 * t2) / 2 - SPOOL * t2 + SPOOL * SPOOL * (1 - Math.exp(-t2 / SPOOL)))
  )
}

/** Vertical speed in m/s. */
export function velocityAt(t: number): number {
  const t2 = burnTime(t)
  if (t2 <= 0) return 0
  return A_MAX * (t2 - SPOOL * (1 - Math.exp(-t2 / SPOOL)))
}

/** Engine thrust level, 0..1. Spools up, then eases off near the end. */
export function throttleAt(t: number): number {
  if (t <= 0) return 0
  if (t < IGNITION_DURATION) {
    const k = t / IGNITION_DURATION
    return Math.min(1, Math.pow(k, 1.5) * 1.15)
  }
  const t2 = burnTime(t)
  return 1 - Math.min(0.35, Math.max(0, (t2 - 24) / 40))
}

export function phaseAt(t: number): Phase {
  if (t <= 0) return 'idle'
  if (t < IGNITION_DURATION) return 'ignition'
  const altitude = altitudeAt(t)
  if (altitude < LIFTOFF_ALTITUDE) return 'liftoff'
  if (altitude < MECO_ALTITUDE) return 'ascent'
  return 'complete'
}

export const PHASE_LABELS: Record<Phase, string> = {
  idle: 'HOLD',
  ignition: 'IGNITION',
  liftoff: 'LIFTOFF',
  ascent: 'ASCENT',
  complete: 'MECO',
}
