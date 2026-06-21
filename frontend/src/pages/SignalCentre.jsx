import { useState, useMemo } from "react";
import { Filter, SortAsc, Zap, Clock } from "lucide-react";

const ALL_SIGNALS = [
  { id: 1, symbol: "BTC/USD", signal: "BUY", category: "Crypto", timeframe: "4H", confidence: 92, entry: "66,800", sl: "65,200", tp: "70,000", rr: "2.50", reason: "Break of key resistance at 66,500 with volume surge. RSI shows strong bullish momentum. EMA 50 crossover confirmed.", timestamp: "10 min ago" },
  { id: 2, symbol: "EUR/USD", signal: "BUY", category: "Forex", timeframe: "1H", confidence: 87, entry: "1.08320", sl: "1.07800", tp: "1.09200", rr: "2.84", reason: "Bullish engulfing candle at demand zone. MACD histogram turning positive. London session breakout setup.", timestamp: "25 min ago" },
  { id: 3, symbol: "GBP/USD", signal: "SELL", category: "Forex", timeframe: "4H", confidence: 81, entry: "1.26900", sl: "1.27500", tp: "1.25800", rr: "1.83", reason: "Double top formation at 1.2720 resistance. RSI bearish divergence. Rejection wick at key level.", timestamp: "42 min ago" },
  { id: 4, symbol: "NAS100", signal: "BUY", category: "Indices", timeframe: "1D", confidence: 84, entry: "18,350", sl: "17,900", tp: "19,200", rr: "1.89", reason: "Cup and handle pattern completing. Tech earnings season positive catalyst. Above all key EMAs.", timestamp: "1h ago" },
  { id: 5, symbol: "OIL/WTI", signal: "SELL", category: "Commodities", timeframe: "1H", confidence: 78, entry: "78.60", sl: "79.80", tp: "76.50", rr: "1.75", reason: "Supply zone rejection. Bearish MACD crossover. EIA inventory build expected. RSI overbought.", timestamp: "1h 15min ago" },
  { id: 6, symbol: "ETH/USD", signal: "BUY", category: "Crypto", timeframe: "4H", confidence: 89, entry: "3,480", sl: "3,300", tp: "3,800", rr: "1.78", reason: "Higher low structure forming. Ethereum ETF momentum. On-chain activity surge. Bull flag breakout.", timestamp: "1h 30min ago" },
  { id: 7, symbol: "GOLD", signal: "NEUTRAL", category: "Commodities", timeframe: "1D", confidence: 55, entry: "2,315", sl: "2,290", tp: "2,345", rr: "1.20", reason: "Consolidation at all-time high zone. Waiting for breakout confirmation. Mixed macro signals.", timestamp: "2h ago" },
  { id: 8, symbol: "USD/JPY", signal: "BUY", category: "Forex", timeframe: "4H", confidence: 76, entry: "157.00", sl: "155.80", tp: "159.00", rr: "1.67", reason: "BoJ intervention risk fading. US yields supporting dollar strength. Trend continuation setup.", timestamp: "2h 20min ago" },
  { id: 9, symbol: "SPX500", signal: "BUY", category: "Indices", timeframe: "1D", confidence: 82, entry: "5,210", sl: "5,100", tp: "5,400", rr: "1.73", reason: "All-time high breakout with strong breadth. Seasonal tailwinds. Fed pause supporting equities.", timestamp: "3h ago" },
  { id: 10, symbol: "XRP/USD", signal: "SELL", category: "Crypto", timeframe: "1H", confidence: 73, entry: "0.5230", sl: "0.5380", tp: "0.4900", rr: "2.20", reason: "Rising wedge breakdown. Decreasing volume on the rally. Regulatory uncertainty weighing.", timestamp: "3h 30min ago" },
  { id: 11, symbol: "AUD/USD", signal: "SELL", category: "Forex", timeframe: "4H", confidence: 79, entry: "0.6610", sl: "0.6680", tp: "0.6480", rr: "1.86", reason: "RBA dovish tone. China slowdown concerns. Head and shoulders top forming on 4H chart.", timestamp: "4h ago" },
  { id: 12, symbol: "SPY", signal: "BUY", category: "ETFs", timeframe: "1D", confidence: 83, entry: "520.00", sl: "510.00", tp: "538.00", rr: "1.80", reason: "S&P 500 ETF trending above 50DMA. Options flow bullish. Institutional accumulation detected.", timestamp: "4h 30min ago" },
];

