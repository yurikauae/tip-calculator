import React from 'react'
import Card from '../components/common/Card'
import { TrendingUp, Shield, Zap, BookOpen } from 'lucide-react'

export default function About() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">About TradingDash</h1>
        <p className="text-sm text-text-secondary mt-1">Professional signal dashboard</p>
      </div>
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-signal-green/10 border border-signal-green/30 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-signal-green" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-text-primary">TradingDash v1.0</h2>
            <p className="text-xs text-text-secondary">Professional Trading Signal Dashboard</p>
          </div>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">
          TradingDash is a professional-grade trading signal dashboard providing real-time market analysis,
          technical indicators, paper trading simulation, and AI-powered signals to help you make informed
          investment decisions.
        </p>
      </Card>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Zap, title: 'AI Signals', desc: 'Machine learning powered buy/sell/hold signals with confidence scores' },
          { icon: Shield, title: 'Paper Trading', desc: 'Practice strategies risk-free with simulated $100,000 portfolio' },
          { icon: BookOpen, title: 'Backtesting', desc: 'Test your strategies against years of historical market data' },
        ].map(({ icon: Icon, title, desc }) => (
          <Card key={title}>
            <Icon className="w-5 h-5 text-signal-green mb-2" />
            <h3 className="text-sm font-semibold text-text-primary mb-1">{title}</h3>
            <p className="text-xs text-text-secondary leading-relaxed">{desc}</p>
          </Card>
        ))}
      </div>
      <Card>
        <div className="flex items-start gap-2 p-3 bg-signal-yellow/5 border border-signal-yellow/20 rounded-lg">
          <Shield className="w-4 h-4 text-signal-yellow mt-0.5 flex-shrink-0" />
          <p className="text-xs text-signal-yellow leading-relaxed">
            <strong>Disclaimer:</strong> TradingDash is for informational and educational purposes only.
            Nothing on this platform constitutes financial advice. All trading involves risk. Past performance
            is not indicative of future results. Always consult a licensed financial advisor.
          </p>
        </div>
      </Card>
    </div>
  )
}
