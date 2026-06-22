import React from 'react'
import { TrendingUp, TrendingDown, Minus, ChevronsUp, ChevronsDown, Clock } from 'lucide-react'

const SIGNAL_CONFIG = {
  'Strong Buy': {
    color: 'text-signal-green',
    bg: 'bg-signal-green/15',
    border: 'border-signal-green/30',
    icon: ChevronsUp,
    dot: 'bg-signal-green',
  },
  'Buy': {
    color: 'text-signal-green',
    bg: 'bg-signal-green/10',
    border: 'border-signal-green/20',
    icon: TrendingUp,
    dot: 'bg-signal-green',
  },
  'Hold': {
    color: 'text-signal-yellow',
    bg: 'bg-signal-yellow/10',
    border: 'border-signal-yellow/20',
    icon: Minus,
    dot: 'bg-signal-yellow',
  },
  'Wait': {
    color: 'text-text-secondary',
    bg: 'bg-bg-elevated',
    border: 'border-border',
    icon: Clock,
    dot: 'bg-text-secondary',
  },
  'Sell': {
    color: 'text-signal-red',
    bg: 'bg-signal-red/10',
    border: 'border-signal-red/20',
    icon: TrendingDown,
    dot: 'bg-signal-red',
  },
  'Strong Sell': {
    color: 'text-signal-red',
    bg: 'bg-signal-red/15',
    border: 'border-signal-red/30',
    icon: ChevronsDown,
    dot: 'bg-signal-red',
  },
}

const FALLBACK_CONFIG = {
  color: 'text-text-muted',
  bg: 'bg-bg-elevated',
  border: 'border-border',
  icon: Minus,
  dot: 'bg-text-muted',
}

const SIZE_CLASSES = {
  xs: {
    wrapper: 'px-1.5 py-0.5 text-[10px] gap-1 rounded',
    icon: 'w-2.5 h-2.5',
    dot: 'w-1.5 h-1.5',
  },
  sm: {
    wrapper: 'px-2 py-1 text-xs gap-1.5 rounded-md',
    icon: 'w-3 h-3',
    dot: 'w-2 h-2',
  },
  md: {
    wrapper: 'px-2.5 py-1.5 text-xs gap-1.5 rounded-lg',
    icon: 'w-3.5 h-3.5',
    dot: 'w-2 h-2',
  },
  lg: {
    wrapper: 'px-3 py-2 text-sm gap-2 rounded-lg',
    icon: 'w-4 h-4',
    dot: 'w-2.5 h-2.5',
  },
}

export default function SignalBadge({
  signal,
  size = 'sm',
  showIcon = true,
  showDot = false,
  className = '',
}) {
  const normalizedSignal =
    signal
      ? signal
          .toString()
          .split('_')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ')
      : null

  const config = SIGNAL_CONFIG[normalizedSignal] || FALLBACK_CONFIG
  const sizeConfig = SIZE_CLASSES[size] || SIZE_CLASSES.sm
  const Icon = config.icon

  return (
    <span
      className={`
        inline-flex items-center font-semibold border
        ${config.color} ${config.bg} ${config.border}
        ${sizeConfig.wrapper}
        ${className}
      `}
    >
      {showDot && (
        <span className={`rounded-full flex-shrink-0 ${config.dot} ${sizeConfig.dot}`} />
      )}
      {showIcon && !showDot && (
        <Icon className={`flex-shrink-0 ${sizeConfig.icon}`} />
      )}
      {normalizedSignal || 'N/A'}
    </span>
  )
}