const SIGNAL_TYPES = ["All", "BUY", "SELL", "NEUTRAL"];
const CATEGORIES = ["All", "Forex", "Crypto", "Indices", "Commodities", "ETFs"];
const TIMEFRAMES = ["All", "1m", "5m", "15m", "1H", "4H", "1D"];
const SORT_OPTIONS = ["Confidence", "Symbol A-Z", "Newest", "Signal Type"];

function SignalBadge({ signal }) {
  const config = {
    BUY: { bg: "bg-[#00d4aa]/20", text: "text-[#00d4aa]", border: "border-[#00d4aa]/40" },
    SELL: { bg: "bg-[#ff4757]/20", text: "text-[#ff4757]", border: "border-[#ff4757]/40" },
    NEUTRAL: { bg: "bg-[#ffa502]/20", text: "text-[#ffa502]", border: "border-[#ffa502]/40" },
  };
  const c = config[signal] || config.NEUTRAL;
  return (
    <span className={`inline-flex items-center font-bold rounded border px-3 py-1 text-sm ${c.bg} ${c.text} ${c.border}`}>
      {signal}
    </span>
  );
}

function ConfidenceBar({ value, signal }) {
  const color = signal === "BUY" ? "#00d4aa" : signal === "SELL" ? "#ff4757" : "#ffa502";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-bold text-white w-8 text-right">{value}%</span>
    </div>
  );
}

