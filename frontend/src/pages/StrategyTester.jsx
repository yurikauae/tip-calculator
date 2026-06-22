import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const SYMBOLS = ["EUR/USD", "GBP/USD", "USD/JPY", "BTC/USD", "ETH/USD", "AAPL", "TSLA", "SPY"];

const generateMockEquityCurve = (seed = 1) => {
  const data = [];
  let equity = 10000;
  const count = 50;
  for (let i = 0; i < count; i++) {
    const change = (Math.sin(i * seed * 0.3) + Math.random() - 0.45) * 200;
    equity = Math.max(equity + change, 5000);
    data.push({
      trade: i + 1,
      equity: parseFloat(equity.toFixed(2)),
    });
  }
  return data;
};

const generateMockTrades = () => {
  const results = [];
  const directions = ["LONG", "SHORT"];
  const symbols = ["EUR/USD", "GBP/USD", "USD/JPY"];
  for (let i = 0; i < 20; i++) {
    const win = Math.random() > 0.45;
    const pnl = win ? (Math.random() * 300 + 50).toFixed(2) : -(Math.random() * 200 + 30).toFixed(2);
    results.push({
      id: i + 1,
      date: new Date(Date.now() - (20 - i) * 86400000 * 3).toLocaleDateString(),
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      direction: directions[Math.floor(Math.random() * 2)],
      entry: (1.08 + Math.random() * 0.02).toFixed(5),
      exit: (1.08 + Math.random() * 0.02).toFixed(5),
      pnl: parseFloat(pnl),
      result: win ? "WIN" : "LOSS",
    });
  }
  return results;
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm">
        <p className="text-gray-400">Trade #{payload[0].payload.trade}</p>
        <p className="text-blue-400 font-semibold">${payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

const StrategyTester = () => {
  const [symbol, setSymbol] = useState("EUR/USD");
  const [startDate, setStartDate] = useState("2024-01-01");
  const [endDate, setEndDate] = useState("2024-12-31");
  const [emaFast, setEmaFast] = useState("9");
  const [emaSlow, setEmaSlow] = useState("21");
  const [rsiOverbought, setRsiOverbought] = useState("70");
  const [rsiOversold, setRsiOversold] = useState("30");
  const [macdFast, setMacdFast] = useState("12");
  const [macdSlow, setMacdSlow] = useState("26");
  const [macdSignal, setMacdSignal] = useState("9");
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [trades, setTrades] = useState([]);
  const [equityCurve, setEquityCurve] = useState([]);

  const runBacktest = () => {
    setIsRunning(true);
    setTimeout(() => {
      const tradeList = generateMockTrades();
      const wins = tradeList.filter((t) => t.result === "WIN").length;
      const totalPnl = tradeList.reduce((sum, t) => sum + t.pnl, 0);
      const grossProfit = tradeList.filter((t) => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
      const grossLoss = Math.abs(tradeList.filter((t) => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0));
      setResults({
        totalTrades: tradeList.length,
        winRate: ((wins / tradeList.length) * 100).toFixed(1),
        profitFactor: (grossProfit / grossLoss).toFixed(2),
        maxDrawdown: "-12.4%",
        totalReturn: ((totalPnl / 10000) * 100).toFixed(2),
        totalPnl: totalPnl.toFixed(2),
      });
      setTrades(tradeList);
      setEquityCurve(generateMockEquityCurve(Math.random() * 5 + 1));
      setIsRunning(false);
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Strategy Tester</h1>
          <p className="text-gray-400">Backtest your trading strategy on historical data</p>
        </div>

        <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-xl p-3 mb-6 text-xs text-yellow-400">
          Past performance is not indicative of future results. Backtesting results are simulated and do not account for slippage, spread, or real market conditions.
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Parameters</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Symbol</label>
                <select
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
                >
                  {SYMBOLS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">EMA + RSI Settings</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">EMA Fast</label>
                  <input type="number" value={emaFast} onChange={(e) => setEmaFast(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">EMA Slow</label>
                  <input type="number" value={emaSlow} onChange={(e) => setEmaSlow(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">RSI Overbought</label>
                  <input type="number" value={rsiOverbought} onChange={(e) => setRsiOverbought(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">RSI Oversold</label>
                  <input type="number" value={rsiOversold} onChange={(e) => setRsiOversold(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">MACD Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Fast Period</label>
                <input type="number" value={macdFast} onChange={(e) => setMacdFast(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Slow Period</label>
                <input type="number" value={macdSlow} onChange={(e) => setMacdSlow(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Signal Period</label>
                <input type="number" value={macdSignal} onChange={(e) => setMacdSignal(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center mb-6">
          <button
            onClick={runBacktest}
            disabled={isRunning}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold px-10 py-3 rounded-xl transition-colors flex items-center gap-3"
          >
            {isRunning ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Running Backtest...
              </>
            ) : (
              "Run Backtest"
            )}
          </button>
        </div>

        {results && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              {[
                { label: "Total Trades", value: results.totalTrades, color: "text-blue-400" },
                { label: "Win Rate", value: `${results.winRate}%`, color: parseFloat(results.winRate) >= 50 ? "text-green-400" : "text-red-400" },
                { label: "Profit Factor", value: results.profitFactor, color: parseFloat(results.profitFactor) >= 1.5 ? "text-green-400" : "text-yellow-400" },
                { label: "Max Drawdown", value: results.maxDrawdown, color: "text-red-400" },
                { label: "Total Return", value: `${results.totalReturn}%`, color: parseFloat(results.totalReturn) >= 0 ? "text-green-400" : "text-red-400" },
                { label: "Net P&L", value: `$${parseFloat(results.totalPnl).toFixed(2)}`, color: parseFloat(results.totalPnl) >= 0 ? "text-green-400" : "text-red-400" },
              ].map((stat) => (
                <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{stat.label}</p>
                  <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-white mb-4">Equity Curve</h2>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={equityCurve}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="trade" stroke="#6b7280" tick={{ fontSize: 12 }} label={{ value: "Trade #", position: "insideBottom", offset: -2, fill: "#6b7280", fontSize: 12 }} />
                  <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={10000} stroke="#374151" strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="equity" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Trade List</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase">
                      <th className="text-left pb-3 pr-4">#</th>
                      <th className="text-left pb-3 pr-4">Date</th>
                      <th className="text-left pb-3 pr-4">Symbol</th>
                      <th className="text-left pb-3 pr-4">Direction</th>
                      <th className="text-right pb-3 pr-4">Entry</th>
                      <th className="text-right pb-3 pr-4">Exit</th>
                      <th className="text-right pb-3 pr-4">P&L</th>
                      <th className="text-right pb-3">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {trades.map((trade) => (
                      <tr key={trade.id} className="hover:bg-gray-800/30 transition-colors">
                        <td className="py-2.5 pr-4 text-gray-500">{trade.id}</td>
                        <td className="py-2.5 pr-4 text-gray-300">{trade.date}</td>
                        <td className="py-2.5 pr-4 text-white font-medium">{trade.symbol}</td>
                        <td className="py-2.5 pr-4">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${trade.direction === "LONG" ? "bg-green-900/40 text-green-400" : "bg-red-900/40 text-red-400"}`}>
                            {trade.direction}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 text-right text-gray-300 font-mono">{trade.entry}</td>
                        <td className="py-2.5 pr-4 text-right text-gray-300 font-mono">{trade.exit}</td>
                        <td className={`py-2.5 pr-4 text-right font-semibold font-mono ${trade.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
                        </td>
                        <td className="py-2.5 text-right">
                          <span className={`text-xs font-bold ${trade.result === "WIN" ? "text-green-400" : "text-red-400"}`}>
                            {trade.result}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StrategyTester;
