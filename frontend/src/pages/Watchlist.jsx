import { useState } from "react";
import { Search, Trash2, Plus, Star, TrendingUp, TrendingDown } from "lucide-react";

const INITIAL_WATCHLIST = [
  { id: 1, symbol: "EUR/USD", category: "Forex", price: "1.08432", change: "+0.42%", signal: "BUY", confidence: 87, high: "1.08760", low: "1.08010" },
  { id: 2, symbol: "BTC/USD", category: "Crypto", price: "67,240.00", change: "+2.15%", signal: "BUY", confidence: 92, high: "67,890", low: "65,100" },
  { id: 3, symbol: "SPX500", category: "Indices", price: "5,234.18", change: "+0.68%", signal: "BUY", confidence: 82, high: "5,248", low: "5,189" },
  { id: 4, symbol: "GOLD", category: "Commodities", price: "2,318.50", change: "-0.22%", signal: "NEUTRAL", confidence: 55, high: "2,332", low: "2,305" },
  { id: 5, symbol: "GBP/USD", category: "Forex", price: "1.26781", change: "-0.31%", signal: "SELL", confidence: 81, high: "1.27210", low: "1.26540" },
  { id: 6, symbol: "ETH/USD", category: "Crypto", price: "3,512.40", change: "+1.87%", signal: "BUY", confidence: 89, high: "3,560", low: "3,420" },
];

const SEARCH_SUGGESTIONS = [
  "AUD/USD", "USD/JPY", "NAS100", "DOW30", "OIL/WTI", "SILVER",
  "SOL/USD", "XRP/USD", "USD/CAD", "NZD/USD", "SPY", "QQQ",
];

