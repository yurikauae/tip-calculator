import { useState, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import api from "../services/api";

const SYMBOLS = ["EURUSD", "GBPUSD", "USDJPY", "BTCUSD", "ETHUSD", "AAPL", "TSLA", "SPY"];

// ── EMA helper ─────────────────────────────────────────────────────────────
function calcEMA(prices, period) {
  const k = 2 / (period + 1);
  const ema = [];
  let prev = null;
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      ema.push(null);
      continue;
    }
    if (prev === null) {
      prev = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
      ema.push(prev);
    } else {
      prev = prices[i] * k + prev * (1 - k);
      ema.push(prev);
    }
  }
  return ema;
}

// ── RSI helper ──────────────────────────────────────────────────────────────
function calcRSI(prices, period = 14) {
  const rsi = new Array(prices.length).fill(null);
  if (prices.length < period + 1) return rsi;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) gains += diff; else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  rsi[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    rsi[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return rsi;
}

// ── Backtest engine ─────────────────────────────────────────────────────────
function runEMACrossover(candles, fastPeriod, slowPeriod, rsiFilterEnabled, rsiFilterLevel) {
  const closes = candles.map((c) => c.close);
  const fastEMA = calcEMA(closes, fastPeriod);
  const slowEMA = calcEMA(closes, slowPeriod);
  const rsi = calcRSI(closes, 14);

  const INITIAL_BALANCE = 10000;
  const RISK_PER_TRADE = 200;

  let balance = INITIAL_BALANCE;
  let inTrade = false;
  let entryPrice = 0;
  let entryIdx = 0;
  let tradeDir = null;
  const trades = [];
  const equityCurve = [{ date: candles[0]?.date || "Start", equity: INITIAL_BALANCE, tradeNum: 0 }];
  let peak = INITIAL_BALANCE;
  let maxDrawdown = 0;
  let tradeNum = 0;

  for (let i = slowPeriod + 1; i < candles.length; i++) {
    if (fastEMA[i] === null || slowEMA[i] === null) continue;
    const prevFast = fastEMA[i - 1];
    const prevSlow = slowEMA[i - 1];
    const currFast = fastEMA[i];
    const currSlow = slowEMA[i];

    const bullCross = prevFast <= prevSlow && currFast > currSlow;
    const bearCross = prevFast >= prevSlow && currFast < currSlow;

    if (!inTrade) {
      const rsiOk = !rsiFilterEnabled || (rsi[i] !== null && rsi[i] < rsiFilterLevel);
      if (bullCross && rsiOk) {
        inTrade = true;
        entryPrice = candles[i].close;
        entryIdx = i;
        tradeDir = "LONG";
      }
    } else {
      const shouldExit = tradeDir === "LONG" ? bearCross : bullCross;
      if (shouldExit) {
        const exitPrice = candles[i].close;
        const priceDiff = tradeDir === "LONG" ? exitPrice - entryPrice : entryPrice - exitPrice;
        const pnl = (priceDiff / entryPrice) * RISK_PER_TRADE * 10;
        balance += pnl;
        peak = Math.max(peak, balance);
        const dd = ((peak - balance) / peak) * 100;
        maxDrawdown = Math.max(maxDrawdown, dd);
        tradeNum++;
        trades.push({
          id: tradeNum,
          entryDate: candles[entryIdx].date,
          exitDate: candles[i].date,
          direction: tradeDir,
          entryPrice: entryPrice.toFixed(5),
          exitPrice: exitPrice.toFixed(5),
          pnl: parseFloat(pnl.toFixed(2)),
          result: pnl >= 0 ? "WIN" : "LOSS",
        });
        equityCurve.push({ date: candles[i].date, equity: parseFloat(balance.toFixed(2)), tradeNum });
        inTrade = false;
      }
    }
  }

  const wins = trades.filter((t) => t.result === "WIN");
  const losses = trades.filter((t) => t.result === "LOSS");
  const grossProfit = wins.reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
  const totalPnl = grossProfit - grossLoss;
  const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;
  const recoveryFactor = maxDrawdown > 0 ? totalPnl / (maxDrawdown / 100 * INITIAL_BALANCE) : 0;

  let sharpe = 0;
  if (equityCurve.length > 2) {
    const returns = [];
    for (let i = 1; i < equityCurve.length; i++) {
      returns.push((equityCurve[i].equity - equityCurve[i - 1].equity) / equityCurve[i - 1].equity);
    }
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / returns.length;
    const std = Math.sqrt(variance);
    sharpe = std > 0 ? mean / std : 0;
  }

  const splitIdx = Math.floor(trades.length * 0.7);

  return {
    metrics: {
      totalTrades: trades.length,
      wins: wins.length,
      losses: losses.length,
      winRate: winRate.toFixed(1),
      totalPnl: totalPnl.toFixed(2),
      maxDrawdown: maxDrawdown.toFixed(2),
      profitFactor: profitFactor.toFixed(2),
      recoveryFactor: recoveryFactor.toFixed(2),
      sharpeRatio: sharpe.toFixed(3),
      totalReturn: (((balance - INITIAL_BALANCE) / INITIAL_BALANCE) * 100).toFixed(2),
    },
    trades,
    equityCurve,
    splitIdx,
  };
}

const EquityTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#111827] border border-[#00d4aa]/30 rounded-lg px-3 py-2 text-sm">
        <p className="text-gray-400 text-xs">{payload[0].payload.date}</p>
        <p className="text-[#00d4aa] font-semibold">${payload[0].value?.toLocaleString()}</p>
        {payload[0].payload.tradeNum > 0 && (
          <p className="text-gray-500 text-xs">Trade #{payload[0].payload.tradeNum}</p>
        )}
      </div>
    );
  }
  return null;
};

