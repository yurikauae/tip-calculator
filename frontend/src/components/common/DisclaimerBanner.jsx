import React, { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import useStore from '../../store/useStore'

export default function DisclaimerBanner() {
  const { updateSettings } = useStore()
  const [dismissed, setDismissed] = useState(false)

  const handleDismiss = () => {
    setDismissed(true)
    updateSettings({ showDisclaimerBanner: false })
  }

  if (dismissed) return null

  return (
    <div
      className="flex items-center gap-2 px-4 py-2 bg-signal-yellow/5 border-b border-signal-yellow/20
                 text-signal-yellow flex-shrink-0"
      role="alert"
    >
      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
      <p className="text-[11px] font-medium flex-1">
        <strong>Not financial advice.</strong> All signals and analysis are for informational
        purposes only. Past performance does not guarantee future results. Always do your own
        research and consult a licensed financial advisor before making investment decisions.
      </p>
      <button
        onClick={handleDismiss}
        className="text-signal-yellow/60 hover:text-signal-yellow transition-colors ml-2 flex-shrink-0"
        title="Dismiss"
        aria-label="Dismiss disclaimer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
