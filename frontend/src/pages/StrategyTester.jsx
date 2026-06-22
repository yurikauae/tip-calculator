import React, { useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Play, Save, TrendingUp, TrendingDown, BarChart2, RefreshCw, ChevronDown } from 'lucide-react';

// --- Math helpers ---

function generateCandles(symbol, count) {
  const seeds = { EURUSD: 1.08, GBPUSD: 1.27, BTCUSD: 43000, XAUUSD: 2000, SPX500: 4800, ETHUSD: 2300 };
  const volatility = { EURUSD: 0.0008, GBPUSD: 0.001, BTCUSD: 400, XAUUSD: 8, SPX500: 30, ETHUSD: 50 };
  let price = seeds[symbol] || 1.0;
  const vol = volatility[symbol] || 0.001;
  const candles = [];
  let seedVal = Object.keys(seeds).indexOf(symbol) + 1;

  function seededRandom() {
    seedVal = (seedVal * 1664525 + 1013904223) & 0xffffffff;
    return (seedVal >>> 0) / 0xffffffff;
  }

  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const change = (seededRandom() - 0.495) * vol * 2;
    price = Math.max(price * (1 + change), price * 0.98);
    const open = price;
    const close = price * (1 + (seededRandom() - 0.5) * vol * 0.5);
    const high = Math.max(open, close) * (1 + seededRandom() * vol * 0.3);
    const low = Math.min(open, close) * (1 - seededRandom() * vol * 0.3);
    price = close;
    candles.push({
      open, high, low, close,
      date: new Date(now - (count - i) * 4 * 60 * 60 * 1000).toISOString().slice(0, 10),
    });
  }
  return candles;
}

function calcEMA(closes, period) {
  const k = 2 / (period + 1);
  const ema = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) { ema.push(null); continue; }
    if (i === period - 1) {
      const avg = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
      ema.push(avg);
      continue;
    }
    ema.push(closes[i] * k + ema[i - 1] * (1 - k));
  }
  return ema;
}

function calcRSI(closes, period = 14) {
  const rsi = new Array(closes.length).fill(null);
  if (closes.length < period + 1) return rsi;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff; else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  rsi[period] = 100 - 100 / (1 + (avgLoss === 0 ? Infinity : avgGain / avgLoss));
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const g = diff > 0 ? diff : 0;
    const l = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + g) / period;
    avgLoss = (avgLoss * (period - 1) + l) / period;
    rsi[i] = 100 - 100 / (1 + (avgLoss === 0 ? Infinity : avgGain / avgLoss));
  }
  return rsi;
}

