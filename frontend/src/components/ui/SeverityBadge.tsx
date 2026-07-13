import { clsx } from 'clsx'

interface SeverityBadgeProps {
  severity: string
  size?: 'sm' | 'md' | 'lg'
}

const severityConfig: Record<string, { class: string; label: string }> = {
  critical: { class: 'severity-critical', label: 'CRITICAL' },
  high: { class: 'severity-high', label: 'HIGH' },
  medium: { class: 'severity-medium', label: 'MEDIUM' },
  low: { class: 'severity-low', label: 'LOW' },
  info: { class: 'severity-info', label: 'INFO' },
}

export function SeverityBadge({ severity, size = 'sm' }: SeverityBadgeProps) {
  const config = severityConfig[severity] || severityConfig.info
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  }

  return (
    <span className={clsx(
      'inline-flex items-center font-mono font-semibold rounded-md',
      config.class,
      sizeClasses[size]
    )}>
      <span className={clsx(
        'w-1.5 h-1.5 rounded-full mr-1.5',
        severity === 'critical' && 'bg-neon-red animate-pulse-glow',
        severity === 'high' && 'bg-neon-amber',
        severity === 'medium' && 'bg-yellow-400',
        severity === 'low' && 'bg-neon-cyan',
        severity === 'info' && 'bg-gray-400',
      )} />
      {config.label}
    </span>
  )
}
