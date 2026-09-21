import { type LucideIcon, AlertOctagon, AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import type { RiskItem } from '@/lib/api'

interface SeverityConfig {
  icon: LucideIcon
  label: string
  className: string
}

const SEVERITY_CONFIG: Record<RiskItem['severity'], SeverityConfig> = {
  high:   { icon: AlertOctagon,  label: 'High risk',   className: 'severity-high' },
  medium: { icon: AlertTriangle, label: 'Medium risk', className: 'severity-medium' },
  low:    { icon: CheckCircle2,  label: 'Low risk',    className: 'severity-low' },
  info:   { icon: Info,          label: 'Info',        className: 'severity-info' },
}

interface RiskBadgeProps {
  severity: RiskItem['severity']
}

/**
 * Severity is always communicated via vector icon + text label in brand color system.
 * Never color alone — following the design spec.
 */
export default function RiskBadge({ severity }: RiskBadgeProps) {
  const config = SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.info
  const Icon = config.icon

  return (
    <span className={`severity-chip ${config.className}`} role="status" aria-label={config.label}>
      <Icon size={13} strokeWidth={2.2} aria-hidden />
      <span>{config.label}</span>
    </span>
  )
}