function SignalBadge({ signal }) {
  const config = {
    BUY: { bg: "bg-[#00d4aa]/20", text: "text-[#00d4aa]", border: "border-[#00d4aa]/40" },
    SELL: { bg: "bg-[#ff4757]/20", text: "text-[#ff4757]", border: "border-[#ff4757]/40" },
    NEUTRAL: { bg: "bg-[#ffa502]/20", text: "text-[#ffa502]", border: "border-[#ffa502]/40" },
  };
  const c = config[signal] || config.NEUTRAL;
  return (
    <span className={`inline-flex font-bold rounded border px-2.5 py-0.5 text-xs ${c.bg} ${c.text} ${c.border}`}>
      {signal}
    </span>
  );
}

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState(INITIAL_WATCHLIST);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [notification, setNotification] = useState(null);

  const filteredSuggestions = SEARCH_SUGGESTIONS.filter(
    (s) =>
      s.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !watchlist.find((w) => w.symbol === s)
  );

  const addToWatchlist = (symbol) => {
    if (watchlist.find((w) => w.symbol === symbol)) return;
    const newItem = {
      id: Date.now(),
      symbol,
      category: "Forex",
      price: (1 + Math.random()).toFixed(5),
      change: `${Math.random() > 0.5 ? "+" : "-"}${(Math.random() * 2).toFixed(2)}%`,
      signal: ["BUY", "SELL", "NEUTRAL"][Math.floor(Math.random() * 3)],
      confidence: Math.floor(60 + Math.random() * 35),
      high: "â€”",
      low: "â€”",
    };
    setWatchlist((prev) => [newItem, ...prev]);
    setSearchQuery("");
    setShowSuggestions(false);
    setNotification(`${symbol} added to watchlist`);
    setTimeout(() => setNotification(null), 3000);
  };

  const removeFromWatchlist = (id, symbol) => {
    setWatchlist((prev) => prev.filter((w) => w.id !== id));
    setNotification(`${symbol} removed from watchlist`);
    setTimeout(() => setNotification(null), 3000);
  };

  const buySignals = watchlist.filter((w) => w.signal === "BUY").length;
  const sellSignals = watchlist.filter((w) => w.signal === "SELL").length;

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white p-6">
      {/* Notification */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 bg-[#111827] border border-[#00d4aa]/40 text-[#00d4aa] text-sm px-4 py-3 rounded-xl shadow-xl animate-pulse">
          {notification}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-2">
            <Star size={26} className="text-[#ffa502]" /> My Watchlist
          </h1>
          <p className="text-gray-400 text-sm">{watchlist.length} assets tracked · {buySignals} BUY · {sellSignals} SELL</p>
        </div>
      </div>

      {/* Search / Add */}
      <div className="relative mb-8 max-w-md">
        <div className="flex items-center gap-3 bg-[#111827] border border-white/10 rounded-xl px-4 py-3 focus-within:border-[#00d4aa]/40 transition-all">
          <Search size={16} className="text-gray-500 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Search symbol to add (e.g. AUD/USD)..."
            className="bg-transparent text-white placeholder-gray-500 outline-none flex-1 text-sm"
          />
          {searchQuery && (
            <button
              onMouseDown={() => addToWatchlist(searchQuery.toUpperCase())}
              className="flex items-center gap-1 text-[#00d4aa] text-xs font-semibold hover:text-white transition-colors"
            >
              <Plus size={14} /> Add
            </button>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-[#111827] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-40">
            {filteredSuggestions.slice(0, 8).map((s) => (
              <button
                key={s}
                onMouseDown={() => addToWatchlist(s)}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
              >
                <Plus size={13} className="text-[#00d4aa]" /> {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SummaryCard label="Total Watched" value={watchlist.length} icon={Star} color="text-[#ffa502]" />
        <SummaryCard label="BUY Signals" value={buySignals} icon={TrendingUp} color="text-[#00d4aa]" />
        <SummaryCard label="SELL Signals" value={sellSignals} icon={TrendingDown} color="text-[#ff4757]" />
        <SummaryCard label="Avg Confidence" value={`${Math.round(watchlist.reduce((a, b) => a + b.confidence, 0) / (watchlist.length || 1))}%`} icon={Star} color="text-[#ffa502]" />
      </div>

      {/* Watchlist Table */}
      {watchlist.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Star size={40} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg">Your watchlist is empty.</p>
          <p className="text-sm mt-1">Search above to add assets to track.</p>
        </div>
      ) : (
        <div className="bg-[#111827] rounded-xl border border-white/5 overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-white/5 text-xs text-gray-400 font-medium">
            <span>SYMBOL</span>
            <span>PRICE</span>
            <span>CHANGE</span>
            <span>SIGNAL</span>
            <span>CONFIDENCE</span>
            <span className="hidden lg:block">HIGH / LOW</span>
            <span></span>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-white/5">
            {watchlist.map((item) => {
              const isPos = item.change.startsWith("+");
              return (
                <div
                  key={item.id}
                  className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_auto] gap-4 px-5 py-4 items-center hover:bg-white/2 transition-colors"
                >
                  {/* Symbol */}
                  <div>
                    <div className="font-semibold text-white">{item.symbol}</div>
                    <div className="text-xs text-gray-500">{item.category}</div>
                  </div>

                  {/* Price */}
                  <div className="font-mono text-white text-sm">{item.price}</div>

                  {/* Change */}
                  <div className={`text-sm font-semibold flex items-center gap-1 ${isPos ? "text-[#00d4aa]" : "text-[#ff4757]"}`}>
                    {isPos ? <TrendingUp size={13} /> : <TrendingDown size={13} />} {item.change}
                  </div>

                  {/* Signal */}
                  <div><SignalBadge signal={item.signal} /></div>

                  {/* Confidence */}
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${item.confidence}%`,
                          backgroundColor: item.signal === "BUY" ? "#00d4aa" : item.signal === "SELL" ? "#ff4757" : "#ffa502",
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-300">{item.confidence}%</span>
                  </div>

                  {/* High / Low */}
                  <div className="hidden lg:flex flex-col text-xs">
                    <span className="text-[#00d4aa]">H: {item.high}</span>
                    <span className="text-[#ff4757]">L: {item.low}</span>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeFromWatchlist(item.id, item.symbol)}
                    className="p-2 text-gray-600 hover:text-[#ff4757] hover:bg-[#ff4757]/10 rounded-lg transition-all"
                    title="Remove from watchlist"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-[#111827] rounded-xl p-4 border border-white/5">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className={color} />
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
