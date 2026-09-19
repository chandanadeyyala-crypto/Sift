import type { RiskItem } from '@/lib/api'

const SEVERITY_CONFIG: Record<RiskItem['severity'], { icon: string; label: string; className: string }> = {
  high:   { icon: '🔴', label: 'High risk',   className: 'severity-high' },
  medium: { icon: '🟡', label: 'Medium risk', className: 'severity-medium' },
  low:    { icon: '🟢', label: 'Low risk',    className: 'severity-low' },
  info:   { icon: 'ℹ️',  label: 'Info',        className: 'severity-info' },
}

interface RiskBadgeProps {
  severity: RiskItem['severity']
}

/**
 * Severity is always communicated via icon + text label.
 * Never colour alone — following the spec.
 */
export default function RiskBadge({ severity }: RiskBadgeProps) {
  const { icon, label, className } = SEVERITY_CONFIG[severity]
  return (
    <span className={`severity-chip ${className}`} role="status" aria-label={label}>
      <span aria-hidden="true">{icon}</span>
      {label}
    </span>
  )
}
