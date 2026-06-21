import React from 'react'
import Card, { CardHeader } from '../components/common/Card'
import SignalBadge from '../components/common/SignalBadge'
import ConfidenceBar from '../components/common/ConfidenceBar'
import { ScanSearch } from 'lucide-react'

export default function Screener() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Stock Screener</h1>
        <p className="text-sm text-text-secondary mt-1">Filter and scan for trading opportunities</p>
      </div>
      <Card>
        <CardHeader title="Screener Filters" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {['Min Price', 'Max Price', 'Min Volume', 'Sector', 'Signal Type', 'Min Confidence'].map((f) => (
            <div key={f}>
              <label className="text-xs text-text-secondary mb-1 block">{f}</label>
              <input className="input-dark h-8 text-xs" placeholder={f} />
            </div>
          ))}
        </div>
        <div className="mt-4">
          <button className="btn-primary">Run Screener</button>
        </div>
      </Card>
      <Card>
        <CardHeader title="Results" subtitle="Configure filters and run screener" />
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <ScanSearch className="w-10 h-10 text-text-muted" />
          <p className="text-text-muted text-sm">Run the screener to see results</p>
        </div>
      </Card>
    </div>
  )
}
