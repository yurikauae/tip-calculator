import React from 'react'
import Card, { CardHeader, CardStat } from '../components/common/Card'
import { Briefcase } from 'lucide-react'

export default function Portfolio() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Portfolio</h1>
        <p className="text-sm text-text-secondary mt-1">Track your holdings and performance</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardStat label="Total Value" value="$0.00" /></Card>
        <Card><CardStat label="Day P&L" value="$0.00" /></Card>
        <Card><CardStat label="Total Return" value="0.00%" /></Card>
        <Card><CardStat label="Positions" value="0" /></Card>
      </div>
      <Card>
        <CardHeader title="Holdings" />
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <Briefcase className="w-10 h-10 text-text-muted" />
          <p className="text-text-muted text-sm">No holdings to display</p>
          <p className="text-text-muted text-xs">Connect your broker or use paper trading</p>
        </div>
      </Card>
    </div>
  )
}