function runBacktest(symbol, candleCount, fastPeriod, slowPeriod, useRSIFilter) {
  const candles = generateCandles(symbol, candleCount);
  const closes = candles.map(c => c.close);
  const fastEMA = calcEMA(closes, fastPeriod);
  const slowEMA = calcEMA(closes, slowPeriod);
  const rsi = calcRSI(closes, 14);

  const trades = [];
  let inTrade = null;
  const MAX_HOLD = 50;

  for (let i = slowPeriod; i < candles.length; i++) {
    if (fastEMA[i] === null || slowEMA[i] === null) continue;
    if (fastEMA[i - 1] === null || slowEMA[i - 1] === null) continue;

    const prevCross = fastEMA[i - 1] - slowEMA[i - 1];
    const currCross = fastEMA[i] - slowEMA[i];

    if (inTrade) {
      const holdBars = i - inTrade.entryIdx;
      const exitSignal = inTrade.direction === 'BUY' ? currCross < 0 : currCross > 0;
      if (exitSignal || holdBars >= MAX_HOLD) {
        const entryPrice = inTrade.entryPrice;
        const exitPrice = candles[i].close;
        const pnlPct = inTrade.direction === 'BUY'
          ? (exitPrice - entryPrice) / entryPrice * 100
          : (entryPrice - exitPrice) / entryPrice * 100;
        trades.push({
          id: trades.length + 1,
          direction: inTrade.direction,
          entryDate: candles[inTrade.entryIdx].date,
          exitDate: candles[i].date,
          entryPrice,
          exitPrice,
          pnlPct,
        });
        inTrade = null;
      }
    }

    if (!inTrade) {
      if (prevCross < 0 && currCross > 0) {
        const rsiOk = !useRSIFilter || rsi[i] === null || rsi[i] < 60;
        if (rsiOk) {
          inTrade = { direction: 'BUY', entryPrice: candles[i].close, entryIdx: i };
        }
      } else if (prevCross > 0 && currCross < 0) {
        inTrade = { direction: 'SELL', entryPrice: candles[i].close, entryIdx: i };
      }
    }
  }

  if (trades.length === 0) {
    return { trades: [], wins: 0, losses: 0, totalPnl: 0, maxDrawdown: 0, profitFactor: 0, sharpeRatio: 0, recoveryFactor: 0, equityCurve: [] };
  }

  const wins = trades.filter(t => t.pnlPct > 0).length;
  const losses = trades.filter(t => t.pnlPct <= 0).length;
  const grossWin = trades.filter(t => t.pnlPct > 0).reduce((s, t) => s + t.pnlPct, 0);
  const grossLoss = Math.abs(trades.filter(t => t.pnlPct <= 0).reduce((s, t) => s + t.pnlPct, 0));
  const totalPnl = trades.reduce((s, t) => s + t.pnlPct, 0);

  let equity = 100;
  let peak = 100;
  let maxDrawdown = 0;
  const equityCurve = [{ trade: 0, equity: 100 }];
  for (let i = 0; i < trades.length; i++) {
    equity += trades[i].pnlPct;
    if (equity > peak) peak = equity;
    const dd = (peak - equity) / peak * 100;
    if (dd > maxDrawdown) maxDrawdown = dd;
    equityCurve.push({ trade: i + 1, equity: parseFloat(equity.toFixed(2)) });
  }

  const returns = trades.map(t => t.pnlPct);
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
  const std = Math.sqrt(variance);
  const sharpeRatio = std === 0 ? 0 : mean / std;
  const profitFactor = grossLoss === 0 ? grossWin : grossWin / grossLoss;
  const recoveryFactor = maxDrawdown === 0 ? 0 : totalPnl / maxDrawdown;

  return { trades, wins, losses, totalPnl, maxDrawdown, profitFactor, sharpeRatio, recoveryFactor, equityCurve };
}

// --- Sub-components ---

function StatCard({ label, value, color }) {
  return (
    <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4 flex flex-col gap-1">
      <span className="text-xs text-gray-400 uppercase tracking-wider">{label}</span>
      <span className="text-xl font-bold" style={{ color: color || '#e5e7eb' }}>{value}</span>
    </div>
  );
}

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1f2937] border border-[#374151] rounded-lg px-3 py-2 text-xs">
        <p className="text-gray-300">Trade #{payload[0].payload.trade}</p>
        <p style={{ color: '#00d4aa' }}>Equity: {payload[0].value}%</p>
      </div>
    );
  }
  return null;
}

// --- Main component ---

