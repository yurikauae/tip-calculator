import React from 'react'
import { useParams } from 'react-router-dom'
import Card from '../components/common/Card'
import useStore from '../store/useStore'
import { BarChart2 } from 'lucide-react'

const TIMEFRAMES = ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y']

export default function Chart() {
  const { symbol: paramSymbol } = useParams()
  const { selectedSymbol, setSelectedSymbol, timeframe, setTimeframe } = useStore()
  const symbol = paramSymbol || selectedSymbol

  React.useEffect(() => {
    if (paramSymbol) setSelectedSymbol(paramSymbol)
  }, [paramSymbol])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Chart â€” {symbol}</h1>
          <p className="text-sm text-text-secondary mt-1">Technical analysis and price history</p>
        </div>
        <div className="flex gap-1">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${
                timeframe === tf
                  ? 'bg-signal-green text-bg-primary'
                  : 'text-text-secondary hover:text-text-primary bg-bg-elevated border border-border'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>
      <Card>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <BarChart2 className="w-12 h-12 text-text-muted" />
          <p className="text-text-muted text-sm">Chart for {symbol} ({timeframe})</p>
          <p className="text-text-muted text-xs">Connect backend to render OHLCV data via Recharts</p>
        </div>
      </Card>
    </div>
  )
}
