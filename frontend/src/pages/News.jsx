import React from 'react'
import Card, { CardHeader } from '../components/common/Card'
import { Newspaper, ExternalLink } from 'lucide-react'

const MOCK_NEWS = [
  { id: 1, title: 'Fed signals potential rate cuts in 2024 as inflation cools', source: 'Reuters', time: '2h ago', sentiment: 'positive', symbols: ['SPY', 'QQQ'] },
  { id: 2, title: 'NVIDIA surpasses $2 trillion market cap on AI demand', source: 'Bloomberg', time: '4h ago', sentiment: 'positive', symbols: ['NVDA'] },
  { id: 3, title: 'Tesla deliveries miss Q1 estimates, shares fall premarket', source: 'CNBC', time: '5h ago', sentiment: 'negative', symbols: ['TSLA'] },
  { id: 4, title: 'Apple unveils new M4 chip lineup ahead of WWDC', source: 'MacRumors', time: '8h ago', sentiment: 'positive', symbols: ['AAPL'] },
]

export default function News() {
  const sentimentColor = (s) =>
    s === 'positive' ? 'text-signal-green' : s === 'negative' ? 'text-signal-red' : 'text-signal-yellow'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Market News</h1>
        <p className="text-sm text-text-secondary mt-1">Latest financial news and sentiment</p>
      </div>
      <div className="space-y-3">
        {MOCK_NEWS.map((n) => (
          <Card key={n.id} hover>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary leading-snug">{n.title}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-text-muted">{n.source}</span>
                  <span className="text-xs text-text-muted">{n.time}</span>
                  <span className={`text-xs font-medium capitalize ${sentimentColor(n.sentiment)}`}>{n.sentiment}</span>
                  <div className="flex gap-1">
                    {n.symbols.map((s) => (
                      <span key={s} className="text-[10px] font-mono bg-bg-elevated border border-border px-1.5 py-0.5 rounded text-text-secondary">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-text-muted flex-shrink-0 mt-1" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
