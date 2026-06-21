import React from 'react'

const CONFIDENCE_COLORS = {
  high: { bar: 'bg-signal-green', text: 'text-signal-green', glow: 'shadow-glow' },
  medium: { bar: 'bg-signal-yellow', text: 'text-signal-yellow', glow: '' },
  low: { bar: 'bg-signal-red', text: 'text-signal-red', glow: 'shadow-glowRed' },
}

function getLevel(value) {
  if (value >= 70) return 'high'
  if (value >= 40) return 'medium'
  return 'low'
}

export default function ConfidenceBar({
  value = 0,
  showLabel = true,
  showPercent = true,
  label = 'Confidence',
  size = 'md',
  animate = true,
  className = '',
}) {
  const clamped = Math.min(100, Math.max(0, Number(value) || 0))
  const level = getLevel(clamped)
  const colors = CONFIDENCE_COLORS[level]

  const heightClass = size === 'sm' ? 'h-1' : size === 'lg' ? 'h-3' : 'h-1.5'
  const textClass = size === 'sm' ? 'text-[10px]' : size === 'lg' ? 'text-sm' : 'text-xs'

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {(showLabel || showPercent) && (
        <div className="flex items-center justify-between">
          {showLabel && (
            <span className={`${textClass} text-text-secondary font-medium`}>{label}</span>
          )}
          {showPercent && (
            <span className={`${textClass} font-semibold font-mono ${colors.text}`}>
              {clamped.toFixed(0)}%
            </span>
          )}
        </div>
      )}
      <div className={`w-full bg-bg-elevated rounded-full overflow-hidden ${heightClass}`}>
        <div
          className={`${heightClass} rounded-full ${colors.bar} ${animate ? 'transition-all duration-700 ease-out' : ''}`}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  )
}
