import { useState } from "react";
import { TrendingUp, TrendingDown, Activity, Star } from "lucide-react";

const CATEGORIES = ["All", "Forex", "Crypto", "Indices", "Commodities", "ETFs"];

const MOCK_MARKETS = [
  { symbol: "EUR/USD", price: "1.08432", change: "+0.42%", signal: "BUY", category: "Forex", volume: "2.1B" },
  { symbol: "BTC/USD", price: "67,240.00", change: "+2.15%", signal: "BUY", category: "Crypto", volume: "890M" },
  { symbol: "GBP/USD", price: "1.26781", change: "-0.31%", signal: "SELL", category: "Forex", volume: "1.4B" },
  { symbol: "ETH/USD", price: "3,512.40", change: "+1.87%", signal: "BUY", category: "Crypto", volume: "540M" },
  { symbol: "SPX500", price: "5,234.18", change: "+0.68%", signal: "BUY", category: "Indices", volume: "3.2B" },
  { symbol: "GOLD", price: "2,318.50", change: "-0.22%", signal: "NEUTRAL", category: "Commodities", volume: "780M" },
  { symbol: "NAS100", price: "18,420.00", change: "+0.91%", signal: "BUY", category: "Indices", volume: "2.8B" },
  { symbol: "OIL/WTI", price: "78.34", change: "-1.12%", signal: "SELL", category: "Commodities", volume: "1.1B" },
  { symbol: "USD/JPY", price: "157.220", change: "+0.55%", signal: "BUY", category: "Forex", volume: "1.9B" },
  { symbol: "SPY", price: "521.44", change: "+0.70%", signal: "BUY", category: "ETFs", volume: "4.5B" },
  { symbol: "XRP/USD", price: "0.5212", change: "-2.30%", signal: "SELL", category: "Crypto", volume: "320M" },
  { symbol: "SILVER", price: "27.82", change: "+0.44%", signal: "NEUTRAL", category: "Commodities", volume: "410M" },
];

const TOP_SIGNALS = [
  { symbol: "BTC/USD", signal: "BUY", confidence: 92, timeframe: "4H", entry: "66,800", tp: "70,000", sl: "65,200" },
  { symbol: "EUR/USD", signal: "BUY", confidence: 87, timeframe: "1H", entry: "1.0830", tp: "1.0920", sl: "1.0780" },
  { symbol: "NAS100", signal: "BUY", confidence: 84, timeframe: "1D", entry: "18,350", tp: "19,000", sl: "17,900" },
  { symbol: "GBP/USD", signal: "SELL", confidence: 81, timeframe: "4H", entry: "1.2690", tp: "1.2580", sl: "1.2750" },
  { symbol: "OIL/WTI", signal: "SELL", confidence: 78, timeframe: "1H", entry: "78.60", tp: "76.50", sl: "79.80" },
];

const WATCHLIST = [
  { symbol: "EUR/USD", price: "1.08432", change: "+0.42%", signal: "BUY" },
  { symbol: "BTC/USD", price: "67,240.00", change: "+2.15%", signal: "BUY" },
  { symbol: "SPX500", price: "5,234.18", change: "+0.68%", signal: "BUY" },
  { symbol: "GOLD", price: "2,318.50", change: "-0.22%", signal: "NEUTRAL" },
  { symbol: "GBP/USD", price: "1.26781", change: "-0.31%", signal: "SELL" },
];

function SignalBadge({ signal, size = "sm" }) {
  const config = {
    BUY: { bg: "bg-[#00d4aa]/20", text: "text-[#00d4aa]", border: "border-[#00d4aa]/40" },
    SELL: { bg: "bg-[#ff4757]/20", text: "text-[#ff4757]", border: "border-[#ff4757]/40" },
    NEUTRAL: { bg: "bg-[#ffa502]/20", text: "text-[#ffa502]", border: "border-[#ffa502]/40" },
  };
  const c = config[signal] || config.NEUTRAL;
  const padding = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";
  return (
    <span className={`inline-flex items-center font-semibold rounded border ${c.bg} ${c.text} ${c.border} ${padding}`}>
      {signal}
    </span>
  );
}

