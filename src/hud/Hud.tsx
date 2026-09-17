import { PHASE_LABELS } from '../launch/timeline'
import { useLaunchStore } from '../launch/launchStore'
import './hud.css'

/** Overlay chrome: mission badge and current flight phase. */
export function Hud() {
  const phase = useLaunchStore((state) => state.phase)

  return (
    <div className="hud">
      <header className="hud__badge">
        <span className="hud__badge-dot" />
        <span className="hud__badge-name">OPUS V</span>
        <span className="hud__badge-sub">Heavy Lift Vehicle</span>
      </header>
      <div className={`hud__phase hud__phase--${phase}`}>
        <span className="hud__phase-label">FLIGHT STATUS</span>
        <strong className="hud__phase-value">{PHASE_LABELS[phase]}</strong>
      </div>
    </div>
  )
}