export default function StrategyTester() {
  const SYMBOLS = ['EURUSD', 'GBPUSD', 'BTCUSD', 'XAUUSD', 'SPX500', 'ETHUSD'];

  const [symbol, setSymbol] = useState('EURUSD');
  const [candleCount, setCandleCount] = useState(200);
  const [fastPeriod, setFastPeriod] = useState(9);
  const [slowPeriod, setSlowPeriod] = useState(21);
  const [useRSIFilter, setUseRSIFilter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [savedResults, setSavedResults] = useState([]);
  const [symbolOpen, setSymbolOpen] = useState(false);

  const handleRunBacktest = useCallback(() => {
    setLoading(true);
    setResult(null);
    setTimeout(() => {
      const res = runBacktest(symbol, candleCount, fastPeriod, slowPeriod, useRSIFilter);
      setResult({ ...res, symbol, candleCount, fastPeriod, slowPeriod, useRSIFilter });
      setLoading(false);
    }, 800);
  }, [symbol, candleCount, fastPeriod, slowPeriod, useRSIFilter]);

  const handleSave = useCallback(() => {
    if (!result) return;
    const entry = {
      ...result,
      timestamp: new Date().toLocaleString(),
      id: Date.now(),
    };
    setSavedResults(prev => [entry, ...prev].slice(0, 3));
  }, [result]);

  const winRate = result && result.trades.length > 0
    ? (result.wins / result.trades.length * 100).toFixed(1)
    : '0.0';

  const pnlColor = result && result.totalPnl >= 0 ? '#00d4aa' : '#ff4757';

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-gray-100 p-6 font-sans">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <BarChart2 className="text-[#00d4aa]" size={32} />
            Strategy Tester
          </h1>
          <p className="text-gray-400 mt-1 text-sm">EMA Crossover Backtester with RSI Filter</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Config Panel */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-5 space-y-5">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Configuration</h2>

              {/* Symbol Selector */}
              <div>
                <label className="text-xs text-gray-400 mb-2 block">Symbol</label>
                <div className="relative">
                  <button
                    onClick={() => setSymbolOpen(o => !o)}
                    className="w-full bg-[#0a0e1a] border border-[#1f2937] rounded-lg px-4 py-2.5 text-left flex items-center justify-between hover:border-[#374151] transition-colors"
                  >
                    <span className="font-medium text-white">{symbol}</span>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${symbolOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {symbolOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-[#111827] border border-[#1f2937] rounded-lg overflow-hidden shadow-xl">
                      {SYMBOLS.map(s => (
                        <button
                          key={s}
                          onClick={() => { setSymbol(s); setSymbolOpen(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[#1f2937] transition-colors ${s === symbol ? 'text-[#00d4aa]' : 'text-gray-200'}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Candle Count */}
              <div>
                <label className="text-xs text-gray-400 mb-2 flex justify-between">
                  <span>Candle Count</span>
                  <span className="text-[#00d4aa] font-semibold">{candleCount}</span>
                </label>
                <input
                  type="range" min={100} max={500} step={10}
                  value={candleCount}
                  onChange={e => setCandleCount(Number(e.target.value))}
                  className="w-full accent-[#00d4aa] cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1"><span>100</span><span>500</span></div>
              </div>

              {/* Fast EMA */}
              <div>
                <label className="text-xs text-gray-400 mb-2 flex justify-between">
                  <span>Fast EMA Period</span>
                  <span className="text-[#ffa502] font-semibold">{fastPeriod}</span>
                </label>
                <input
                  type="range" min={5} max={20} step={1}
                  value={fastPeriod}
                  onChange={e => {
                    const v = Number(e.target.value);
                    setFastPeriod(v);
                    if (v >= slowPeriod) setSlowPeriod(Math.min(v + 1, 100));
                  }}
                  className="w-full accent-[#ffa502] cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1"><span>5</span><span>20</span></div>
              </div>

              {/* Slow EMA */}
              <div>
                <label className="text-xs text-gray-400 mb-2 flex justify-between">
                  <span>Slow EMA Period</span>
                  <span className="text-[#ffa502] font-semibold">{slowPeriod}</span>
                </label>
                <input
                  type="range" min={20} max={100} step={1}
                  value={slowPeriod}
                  onChange={e => {
                    const v = Number(e.target.value);
                    setSlowPeriod(v);
                    if (v <= fastPeriod) setFastPeriod(Math.max(v - 1, 5));
                  }}
                  className="w-full accent-[#ffa502] cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1"><span>20</span><span>100</span></div>
              </div>

              {/* RSI Filter Toggle */}
              <div className="flex items-center justify-between bg-[#0a0e1a] rounded-lg px-4 py-3 border border-[#1f2937]">
                <div>
                  <p className="text-sm text-gray-200 font-medium">RSI Filter</p>
                  <p className="text-xs text-gray-400">Buy only when RSI &lt; 60</p>
                </div>
                <button
                  onClick={() => setUseRSIFilter(v => !v)}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${useRSIFilter ? 'bg-[#00d4aa]' : 'bg-[#374151]'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${useRSIFilter ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Run Button */}
              <button
                onClick={handleRunBacktest}
                disabled={loading}
                className="w-full bg-[#00d4aa] hover:bg-[#00bfa0] disabled:opacity-50 disabled:cursor-not-allowed text-[#0a0e1a] font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? (
                  <><RefreshCw size={18} className="animate-spin" /> Running...</>
                ) : (
                  <><Play size={18} /> Run Backtest</>
                )}
              </button>
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2 space-y-4">
            {!result && !loading && (
              <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-10 flex flex-col items-center justify-center text-center">
                <BarChart2 size={48} className="text-[#1f2937] mb-4" />
                <p className="text-gray-400 text-lg">Configure your strategy and run a backtest</p>
                <p className="text-gray-600 text-sm mt-2">Results will appear here</p>
              </div>
            )}

            {loading && (
              <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-10 flex flex-col items-center justify-center">
                <RefreshCw size={40} className="text-[#00d4aa] animate-spin mb-4" />
                <p className="text-gray-300">Simulating strategy...</p>
              </div>
            )}

            {result && !loading && (
              <>
                {/* Stat Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard label="Total Trades" value={result.trades.length} />
                  <StatCard
                    label="Win Rate"
                    value={`${winRate}%`}
                    color={parseFloat(winRate) >= 50 ? '#00d4aa' : '#ff4757'}
                  />
                  <StatCard
                    label="Total P&L"
                    value={`${result.totalPnl >= 0 ? '+' : ''}${result.totalPnl.toFixed(2)}%`}
                    color={pnlColor}
                  />
                  <StatCard
                    label="Max Drawdown"
                    value={`-${result.maxDrawdown.toFixed(2)}%`}
                    color="#ff4757"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <StatCard
                    label="Profit Factor"
                    value={result.profitFactor.toFixed(2)}
                    color={result.profitFactor >= 1 ? '#00d4aa' : '#ff4757'}
                  />
                  <StatCard
                    label="Sharpe Ratio"
                    value={result.sharpeRatio.toFixed(2)}
                    color={result.sharpeRatio >= 0 ? '#ffa502' : '#ff4757'}
                  />
                  <StatCard
                    label="Recovery Factor"
                    value={result.recoveryFactor.toFixed(2)}
                    color={result.recoveryFactor >= 1 ? '#00d4aa' : '#ffa502'}
                  />
                </div>

                {/* Equity Curve */}
                <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Equity Curve</h3>
                  {result.equityCurve.length > 1 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={result.equityCurve} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="trade" tick={{ fill: '#6b7280', fontSize: 11 }} />
                        <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} domain={['auto', 'auto']} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="equity"
                          stroke="#00d4aa"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4, fill: '#00d4aa' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-8">Not enough trades to display equity curve</p>
                  )}
                </div>

                {/* Trade List */}
                <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Trade List</h3>
                    <span className="text-xs text-gray-500">{result.trades.length} trades</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-gray-500 border-b border-[#1f2937]">
                          <th className="text-left py-2 pr-3">#</th>
                          <th className="text-left py-2 pr-3">Entry</th>
                          <th className="text-left py-2 pr-3">Exit</th>
                          <th className="text-left py-2 pr-3">Dir</th>
                          <th className="text-right py-2 pr-3">Entry Px</th>
                          <th className="text-right py-2 pr-3">Exit Px</th>
                          <th className="text-right py-2">P&L%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.trades.slice(0, 20).map(t => (
                          <tr key={t.id} className="border-b border-[#1f2937] hover:bg-[#0a0e1a] transition-colors">
                            <td className="py-2 pr-3 text-gray-400">{t.id}</td>
                            <td className="py-2 pr-3 text-gray-300">{t.entryDate}</td>
                            <td className="py-2 pr-3 text-gray-300">{t.exitDate}</td>
                            <td className="py-2 pr-3">
                              <span className={`flex items-center gap-1 font-semibold ${t.direction === 'BUY' ? 'text-[#00d4aa]' : 'text-[#ff4757]'}`}>
                                {t.direction === 'BUY' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                {t.direction}
                              </span>
                            </td>
                            <td className="py-2 pr-3 text-right text-gray-300">{t.entryPrice.toFixed(4)}</td>
                            <td className="py-2 pr-3 text-right text-gray-300">{t.exitPrice.toFixed(4)}</td>
                            <td className={`py-2 text-right font-semibold ${t.pnlPct >= 0 ? 'text-[#00d4aa]' : 'text-[#ff4757]'}`}>
                              {t.pnlPct >= 0 ? '+' : ''}{t.pnlPct.toFixed(2)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {result.trades.length > 20 && (
                      <p className="text-center text-xs text-gray-500 pt-3">Showing 20 of {result.trades.length} trades</p>
                    )}
                    {result.trades.length === 0 && (
                      <p className="text-center text-xs text-gray-500 py-6">No trades generated. Try adjusting parameters.</p>
                    )}
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSave}
                  className="w-full bg-[#111827] border border-[#1f2937] hover:border-[#374151] text-gray-200 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors hover:bg-[#1a2235]"
                >
                  <Save size={16} />
                  Save Result ({savedResults.length}/3)
                </button>
              </>
            )}
          </div>
        </div>

        {/* Comparison Panel */}
        {savedResults.length >= 2 && (
          <div className="mt-8 bg-[#111827] border border-[#1f2937] rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Saved Results Comparison</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 border-b border-[#1f2937]">
                    <th className="text-left py-2 pr-4">Saved At</th>
                    <th className="text-left py-2 pr-4">Symbol</th>
                    <th className="text-right py-2 pr-4">Candles</th>
                    <th className="text-right py-2 pr-4">Fast/Slow EMA</th>
                    <th className="text-right py-2 pr-4">RSI Filter</th>
                    <th className="text-right py-2 pr-4">Trades</th>
                    <th className="text-right py-2 pr-4">Win Rate</th>
                    <th className="text-right py-2 pr-4">Total P&L</th>
                    <th className="text-right py-2 pr-4">Max DD</th>
                    <th className="text-right py-2 pr-4">Profit Factor</th>
                    <th className="text-right py-2">Sharpe</th>
                  </tr>
                </thead>
                <tbody>
                  {savedResults.map((r, idx) => {
                    const wr = r.trades.length > 0 ? (r.wins / r.trades.length * 100).toFixed(1) : '0.0';
                    return (
                      <tr key={r.id} className={`border-b border-[#1f2937] ${idx === 0 ? 'bg-[#0a0e1a]/50' : ''}`}>
                        <td className="py-2.5 pr-4 text-gray-400">{r.timestamp}</td>
                        <td className="py-2.5 pr-4 text-white font-semibold">{r.symbol}</td>
                        <td className="py-2.5 pr-4 text-right text-gray-300">{r.candleCount}</td>
                        <td className="py-2.5 pr-4 text-right text-gray-300">{r.fastPeriod}/{r.slowPeriod}</td>
                        <td className="py-2.5 pr-4 text-right">
                          <span className={r.useRSIFilter ? 'text-[#00d4aa]' : 'text-gray-500'}>{r.useRSIFilter ? 'ON' : 'OFF'}</span>
                        </td>
                        <td className="py-2.5 pr-4 text-right text-gray-300">{r.trades.length}</td>
                        <td className={`py-2.5 pr-4 text-right font-semibold ${parseFloat(wr) >= 50 ? 'text-[#00d4aa]' : 'text-[#ff4757]'}`}>{wr}%</td>
                        <td className={`py-2.5 pr-4 text-right font-semibold ${r.totalPnl >= 0 ? 'text-[#00d4aa]' : 'text-[#ff4757]'}`}>
                          {r.totalPnl >= 0 ? '+' : ''}{r.totalPnl.toFixed(2)}%
                        </td>
                        <td className="py-2.5 pr-4 text-right text-[#ff4757]">-{r.maxDrawdown.toFixed(2)}%</td>
                        <td className={`py-2.5 pr-4 text-right font-semibold ${r.profitFactor >= 1 ? 'text-[#00d4aa]' : 'text-[#ff4757]'}`}>{r.profitFactor.toFixed(2)}</td>
                        <td className={`py-2.5 text-right font-semibold ${r.sharpeRatio >= 0 ? 'text-[#ffa502]' : 'text-[#ff4757]'}`}>{r.sharpeRatio.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