function OverviewCard({ title, value, change, isPositive, icon: Icon }) {
  return (
    <div className="bg-[#111827] rounded-xl p-5 border border-white/5 hover:border-[#00d4aa]/20 transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-400 text-sm">{title}</span>
        <div className="w-8 h-8 rounded-lg bg-[#00d4aa]/10 flex items-center justify-center">
          <Icon size={16} className="text-[#00d4aa]" />
        </div>
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className={`text-sm font-medium ${isPositive ? "text-[#00d4aa]" : "text-[#ff4757]"}`}>
        {isPositive ? "▲" : "▼"} {change}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [hoveredSymbol, setHoveredSymbol] = useState(null);

  const filtered = activeCategory === "All"
    ? MOCK_MARKETS
    : MOCK_MARKETS.filter((m) => m.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Market Overview</h1>
        <p className="text-gray-400 text-sm">Live signals across all asset classes · Updated just now</p>
      </div>

      <div className="flex gap-6">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <OverviewCard title="Active Signals" value="47" change="12 new today" isPositive={true} icon={Activity} />
            <OverviewCard title="BUY Signals" value="31" change="66% of total" isPositive={true} icon={TrendingUp} />
            <OverviewCard title="SELL Signals" value="16" change="34% of total" isPositive={false} icon={TrendingDown} />
            <OverviewCard title="Avg Confidence" value="83%" change="+2.4% vs yesterday" isPositive={true} icon={Star} />
          </div>

          {/* Top Signals */}
          <div className="bg-[#111827] rounded-xl border border-white/5 mb-8">
            <div className="p-5 border-b border-white/5">
              <h2 className="text-lg font-semibold text-white">Top Signals Right Now</h2>
            </div>
            <div className="divide-y divide-white/5">
              {TOP_SIGNALS.map((s) => (
                <div key={s.symbol} className="p-4 hover:bg-white/2 transition-colors flex items-center gap-4 flex-wrap">
                  <div className="w-28">
                    <div className="font-semibold text-white">{s.symbol}</div>
                    <div className="text-xs text-gray-400">{s.timeframe} timeframe</div>
                  </div>
                  <SignalBadge signal={s.signal} />
                  <div className="flex-1 min-w-[120px]">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-400">Confidence</span>
                      <span className="text-xs font-semibold text-white">{s.confidence}%</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden w-32">
                      <div
                        className="h-full rounded-full bg-[#00d4aa]"
                        style={{ width: `${s.confidence}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs">
                    <div><span className="text-gray-400">Entry </span><span className="text-white font-medium">{s.entry}</span></div>
                    <div><span className="text-gray-400">TP </span><span className="text-[#00d4aa] font-medium">{s.tp}</span></div>
                    <div><span className="text-gray-400">SL </span><span className="text-[#ff4757] font-medium">{s.sl}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Filter + Market Cards */}
          <div>
            <div className="flex items-center gap-2 mb-5 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                    activeCategory === cat
                      ? "bg-[#00d4aa] text-[#0a0e1a] border-[#00d4aa]"
                      : "bg-transparent text-gray-400 border-white/10 hover:border-[#00d4aa]/40 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((m) => {
                const isPos = m.change.startsWith("+");
                return (
                  <div
                    key={m.symbol}
                    onMouseEnter={() => setHoveredSymbol(m.symbol)}
                    onMouseLeave={() => setHoveredSymbol(null)}
                    className={`bg-[#111827] rounded-xl p-4 border transition-all cursor-pointer ${
                      hoveredSymbol === m.symbol ? "border-[#00d4aa]/40 shadow-lg shadow-[#00d4aa]/5" : "border-white/5"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-bold text-white text-base">{m.symbol}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{m.category}</div>
                      </div>
                      <SignalBadge signal={m.signal} />
                    </div>
                    <div className="text-xl font-bold text-white mb-1">{m.price}</div>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold ${isPos ? "text-[#00d4aa]" : "text-[#ff4757]"}`}>
                        {isPos ? "▲" : "▼"} {m.change}
                      </span>
                      <span className="text-xs text-gray-500">Vol {m.volume}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Watchlist Sidebar */}
        <div className="w-64 shrink-0 hidden xl:block">
          <div className="bg-[#111827] rounded-xl border border-white/5 sticky top-6">
            <div className="p-4 border-b border-white/5">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Star size={15} className="text-[#ffa502]" /> Watchlist
              </h2>
            </div>
            <div className="divide-y divide-white/5">
              {WATCHLIST.map((w) => {
                const isPos = w.change.startsWith("+");
                return (
                  <div key={w.symbol} className="p-3 hover:bg-white/2 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-white">{w.symbol}</span>
                      <SignalBadge signal={w.signal} size="xs" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-300">{w.price}</span>
                      <span className={`text-xs font-medium ${isPos ? "text-[#00d4aa]" : "text-[#ff4757]"}`}>
                        {w.change}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-3 border-t border-white/5">
              <button className="w-full py-2 text-xs text-[#00d4aa] border border-[#00d4aa]/30 rounded-lg hover:bg-[#00d4aa]/10 transition-colors">
                Manage Watchlist â†’
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
