import { useEffect, useRef } from 'react'
import { PHASE_LABELS } from '../launch/timeline'
import {
  getLaunchTime,
  getRocketAltitude,
  useLaunchStore,
} from '../launch/launchStore'
import { velocityAt } from '../launch/timeline'
import './hud.css'

function formatClock(seconds: number) {
  const clamped = Math.max(0, seconds)
  const whole = Math.floor(clamped)
  const tenths = Math.floor((clamped - whole) * 10)
  const minutes = Math.floor(whole / 60)
  const secs = whole % 60
  return `T+${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`
}

/** Live telemetry, updated outside React so the frame rate stays untouched. */
function Telemetry() {
  const clockRef = useRef<HTMLSpanElement>(null)
  const altitudeRef = useRef<HTMLSpanElement>(null)
  const velocityRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let frame = 0
    const update = () => {
      const t = getLaunchTime()
      if (clockRef.current) clockRef.current.textContent = formatClock(t)
      if (altitudeRef.current) {
        altitudeRef.current.textContent = `${Math.round(
          getRocketAltitude(),
        ).toLocaleString('en-US')} m`
      }
      if (velocityRef.current) {
        velocityRef.current.textContent = `${Math.round(velocityAt(t))} m/s`
      }
      frame = requestAnimationFrame(update)
    }
    frame = requestAnimationFrame(update)
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <dl className="hud__telemetry">
      <div>
        <dt>MET</dt>
        <dd>
          <span ref={clockRef}>T+00:00.0</span>
        </dd>
      </div>
      <div>
        <dt>Altitude</dt>
        <dd>
          <span ref={altitudeRef}>0 m</span>
        </dd>
      </div>
      <div>
        <dt>Velocity</dt>
        <dd>
          <span ref={velocityRef}>0 m/s</span>
        </dd>
      </div>
    </dl>
  )
}

/** Overlay chrome: flight status, telemetry and launch control. */
export function Hud() {
  const phase = useLaunchStore((state) => state.phase)
  const launch = useLaunchStore((state) => state.launch)
  const reset = useLaunchStore((state) => state.reset)

  const flying = phase === 'ignition' || phase === 'liftoff' || phase === 'ascent'

  return (
    <div className="hud">
      <div className={`hud__phase hud__phase--${phase}`}>
        <span className="hud__phase-label">Flight status</span>
        <strong className="hud__phase-value">{PHASE_LABELS[phase]}</strong>
      </div>

      <Telemetry />

      <div className="hud__controls">
        {phase === 'idle' ? (
          <button type="button" className="hud__button" onClick={launch}>
            Launch
          </button>
        ) : (
          <button
            type="button"
            className="hud__button hud__button--ghost"
            onClick={reset}
            disabled={flying}
          >
            {flying ? 'In flight' : 'Reset'}
          </button>
        )}
        <p className="hud__hint">
          {phase === 'idle'
            ? 'Vehicle is on the pad — press Launch to begin the countdown.'
            : phase === 'complete'
              ? 'Second stage cutoff. Reset to return to the pad.'
              : 'Main engine burning.'}
        </p>
      </div>
    </div>
  )
}
