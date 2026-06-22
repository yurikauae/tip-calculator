import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Filter,
  ArrowUpDown,
  Clock,
  Target,
  Shield,
  AlertTriangle,
  ChevronRight,
  BarChart2,
  Loader2,
  AlertCircle,
  InboxIcon,
} from 'lucide-react';

const MOCK_SIGNALS = [
  {
    id: 1,
    symbol: 'EUR/USD',
    category: 'Forex',
    signalType: 'Strong Buy',
    confidence: 87,
    entryZone: '1.0845 - 1.0860',
    stopLoss: '1.0810',
    tp1: '1.0900',
    tp2: '1.0945',
    tp3: '1.0990',
    rrRatio: '2.8',
    reason: 'Bullish engulfing on H4 with confluence at major support. RSI divergence confirmed on daily timeframe. Strong momentum building.',
    timeframe: 'H4',
    timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
  },
  {
    id: 2,
    symbol: 'BTC/USD',
    category: 'Crypto',
    signalType: 'Buy',
    confidence: 74,
    entryZone: '64,200 - 64,800',
    stopLoss: '62,500',
    tp1: '67,000',
    tp2: '69,500',
    tp3: '72,000',
    rrRatio: '2.1',
    reason: 'Breaking out of descending wedge with increasing volume. On-chain metrics show accumulation by large holders.',
    timeframe: 'D1',
    timestamp: new Date(Date.now() - 35 * 60000).toISOString(),
  },
  {
    id: 3,
    symbol: 'GBP/JPY',
    category: 'Forex',
    signalType: 'Sell',
    confidence: 68,
    entryZone: '197.80 - 198.20',
    stopLoss: '199.50',
    tp1: '196.00',
    tp2: '194.50',
    tp3: '192.80',
    rrRatio: '1.9',
    reason: 'Rejection from weekly resistance with bearish pin bar. MACD histogram declining. Risk-off sentiment supporting JPY strength.',
    timeframe: 'H1',
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: 4,
    symbol: 'XAU/USD',
    category: 'Commodities',
    signalType: 'Strong Buy',
    confidence: 92,
    entryZone: '2,315 - 2,325',
    stopLoss: '2,285',
    tp1: '2,360',
    tp2: '2,395',
    tp3: '2,440',
    rrRatio: '3.2',
    reason: 'Gold breaking multi-week consolidation with strong fundamentals. Geopolitical tensions and Fed pivot expectations driving safe-haven demand. Volume confirmation.',
    timeframe: 'D1',
    timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
  },
  {
    id: 5,
    symbol: 'US30',
    category: 'Indices',
    signalType: 'Hold',
    confidence: 55,
    entryZone: '38,450 - 38,600',
    stopLoss: '37,900',
    tp1: '39,200',
    tp2: '39,800',
    tp3: '40,500',
    rrRatio: '1.4',
    reason: 'Mixed signals at key resistance. Awaiting CPI data before confirmation. Market breadth showing divergence.',
    timeframe: 'H4',
    timestamp: new Date(Date.now() - 90 * 60000).toISOString(),
  },
  {
    id: 6,
    symbol: 'ETH/USD',
    category: 'Crypto',
    signalType: 'Strong Sell',
    confidence: 81,
    entryZone: '3,380 - 3,420',
    stopLoss: '3,520',
    tp1: '3,200',
    tp2: '3,050',
    tp3: '2,900',
    rrRatio: '2.4',
    reason: 'Failed breakout with high volume rejection. Death cross forming on 4H. Smart money indicators showing distribution phase.',
    timeframe: 'H4',
    timestamp: new Date(Date.now() - 18 * 60000).toISOString(),
  },
  {
    id: 7,
    symbol: 'USD/JPY',
    category: 'Forex',
    signalType: 'Sell',
    confidence: 71,
    entryZone: '157.20 - 157.60',
    stopLoss: '158.80',
    tp1: '155.80',
    tp2: '154.50',
    tp3: '153.00',
    rrRatio: '2.0',
    reason: 'BOJ intervention risk at highs. Overbought on RSI weekly. Potential yen carry trade unwind in progress.',
    timeframe: 'H1',
    timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
  },
  {
    id: 8,
    symbol: 'WTI/USD',
    category: 'Commodities',
    signalType: 'Buy',
    confidence: 66,
    entryZone: '78.20 - 78.80',
    stopLoss: '76.50',
    tp1: '81.00',
    tp2: '83.50',
    tp3: '86.00',
    rrRatio: '2.3',
    reason: 'OPEC+ supply cut confirmation. Demand recovery signals from China PMI data. Seasonal demand patterns aligned.',
    timeframe: 'D1',
    timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
  },
  {
    id: 9,
    symbol: 'NAS100',
    category: 'Indices',
    signalType: 'Strong Buy',
    confidence: 83,
    entryZone: '18,200 - 18,350',
    stopLoss: '17,800',
    tp1: '18,900',
    tp2: '19,400',
    tp3: '20,000',
    rrRatio: '2.7',
    reason: 'Tech sector leading market recovery. AI earnings beats driving sentiment. Breakout above all-time high with volume surge.',
    timeframe: 'H4',
    timestamp: new Date(Date.now() - 8 * 60000).toISOString(),
  },
  {
    id: 10,
    symbol: 'AUD/USD',
    category: 'Forex',
    signalType: 'Hold',
    confidence: 48,
    entryZone: '0.6580 - 0.6610',
    stopLoss: '0.6520',
    tp1: '0.6680',
    tp2: '0.6740',
    tp3: '0.6800',
    rrRatio: '1.6',
    reason: 'Consolidating ahead of RBA decision. Commodity prices mixed. Waiting for catalyst before directional bias confirmed.',
    timeframe: 'H1',
    timestamp: new Date(Date.now() - 200 * 60000).toISOString(),
  },
];

