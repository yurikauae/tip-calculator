import { useMemo, useState } from 'react'
import { AlertTriangle, Calculator, ShieldCheck } from 'lucide-react'

const RISK_LEVELS = [0.5, 1, 2]

function money(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0)
}

export default function RiskCalculator() {
  const [balance, setBalance] = useState(10000)
  const [riskPercent, setRiskPercent] = useState(1)
  const [entry, setEntry] = useState('')
  const [stop, setStop] = useState('')
  const [target, setTarget] = useState('')

  const result = useMemo(() => {
    const account = Number(balance)
    const entryPrice = Number(entry)
    const stopPrice = Number(stop)
    const targetPrice = Number(target)
    const riskAmount = account * (riskPercent / 100)
    const stopDistance = Math.abs(entryPrice - stopPrice)
    const units = stopDistance > 0 ? riskAmount / stopDistance : 0
    const rewardDistance = Math.abs(targetPrice - entryPrice)
    const riskReward = stopDistance > 0 && rewardDistance > 0 ? rewardDistance / stopDistance : 0
    return { riskAmount, stopDistance, units, riskReward }
  }, [balance, riskPercent, entry, stop, target])

  const invalidDirection = Number(entry) > 0 && Number(stop) > 0 && Number(entry) === Number(stop)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Calculator className="text-signal-green" /> Position Size & Risk
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Size a paper trade from the amount you can afford to lose at the stop.
        </p>
      </div>

      <div className="rounded-xl border border-signal-yellow/30 bg-signal-yellowDim p-4 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-signal-yellow shrink-0" />
        <p className="text-sm text-signal-yellow">
          Leveraged forex, crypto and CFD trading can cause major losses. This calculator is educational,
          does not model every fee or gap, and is not financial advice.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="bg-bg-card border border-border rounded-xl p-5 space-y-5">
          <Field label="Account balance" value={balance} onChange={setBalance} />
          <div>
            <label className="text-sm text-text-secondary block mb-2">Risk per trade</label>
            <div className="grid grid-cols-3 gap-2">
              {RISK_LEVELS.map((level) => (
                <button
                  key={level}
                  onClick={() => setRiskPercent(level)}
                  className={`rounded-lg py-2 border text-sm font-semibold ${
                    riskPercent === level
                      ? 'border-signal-green bg-signal-greenDim text-signal-green'
                      : 'border-border text-text-secondary hover:border-border-bright'
                  }`}
                >
                  {level}%
                </button>
              ))}
            </div>
          </div>
          <Field label="Entry price" value={entry} onChange={setEntry} />
          <Field label="Stop loss" value={stop} onChange={setStop} />
          <Field label="Take profit" value={target} onChange={setTarget} />
        </section>

        <section className="bg-bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <ShieldCheck className="w-5 h-5 text-signal-green" />
            <h2 className="font-semibold text-text-primary">Calculated limits</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Maximum loss" value={money(result.riskAmount)} tone="red" />
            <Metric label="Position units" value={result.units ? result.units.toFixed(2) : '—'} />
            <Metric label="Stop distance" value={result.stopDistance ? result.stopDistance.toFixed(5) : '—'} />
            <Metric
              label="Risk / reward"
              value={result.riskReward ? `1 : ${result.riskReward.toFixed(2)}` : '—'}
              tone={result.riskReward >= 1.5 ? 'green' : 'yellow'}
            />
          </div>

          {(riskPercent > 1 || (result.riskReward > 0 && result.riskReward < 1.5) || invalidDirection) && (
            <div className="mt-4 rounded-lg border border-signal-yellow/30 bg-signal-yellowDim p-3 text-xs text-signal-yellow space-y-1">
              {riskPercent > 1 && <p>Risk above 1% is less conservative and compounds drawdowns faster.</p>}
              {result.riskReward > 0 && result.riskReward < 1.5 && <p>Risk/reward is below 1:1.5.</p>}
              {invalidDirection && <p>Entry and stop loss cannot be equal.</p>}
            </div>
          )}

          <p className="text-xs text-text-muted mt-5">
            Server-side paper-trade controls reject positions risking more than 2% of equity and stop new
            trades after the daily loss limit is reached.
          </p>
        </section>
      </div>
    </div>
  )
}

function Field({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="text-sm text-text-secondary block mb-1.5">{label}</span>
      <input
        type="number"
        min="0"
        step="any"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="input-dark"
      />
    </label>
  )
}

function Metric({ label, value, tone }) {
  const color = tone === 'red'
    ? 'text-signal-red'
    : tone === 'green'
      ? 'text-signal-green'
      : tone === 'yellow'
        ? 'text-signal-yellow'
        : 'text-text-primary'
  return (
    <div className="rounded-lg bg-bg-elevated border border-border p-4">
      <div className="text-xs text-text-muted mb-1">{label}</div>
      <div className={`font-mono text-xl font-semibold ${color}`}>{value}</div>
    </div>
  )
}
