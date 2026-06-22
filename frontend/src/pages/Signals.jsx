import React from 'react'
import Card, { CardHeader } from '../components/common/Card'
import SignalBadge from '../components/common/SignalBadge'
import ConfidenceBar from '../components/common/ConfidenceBar'
import { Zap } from 'lucide-react'

const MOCK_SIGNALS = [
  { symbol: 'NVDA', signal: 'Strong Buy', confidence: 88, price: 875.32, change: 3.2 },
  { symbol: 'TSLA', signal: 'Buy', confidence: 71, price: 185.60, change: 1.8 },
  { symbol: 'AAPL', signal: 'Hold', confidence: 62, price: 189.25, change: 0.4 },
  { symbol: 'META', signal: 'Sell', confidence: 74, price: 502.10, change: -1.2 },
  { symbol: 'AMZN', signal: 'Buy', confidence: 68, price: 185.90, change: 2.1 },
  { symbol: 'MSFT', signal: 'Strong Buy', confidence: 82, price: 415.30, change: 1.5 },
]

export default function Signals() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Signals</h1>
        <p className="text-sm text-text-secondary mt-1">AI-generated trading signals</p>
      </div>
      <Card padding={false}>
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-text-primary">All Signals</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="table-header">
              <th className="px-4 py-3 text-left">Symbol</th>
              <th className="px-4 py-3 text-left">Signal</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3 text-right">Change</th>
              <th className="px-4 py-3 text-right">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_SIGNALS.map((row) => (
              <tr key={row.symbol} className="table-row">
                <td className="px-4 py-3 font-mono text-sm font-semibold text-text-primary">{row.symbol}</td>
                <td className="px-4 py-3"><SignalBadge signal={row.signal} size="xs" /></td>
                <td className="px-4 py-3 text-right font-mono text-sm text-text-primary">${row.price.toFixed(2)}</td>
                <td className={`px-4 py-3 text-right text-sm font-mono ${row.change >= 0 ? 'text-signal-green' : 'text-signal-red'}`}>
                  {row.change >= 0 ? '+' : ''}{row.change.toFixed(2)}%
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-20">
                      <ConfidenceBar value={row.confidence} showLabel={false} size="sm" />
                    </div>
                    <span className="text-xs font-mono text-text-secondary w-8">{row.confidence}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