const SIGNAL_TYPES = ['All', 'Strong Buy', 'Buy', 'Hold', 'Sell', 'Strong Sell'];
const CATEGORIES = ['All', 'Forex', 'Crypto', 'Indices', 'Commodities'];
const TIMEFRAMES = ['All', 'M15', 'H1', 'H4', 'D1', 'W1'];
const SORT_OPTIONS = [
  { value: 'confidence_desc', label: 'Confidence (High to Low)' },
  { value: 'symbol_asc', label: 'Symbol (A to Z)' },
  { value: 'signal_type', label: 'Signal Type' },
  { value: 'timestamp_desc', label: 'Newest First' },
];

const SIGNAL_TYPE_ORDER = ['Strong Buy', 'Buy', 'Hold', 'Wait', 'Sell', 'Strong Sell'];

function getSignalStyle(signalType) {
  switch (signalType) {
    case 'Strong Buy':
      return { bg: 'bg-[#00d4aa]/20', text: 'text-[#00d4aa]', border: 'border-[#00d4aa]/40', dot: 'bg-[#00d4aa]' };
    case 'Buy':
      return { bg: 'bg-green-500/15', text: 'text-green-400', border: 'border-green-500/40', dot: 'bg-green-400' };
    case 'Hold':
      return { bg: 'bg-[#ffa502]/15', text: 'text-[#ffa502]', border: 'border-[#ffa502]/40', dot: 'bg-[#ffa502]' };
    case 'Sell':
      return { bg: 'bg-[#ff4757]/15', text: 'text-[#ff4757]', border: 'border-[#ff4757]/40', dot: 'bg-[#ff4757]' };
    case 'Strong Sell':
      return { bg: 'bg-[#ff4757]/25', text: 'text-red-400', border: 'border-red-400/50', dot: 'bg-red-400' };
    default:
      return { bg: 'bg-gray-500/15', text: 'text-gray-400', border: 'border-gray-500/40', dot: 'bg-gray-400' };
  }
}

