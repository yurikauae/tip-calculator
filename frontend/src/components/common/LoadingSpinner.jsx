import React from 'react'

const SIZE_MAP = {
  xs: 'w-3 h-3 border',
  sm: 'w-4 h-4 border',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-2',
  xl: 'w-12 h-12 border-2',
}

const COLOR_MAP = {
  green: 'border-signal-green border-t-transparent',
  red: 'border-signal-red border-t-transparent',
  yellow: 'border-signal-yellow border-t-transparent',
  white: 'border-white border-t-transparent',
  muted: 'border-text-muted border-t-transparent',
}

export default function LoadingSpinner({
  size = 'md',
  color = 'green',
  label = 'Loading...',
  fullPage = false,
  className = '',
}) {
  const spinner = (
    <div
      className={`rounded-full animate-spin flex-shrink-0 ${SIZE_MAP[size] || SIZE_MAP.md} ${COLOR_MAP[color] || COLOR_MAP.green} ${className}`}
      role="status"
      aria-label={label}
    />
  )

  if (fullPage) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[200px] gap-3">
        {spinner}
        {label && (
          <p className="text-text-secondary text-sm animate-pulse">{label}</p>
        )}
      </div>
    )
  }

  return spinner
}

export function LoadingOverlay({ label = 'Loading...' }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg-primary/80 backdrop-blur-sm z-10 rounded-xl gap-3">
      <LoadingSpinner size="lg" />
      {label && <p className="text-text-secondary text-sm">{label}</p>}
    </div>
  )
}

export function LoadingRows({ rows = 5, cols = 4 }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-2.5">
          {Array.from({ length: cols }).map((_, j) => (
            <div
              key={j}
              className="h-3.5 rounded bg-bg-elevated animate-pulse flex-1"
              style={{ animationDelay: `${(i * cols + j) * 50}ms` }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
