import { ReactNode } from 'react'
import { clsx } from 'clsx'
import { GlassCard } from './GlassCard'

interface StatCardProps {
  title: string
  value: string | number
  icon: ReactNode
  trend?: string
  trendUp?: boolean
  className?: string
  color?: string
}

export function StatCard({ title, value, icon, trend, trendUp, className, color = 'from-neon-blue to-neon-purple' }: StatCardProps) {
  return (
    <GlassCard className={clsx('relative overflow-hidden', className)}>
      <div className={clsx(
        'absolute top-0 right-0 w-24 h-24 opacity-10',
        'bg-gradient-to-br', color,
        'rounded-full -translate-y-1/2 translate-x-1/2'
      )} />
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="text-3xl font-bold font-mono text-gradient">{value}</p>
          {trend && (
            <p className={clsx(
              'text-xs font-medium',
              trendUp ? 'text-neon-cyan' : 'text-neon-red'
            )}>
              {trendUp ? '↑' : '↓'} {trend}
            </p>
          )}
        </div>
        <div className={clsx(
          'p-3 rounded-lg bg-white/5 border border-white/10',
        )}>
          {icon}
        </div>
      </div>
    </GlassCard>
  )
}