const INPUT_CLASS =
  "w-full bg-[#0a0e1a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00d4aa]/50";
const LABEL_CLASS = "block text-xs text-gray-400 mb-1";

const StrategyTester = () => {
  const [symbol, setSymbol] = useState("EURUSD");
  const [startDate, setStartDate] = useState("2023-01-01");
  const [endDate, setEndDate] = useState("2024-12-31");
  const [fastPeriod, setFastPeriod] = useState(9);
  const [slowPeriod, setSlowPeriod] = useState(21);
  const [rsiFilterEnabled, setRsiFilterEnabled] = useState(true);
  const [rsiFilterLevel, setRsiFilterLevel] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [savedResults, setSavedResults] = useState([]);
  const [showTradeList, setShowTradeList] = useState(false);

  const runBacktest = useCallback(async () => {
    if (fastPeriod >= slowPeriod) {
      setError("Fast EMA period must be less than Slow EMA period.");
      return;
    }
    setError(null);
    setIsRunning(true);
    setResult(null);
    try {
      const symbolEncoded = encodeURIComponent(symbol);
      const data = await api.get(
        `/market/assets/${symbolEncoded}/candles`,
        { params: { start: startDate, end: endDate, interval: "1d" } }
      );
      const candles = Array.isArray(data) ? data : (data.candles || data.data || []);
      if (!candles || candles.length < slowPeriod + 5) {
        throw new Error(`Not enough candle data. Got ${candles?.length || 0} candles, need at least ${slowPeriod + 5}.`);
      }
      const res = runEMACrossover(candles, +fastPeriod, +slowPeriod, rsiFilterEnabled, +rsiFilterLevel);
      setResult(res);
    } catch (err) {
      setError(err.message || "Failed to fetch candles. Check symbol or date range.");
    } finally {
      setIsRunning(false);
    }
  }, [symbol, startDate, endDate, fastPeriod, slowPeriod, rsiFilterEnabled, rsiFilterLevel]);

  const saveResult = () => {
    if (!result) return;
    const label = `${symbol} EMA(${fastPeriod}/${slowPeriod}) — ${new Date().toLocaleTimeString()}`;
    setSavedResults((prev) => [
      { label, metrics: result.metrics },
      ...prev.slice(0, 2),
    ]);
  };

  const inSampleTrades = result ? result.trades.slice(0, result.splitIdx) : [];
  const outSampleTrades = result ? result.trades.slice(result.splitIdx) : [];

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-1">Strategy Tester</h1>
          <p className="text-gray-400 text-sm">EMA Crossover backtesting on real historical candles</p>
        </div>

        <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-xl p-3 mb-6 text-xs text-yellow-400">
          Past performance is not indicative of future results. Backtesting does not account for slippage, spread, or real market conditions.
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
          <div className="bg-[#111827] border border-white/5 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">Asset & Range</h2>
            <div className="space-y-3">
              <div>
                <label className={LABEL_CLASS}>Symbol</label>
                <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className={INPUT_CLASS}>
                  {SYMBOLS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL_CLASS}>Start Date</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={INPUT_CLASS} />
              </div>
              <div>
                <label className={LABEL_CLASS}>End Date</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={INPUT_CLASS} />
              </div>
            </div>
          </div>

          <div className="bg-[#111827] border border-white/5 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">EMA Crossover</h2>
            <div className="space-y-3">
              <div>
                <label className={LABEL_CLASS}>Fast EMA Period</label>
                <input type="number" min="2" max="50" value={fastPeriod} onChange={(e) => setFastPeriod(e.target.value)} className={INPUT_CLASS} />
              </div>
              <div>
                <label className={LABEL_CLASS}>Slow EMA Period</label>
                <input type="number" min="3" max="200" value={slowPeriod} onChange={(e) => setSlowPeriod(e.target.value)} className={INPUT_CLASS} />
              </div>
              <div className="text-xs text-gray-500 bg-[#0a0e1a] rounded-lg p-2">
                Buy: fast EMA crosses above slow EMA<br />
                Sell: fast EMA crosses below slow EMA
              </div>
            </div>
          </div>

          <div className="bg-[#111827] border border-white/5 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">RSI Filter</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-300">Enable RSI Filter</label>
                <button
                  onClick={() => setRsiFilterEnabled((v) => !v)}
                  className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${rsiFilterEnabled ? "bg-[#00d4aa]" : "bg-gray-700"}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${rsiFilterEnabled ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
              {rsiFilterEnabled && (
                <div>
                  <label className={LABEL_CLASS}>Only buy when RSI below</label>
                  <input type="number" min="30" max="90" value={rsiFilterLevel} onChange={(e) => setRsiFilterLevel(e.target.value)} className={INPUT_CLASS} />
                  <p className="text-xs text-gray-500 mt-1">Avoids buying in overbought conditions</p>
                </div>
              )}
              <div className="text-xs text-gray-500 bg-[#0a0e1a] rounded-lg p-2">
                RSI period: 14 (fixed)<br />
                Walk-forward: 70% in-sample, 30% out-of-sample
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={runBacktest}
            disabled={isRunning}
            className="bg-[#00d4aa] hover:bg-[#00d4aa]/80 disabled:opacity-50 disabled:cursor-not-allowed text-[#0a0e1a] font-bold px-8 py-3 rounded-xl transition-colors flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-[#0a0e1a] border-t-transparent rounded-full animate-spin"></span>
                Fetching Candles & Running...
              </>
            ) : "Run Backtest"}
          </button>
          {result && (
            <button
              onClick={saveResult}
              disabled={savedResults.length >= 3}
              className="border border-[#00d4aa]/40 text-[#00d4aa] hover:bg-[#00d4aa]/10 disabled:opacity-40 font-semibold px-5 py-3 rounded-xl transition-colors text-sm"
            >
              Save Result ({savedResults.length}/3)
            </button>
          )}
        </div>

        {error && (
          <div className="bg-[#ff4757]/10 border border-[#ff4757]/40 rounded-xl p-4 mb-6 text-[#ff4757] text-sm">
            {error}
          </div>
        )}

        {result && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
              {[
                { label: "Total Trades", value: result.metrics.totalTrades, color: "text-white" },
                { label: "Win Rate", value: `${result.metrics.winRate}%`, color: +result.metrics.winRate >= 50 ? "text-[#00d4aa]" : "text-[#ff4757]" },
                { label: "Net P&L", value: `${parseFloat(result.metrics.totalPnl) >= 0 ? "+$" : "-$"}${Math.abs(parseFloat(result.metrics.totalPnl)).toFixed(2)}`, color: parseFloat(result.metrics.totalPnl) >= 0 ? "text-[#00d4aa]" : "text-[#ff4757]" },
                { label: "Total Return", value: `${result.metrics.totalReturn}%`, color: parseFloat(result.metrics.totalReturn) >= 0 ? "text-[#00d4aa]" : "text-[#ff4757]" },
                { label: "Max Drawdown", value: `${result.metrics.maxDrawdown}%`, color: "text-[#ff4757]" },
                { label: "Profit Factor", value: result.metrics.profitFactor, color: parseFloat(result.metrics.profitFactor) >= 1.5 ? "text-[#00d4aa]" : "text-yellow-400" },
                { label: "Recovery Factor", value: result.metrics.recoveryFactor, color: "text-gray-200" },
                { label: "Sharpe Ratio", value: result.metrics.sharpeRatio, color: parseFloat(result.metrics.sharpeRatio) > 0 ? "text-[#00d4aa]" : "text-[#ff4757]" },
                { label: "Wins", value: result.metrics.wins, color: "text-[#00d4aa]" },
                { label: "Losses", value: result.metrics.losses, color: "text-[#ff4757]" },
              ].map((stat) => (
                <div key={stat.label} className="bg-[#111827] border border-white/5 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{stat.label}</p>
                  <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-[#111827] border border-[#00d4aa]/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-[#00d4aa]"></span>
                  <span className="text-sm font-semibold text-[#00d4aa]">In-Sample Period</span>
                  <span className="text-xs text-gray-500 ml-auto">70% of data</span>
                </div>
                <p className="text-xs text-gray-400">{inSampleTrades.length} trades | Win rate: {inSampleTrades.length > 0 ? ((inSampleTrades.filter(t => t.result === "WIN").length / inSampleTrades.length) * 100).toFixed(1) : "—"}%</p>
                <p className="text-xs text-gray-500 mt-1">Used to develop the strategy parameters</p>
              </div>
              <div className="bg-[#111827] border border-yellow-700/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                  <span className="text-sm font-semibold text-yellow-400">Out-of-Sample Period</span>
                  <span className="text-xs text-gray-500 ml-auto">30% of data</span>
                </div>
                <p className="text-xs text-gray-400">{outSampleTrades.length} trades | Win rate: {outSampleTrades.length > 0 ? ((outSampleTrades.filter(t => t.result === "WIN").length / outSampleTrades.length) * 100).toFixed(1) : "—"}%</p>
                <p className="text-xs text-gray-500 mt-1">Used to validate strategy generalization</p>
              </div>
            </div>

            <div className="bg-[#111827] border border-white/5 rounded-xl p-6 mb-6">
              <h2 className="text-base font-semibold text-white mb-4">Equity Curve</h2>
              {result.equityCurve.length < 2 ? (
                <div className="text-gray-500 text-sm text-center py-12">No trades generated. Adjust parameters or date range.</div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={result.equityCurve}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="date" stroke="#4b5563" tick={{ fontSize: 10 }} tickFormatter={(v) => v?.slice(0, 7) || v} />
                    <YAxis stroke="#4b5563" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} />
                    <Tooltip content={<EquityTooltip />} />
                    <ReferenceLine y={10000} stroke="#374151" strokeDasharray="4 4" label={{ value: "Start", fill: "#6b7280", fontSize: 10 }} />
                    <Line type="monotone" dataKey="equity" stroke="#00d4aa" strokeWidth={2} dot={false} name="Balance" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-[#111827] border border-white/5 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white">Trade List ({result.trades.length} trades)</h2>
                <button onClick={() => setShowTradeList((v) => !v)} className="text-xs text-[#00d4aa] hover:underline">
                  {showTradeList ? "Hide" : "Show All"}
                </button>
              </div>
              {showTradeList && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/5 text-gray-500 uppercase">
                        {["#", "Entry Date", "Exit Date", "Dir", "Entry Price", "Exit Price", "P&L", "Result"].map((h) => (
                          <th key={h} className={`pb-3 pr-4 ${h === "P&L" || h === "Result" ? "text-right" : "text-left"}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {result.trades.map((t) => (
                        <tr key={t.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-2 pr-4 text-gray-500">{t.id}</td>
                          <td className="py-2 pr-4 text-gray-300">{t.entryDate}</td>
                          <td className="py-2 pr-4 text-gray-300">{t.exitDate}</td>
                          <td className="py-2 pr-4">
                            <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${t.direction === "LONG" ? "bg-[#00d4aa]/20 text-[#00d4aa]" : "bg-[#ff4757]/20 text-[#ff4757]"}`}>
                              {t.direction}
                            </span>
                          </td>
                          <td className="py-2 pr-4 font-mono text-gray-200">{t.entryPrice}</td>
                          <td className="py-2 pr-4 font-mono text-gray-200">{t.exitPrice}</td>
                          <td className={`py-2 pr-4 text-right font-mono font-semibold ${t.pnl >= 0 ? "text-[#00d4aa]" : "text-[#ff4757]"}`}>
                            {t.pnl >= 0 ? "+" : ""}${t.pnl.toFixed(2)}
                          </td>
                          <td className="py-2 text-right">
                            <span className={`font-bold ${t.result === "WIN" ? "text-[#00d4aa]" : "text-[#ff4757]"}`}>{t.result}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {savedResults.length > 0 && (
          <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
            <h2 className="text-base font-semibold text-white mb-4">Results Comparison</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-gray-500 uppercase">
                    <th className="text-left pb-3 pr-4">Run</th>
                    <th className="text-right pb-3 pr-4">Trades</th>
                    <th className="text-right pb-3 pr-4">Win Rate</th>
                    <th className="text-right pb-3 pr-4">Net P&L</th>
                    <th className="text-right pb-3 pr-4">Max DD</th>
                    <th className="text-right pb-3 pr-4">Profit Factor</th>
                    <th className="text-right pb-3">Sharpe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {savedResults.map((r, i) => (
                    <tr key={i} className="hover:bg-white/5">
                      <td className="py-2 pr-4 text-gray-300 max-w-[200px] truncate">{r.label}</td>
                      <td className="py-2 pr-4 text-right text-white">{r.metrics.totalTrades}</td>
                      <td className={`py-2 pr-4 text-right font-semibold ${+r.metrics.winRate >= 50 ? "text-[#00d4aa]" : "text-[#ff4757]"}`}>{r.metrics.winRate}%</td>
                      <td className={`py-2 pr-4 text-right font-semibold ${+r.metrics.totalPnl >= 0 ? "text-[#00d4aa]" : "text-[#ff4757]"}`}>${r.metrics.totalPnl}</td>
                      <td className="py-2 pr-4 text-right text-[#ff4757]">{r.metrics.maxDrawdown}%</td>
                      <td className={`py-2 pr-4 text-right ${+r.metrics.profitFactor >= 1.5 ? "text-[#00d4aa]" : "text-yellow-400"}`}>{r.metrics.profitFactor}</td>
                      <td className={`py-2 text-right ${+r.metrics.sharpeRatio > 0 ? "text-[#00d4aa]" : "text-[#ff4757]"}`}>{r.metrics.sharpeRatio}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StrategyTester;