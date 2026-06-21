import React from 'react'
import Card, { CardHeader } from '../components/common/Card'
import { TestTube } from 'lucide-react'

export default function Backtest() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Backtester</h1>
        <p className="text-sm text-text-secondary mt-1">Test strategies on historical data</p>
      </div>
      <Card>
        <CardHeader title="Strategy Configuration" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {['Symbol', 'Start Date', 'End Date', 'Strategy', 'Initial Capital', 'Position Size'].map((f) => (
            <div key={f}>
              <label className="text-xs text-text-secondary mb-1 block">{f}</label>
              <input className="input-dark h-8 text-xs" placeholder={f} />
            </div>
          ))}
        </div>
        <div className="mt-4">
          <button className="btn-primary">Run Backtest</button>
        </div>
      </Card>
      <Card>
        <CardHeader title="Results" />
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <TestTube className="w-10 h-10 text-text-muted" />
          <p className="text-text-muted text-sm">Configure and run a backtest to see results</p>
        </div>
      </Card>
    </div>
  )
}