function getSignalIcon(signalType) {
  if (signalType === 'Strong Buy' || signalType === 'Buy') return <TrendingUp size={13} />;
  if (signalType === 'Strong Sell' || signalType === 'Sell') return <TrendingDown size={13} />;
  return <Minus size={13} />;
}

function getCategoryStyle(category) {
  switch (category) {
    case 'Forex': return { bg: 'bg-blue-500/15', text: 'text-blue-400' };
    case 'Crypto': return { bg: 'bg-purple-500/15', text: 'text-purple-400' };
    case 'Indices': return { bg: 'bg-orange-500/15', text: 'text-orange-400' };
    case 'Commodities': return { bg: 'bg-yellow-500/15', text: 'text-yellow-400' };
    default: return { bg: 'bg-gray-500/15', text: 'text-gray-400' };
  }
}

function getConfidenceColor(confidence) {
  if (confidence >= 80) return 'bg-[#00d4aa]';
  if (confidence >= 65) return 'bg-green-400';
  if (confidence >= 50) return 'bg-[#ffa502]';
  return 'bg-[#ff4757]';
}

function formatTimestamp(iso) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return 'Just now';
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

export default function SignalCentre() {
  const navigate = useNavigate();
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const [filterType, setFilterType] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterTimeframe, setFilterTimeframe] = useState('All');
  const [sortBy, setSortBy] = useState('confidence_desc');

  const fetchSignals = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/signals');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSignals(Array.isArray(data) ? data : data.signals || MOCK_SIGNALS);
    } catch {
      setSignals(MOCK_SIGNALS);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLastUpdated(new Date());
    }
  }, []);

  useEffect(() => {
    fetchSignals(false);
    const interval = setInterval(() => fetchSignals(true), 60000);
    return () => clearInterval(interval);
  }, [fetchSignals]);

  const filteredAndSorted = useMemo(() => {
    let result = [...signals];
    if (filterType !== 'All') result = result.filter(s => s.signalType === filterType);
    if (filterCategory !== 'All') result = result.filter(s => s.category === filterCategory);
    if (filterTimeframe !== 'All') result = result.filter(s => s.timeframe === filterTimeframe);

    result.sort((a, b) => {
      switch (sortBy) {
        case 'confidence_desc': return b.confidence - a.confidence;
        case 'symbol_asc': return a.symbol.localeCompare(b.symbol);
        case 'signal_type':
          return SIGNAL_TYPE_ORDER.indexOf(a.signalType) - SIGNAL_TYPE_ORDER.indexOf(b.signalType);
        case 'timestamp_desc':
          return new Date(b.timestamp) - new Date(a.timestamp);
        default: return 0;
      }
    });
    return result;
  }, [signals, filterType, filterCategory, filterTimeframe, sortBy]);

  const handleCardClick = (symbol) => {
    navigate(`/asset/${encodeURIComponent(symbol)}`);
  };

  const handleOpenTrade = (e, signal) => {
    e.stopPropagation();
    const params = new URLSearchParams({
      symbol: signal.symbol,
      entry: signal.entryZone.split(' - ')[0],
      sl: signal.stopLoss,
      tp: signal.tp1,
    });
    navigate(`/paper-trading?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      {/* Header */}
      <div className="border-b border-[#1f2937] bg-[#0a0e1a]/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <BarChart2 className="text-[#00d4aa]" size={26} />
                Signal Centre
              </h1>
              <p className="text-sm text-gray-400 mt-0.5">
                {lastUpdated
                  ? `Last updated ${formatTimestamp(lastUpdated.toISOString())}`
                  : 'Loading signals...'}
              </p>
            </div>
            <button
              onClick={() => fetchSignals(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-[#111827] border border-[#1f2937] rounded-lg text-sm text-gray-300 hover:border-[#00d4aa]/50 hover:text-[#00d4aa] transition-all disabled:opacity-50"
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-start">
            {/* Signal Type Filter */}
            <div className="flex-1 min-w-[200px]">
              <label className="flex items-center gap-1.5 text-xs text-gray-400 mb-2 font-medium">
                <Filter size={12} /> Signal Type
              </label>
              <div className="flex flex-wrap gap-1.5">
                {SIGNAL_TYPES.map(type => {
                  const style = type === 'All' ? null : getSignalStyle(type);
                  const isActive = filterType === type;
                  return (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                        isActive
                          ? type === 'All'
                            ? 'bg-[#00d4aa]/20 text-[#00d4aa] border-[#00d4aa]/50'
                            : `${style.bg} ${style.text} ${style.border}`
                          : 'bg-transparent text-gray-500 border-[#1f2937] hover:border-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex-1 min-w-[180px]">
              <label className="text-xs text-gray-400 mb-2 font-medium block">Category</label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map(cat => {
                  const style = cat === 'All' ? null : getCategoryStyle(cat);
                  const isActive = filterCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                        isActive
                          ? cat === 'All'
                            ? 'bg-[#00d4aa]/20 text-[#00d4aa] border-[#00d4aa]/50'
                            : `${style.bg} ${style.text} border-current`
                          : 'bg-transparent text-gray-500 border-[#1f2937] hover:border-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Timeframe + Sort */}
            <div className="flex gap-3 items-end">
              <div>
                <label className="flex items-center gap-1.5 text-xs text-gray-400 mb-2 font-medium">
                  <Clock size={12} /> Timeframe
                </label>
                <select
                  value={filterTimeframe}
                  onChange={e => setFilterTimeframe(e.target.value)}
                  className="bg-[#0a0e1a] border border-[#1f2937] rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-[#00d4aa]/50"
                >
                  {TIMEFRAMES.map(tf => <option key={tf} value={tf}>{tf}</option>)}
                </select>
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs text-gray-400 mb-2 font-medium">
                  <ArrowUpDown size={12} /> Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="bg-[#0a0e1a] border border-[#1f2937] rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-[#00d4aa]/50"
                >
                  {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Signal Count */}
        {!loading && !error && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-400">
              Showing{' '}
              <span className="text-[#00d4aa] font-semibold">{filteredAndSorted.length}</span>
              {' '}of{' '}
              <span className="text-white font-semibold">{signals.length}</span>
              {' '}signals
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-2 h-2 rounded-full bg-[#00d4aa] animate-pulse" />
              Auto-refreshes every 60s
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <Loader2 size={40} className="animate-spin text-[#00d4aa] mb-4" />
            <p className="text-lg font-medium">Loading signals...</p>
            <p className="text-sm text-gray-500 mt-1">Fetching latest market analysis</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <AlertCircle size={40} className="text-[#ff4757] mb-4" />
            <p className="text-lg font-medium text-white">Failed to load signals</p>
            <p className="text-sm text-gray-500 mt-1 mb-4">{error}</p>
            <button
              onClick={() => fetchSignals(false)}
              className="px-4 py-2 bg-[#00d4aa]/20 text-[#00d4aa] border border-[#00d4aa]/40 rounded-lg text-sm hover:bg-[#00d4aa]/30 transition-all"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredAndSorted.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <InboxIcon size={40} className="text-gray-600 mb-4" />
            <p className="text-lg font-medium text-white">No signals match your filters</p>
            <p className="text-sm text-gray-500 mt-1 mb-4">Try adjusting or clearing your filters</p>
            <button
              onClick={() => { setFilterType('All'); setFilterCategory('All'); setFilterTimeframe('All'); }}
              className="px-4 py-2 bg-[#111827] border border-[#1f2937] rounded-lg text-sm text-gray-300 hover:border-[#00d4aa]/50 hover:text-[#00d4aa] transition-all"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Signal Cards Grid */}
        {!loading && !error && filteredAndSorted.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredAndSorted.map(signal => {
              const sigStyle = getSignalStyle(signal.signalType);
              const catStyle = getCategoryStyle(signal.category);
              const confColor = getConfidenceColor(signal.confidence);

              return (
                <div
                  key={signal.id}
                  onClick={() => handleCardClick(signal.symbol)}
                  className="bg-[#111827] border border-[#1f2937] rounded-xl p-5 cursor-pointer hover:border-[#00d4aa]/30 hover:shadow-lg hover:shadow-[#00d4aa]/5 transition-all group"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="text-lg font-bold text-white group-hover:text-[#00d4aa] transition-colors">
                          {signal.symbol}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${catStyle.bg} ${catStyle.text}`}>
                          {signal.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${sigStyle.bg} ${sigStyle.text} ${sigStyle.border}`}>
                          {getSignalIcon(signal.signalType)}
                          {signal.signalType}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock size={11} />
                          {signal.timeframe}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-600 group-hover:text-[#00d4aa] transition-colors mt-1" />
                  </div>

                  {/* Confidence */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-gray-400 font-medium">Confidence</span>
                      <span className={`text-sm font-bold ${
                        signal.confidence >= 80 ? 'text-[#00d4aa]'
                        : signal.confidence >= 65 ? 'text-green-400'
                        : signal.confidence >= 50 ? 'text-[#ffa502]'
                        : 'text-[#ff4757]'
                      }`}>
                        {signal.confidence}%
                      </span>
                    </div>
                    <div className="w-full bg-[#1f2937] rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${confColor}`}
                        style={{ width: `${signal.confidence}%` }}
                      />
                    </div>
                  </div>

                  {/* Entry / SL / R:R */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-[#0a0e1a] rounded-lg p-2.5">
                      <div className="flex items-center gap-1 mb-1">
                        <Target size={10} className="text-blue-400" />
                        <span className="text-[10px] text-gray-500 font-medium">ENTRY</span>
                      </div>
                      <p className="text-xs text-white font-medium leading-tight">{signal.entryZone}</p>
                    </div>
                    <div className="bg-[#0a0e1a] rounded-lg p-2.5">
                      <div className="flex items-center gap-1 mb-1">
                        <Shield size={10} className="text-[#ff4757]" />
                        <span className="text-[10px] text-gray-500 font-medium">SL</span>
                      </div>
                      <p className="text-xs text-[#ff4757] font-medium">{signal.stopLoss}</p>
                    </div>
                    <div className="bg-[#0a0e1a] rounded-lg p-2.5">
                      <div className="flex items-center gap-1 mb-1">
                        <AlertTriangle size={10} className="text-[#ffa502]" />
                        <span className="text-[10px] text-gray-500 font-medium">R:R</span>
                      </div>
                      <p className="text-xs text-[#ffa502] font-bold">1:{signal.rrRatio}</p>
                    </div>
                  </div>

                  {/* Take Profits */}
                  <div className="flex gap-2 mb-3">
                    {[signal.tp1, signal.tp2, signal.tp3].map((tp, i) => (
                      <div key={i} className="flex-1 bg-[#00d4aa]/5 border border-[#00d4aa]/15 rounded-lg px-2 py-1.5 text-center">
                        <span className="text-[10px] text-[#00d4aa]/60 font-medium block">TP{i + 1}</span>
                        <span className="text-xs text-[#00d4aa] font-semibold">{tp}</span>
                      </div>
                    ))}
                  </div>

                  {/* Reason */}
                  <p className="text-xs text-gray-400 leading-relaxed mb-4 line-clamp-2">
                    {signal.reason}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-500 flex items-center gap-1">
                      <Clock size={10} />
                      {formatTimestamp(signal.timestamp)}
                    </span>
                    <button
                      onClick={(e) => handleOpenTrade(e, signal)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00d4aa]/15 text-[#00d4aa] border border-[#00d4aa]/30 rounded-lg text-xs font-semibold hover:bg-[#00d4aa]/25 hover:border-[#00d4aa]/60 transition-all"
                    >
                      Open Trade
                      <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
