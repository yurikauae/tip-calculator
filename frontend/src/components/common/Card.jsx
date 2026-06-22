import React from 'react'

export default function Card({
  children,
  className = '',
  padding = true,
  hover = false,
  glow = false,
  onClick,
  as: Tag = 'div',
  ...props
}) {
  return (
    <Tag
      className={`
        bg-bg-card border border-border rounded-xl
        ${padding ? 'p-4' : ''}
        ${hover ? 'hover:border-border-bright hover:bg-bg-elevated transition-all duration-150 cursor-pointer' : ''}
        ${glow ? 'border-signal-green/20 shadow-glow' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
      {...props}
    >
      {children}
    </Tag>
  )
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      <div>
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        {subtitle && (
          <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  )
}

export function CardStat({ label, value, change, changeLabel, icon: Icon, valueClass = '' }) {
  const isPositive = typeof change === 'number' ? change >= 0 : change?.toString().startsWith('+')
  const changeColor = isPositive ? 'text-signal-green' : 'text-signal-red'

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="stat-label">{label}</span>
        {Icon && <Icon className="w-3.5 h-3.5 text-text-muted" />}
      </div>
      <span className={`stat-value ${valueClass}`}>{value ?? 'â€”'}</span>
      {change !== undefined && (
        <span className={`text-xs font-medium ${changeColor}`}>
          {typeof change === 'number'
            ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`
            : change}
          {changeLabel && (
            <span className="text-text-muted font-normal ml-1">{changeLabel}</span>
          )}
        </span>
      )}
    </div>
  )
}

export function CardEmpty({ message = 'No data available', icon: Icon }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
      {Icon && <Icon className="w-8 h-8 text-text-muted" />}
      <p className="text-text-muted text-sm">{message}</p>
    </div>
  )
}

export function CardDivider({ className = '' }) {
  return <div className={`border-t border-border my-4 ${className}`} />
}