export default function SignalCentre() {
  const [signalFilter, setSignalFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [timeframeFilter, setTimeframeFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Confidence");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let result = ALL_SIGNALS;
    if (signalFilter !== "All") result = result.filter((s) => s.signal === signalFilter);
    if (categoryFilter !== "All") result = result.filter((s) => s.category === categoryFilter);
    if (timeframeFilter !== "All") result = result.filter((s) => s.timeframe === timeframeFilter);
    result = [...result].sort((a, b) => {
      if (sortBy === "Confidence") return b.confidence - a.confidence;
      if (sortBy === "Symbol A-Z") return a.symbol.localeCompare(b.symbol);
      if (sortBy === "Signal Type") return a.signal.localeCompare(b.signal);
      return 0;
    });
    return result;
  }, [signalFilter, categoryFilter, timeframeFilter, sortBy]);

  const buyCount = ALL_SIGNALS.filter((s) => s.signal === "BUY").length;
  const sellCount = ALL_SIGNALS.filter((s) => s.signal === "SELL").length;
  const neutralCount = ALL_SIGNALS.filter((s) => s.signal === "NEUTRAL").length;

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-2">
            <Zap size={26} className="text-[#00d4aa]" /> Signal Centre
          </h1>
          <p className="text-gray-400 text-sm">All active trading signals across markets</p>
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-[#111827] border border-white/10 rounded-xl text-sm text-gray-300 hover:border-[#00d4aa]/40 hover:text-white transition-all"
        >
          <Filter size={14} /> Filters {showFilters ? "▲" : "▼"}
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#111827] rounded-xl p-4 border border-[#00d4aa]/20 text-center">
          <div className="text-2xl font-bold text-[#00d4aa]">{buyCount}</div>
          <div className="text-sm text-gray-400 mt-1">BUY Signals</div>
        </div>
        <div className="bg-[#111827] rounded-xl p-4 border border-[#ff4757]/20 text-center">
          <div className="text-2xl font-bold text-[#ff4757]">{sellCount}</div>
          <div className="text-sm text-gray-400 mt-1">SELL Signals</div>
        </div>
        <div className="bg-[#111827] rounded-xl p-4 border border-[#ffa502]/20 text-center">
          <div className="text-2xl font-bold text-[#ffa502]">{neutralCount}</div>
          <div className="text-sm text-gray-400 mt-1">NEUTRAL Signals</div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-[#111827] rounded-xl border border-white/5 p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Signal Type</label>
            <div className="flex flex-wrap gap-2">
              {SIGNAL_TYPES.map((s) => (
                <button
                  key={s}
                  onClick={() => setSignalFilter(s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                    signalFilter === s ? "bg-[#00d4aa] text-[#0a0e1a] border-[#00d4aa]" : "border-white/10 text-gray-400 hover:border-white/30"
                  }`}
                >{s}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategoryFilter(c)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                    categoryFilter === c ? "bg-[#00d4aa] text-[#0a0e1a] border-[#00d4aa]" : "border-white/10 text-gray-400 hover:border-white/30"
                  }`}
                >{c}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Timeframe</label>
            <div className="flex flex-wrap gap-2">
              {TIMEFRAMES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframeFilter(t)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                    timeframeFilter === t ? "bg-[#00d4aa] text-[#0a0e1a] border-[#00d4aa]" : "border-white/10 text-gray-400 hover:border-white/30"
                  }`}
                >{t}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-2 block flex items-center gap-1"><SortAsc size={12} /> Sort By</label>
            <div className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                    sortBy === s ? "bg-[#ffa502] text-[#0a0e1a] border-[#ffa502]" : "border-white/10 text-gray-400 hover:border-white/30"
                  }`}
                >{s}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-gray-400 mb-4">
        Showing <span className="text-white font-semibold">{filtered.length}</span> signals
      </div>

      {/* Signals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((sig) => (
          <div key={sig.id} className="bg-[#111827] rounded-xl border border-white/5 hover:border-[#00d4aa]/20 transition-all p-5">
            {/* Top Row */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-lg font-bold text-white">{sig.symbol}</div>
                <div className="text-xs text-gray-500 mt-0.5">{sig.category} · {sig.timeframe}</div>
              </div>
              <SignalBadge signal={sig.signal} />
            </div>

            {/* Confidence */}
            <div className="mb-3">
              <div className="text-xs text-gray-400 mb-1">Confidence</div>
              <ConfidenceBar value={sig.confidence} signal={sig.signal} />
            </div>

            {/* Entry / SL / TP */}
            <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
              <div className="bg-[#0a0e1a] rounded-lg p-2">
                <div className="text-gray-500 mb-0.5">Entry</div>
                <div className="text-white font-semibold">{sig.entry}</div>
              </div>
              <div className="bg-[#0a0e1a] rounded-lg p-2">
                <div className="text-gray-500 mb-0.5">Stop Loss</div>
                <div className="text-[#ff4757] font-semibold">{sig.sl}</div>
              </div>
              <div className="bg-[#0a0e1a] rounded-lg p-2">
                <div className="text-gray-500 mb-0.5">Take Profit</div>
                <div className="text-[#00d4aa] font-semibold">{sig.tp}</div>
              </div>
            </div>

            {/* R:R */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-400">Risk/Reward Ratio</span>
              <span className="text-[#ffa502] font-bold text-sm">1 : {sig.rr}</span>
            </div>

            {/* Reason */}
            <p className="text-xs text-gray-400 leading-relaxed border-t border-white/5 pt-3 mb-3">
              {sig.reason}
            </p>

            {/* Timestamp */}
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Clock size={11} /> Generated {sig.timestamp}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <Zap size={40} className="mx-auto mb-4 opacity-30" />
          <p>No signals match your current filters.</p>
        </div>
      )}
    </div>
  );
}
