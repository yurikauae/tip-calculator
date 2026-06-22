import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart2,
  RefreshCw,
  AlertTriangle,
  Star,
  ChevronRight,
  Clock,
} from 'lucide-react';

const MOCK_DATA = [
  { symbol: 'EUR/USD', price: 1.08542, change: 0.32, signal: 'BUY', confidence: 82, category: 'Forex', entry: 1.0854, sl: 1.0820, tp: 1.0920 },
  { symbol: 'GBP/USD', price: 1.27341, change: -0.18, signal: 'SELL', confidence: 74, category: 'Forex', entry: 1.2734, sl: 1.2770, tp: 1.2660 },
  { symbol: 'BTC/USD', price: 67845.20, change: 2.14, signal: 'BUY', confidence: 88, category: 'Crypto', entry: 67845, sl: 65000, tp: 72000 },
  { symbol: 'ETH/USD', price: 3521.80, change: 1.87, signal: 'BUY', confidence: 79, category: 'Crypto', entry: 3521, sl: 3300, tp: 3850 },
  { symbol: 'XAU/USD', price: 2341.50, change: -0.45, signal: 'HOLD', confidence: 55, category: 'Commodities', entry: 2341, sl: 2300, tp: 2400 },
  { symbol: 'US30', price: 39842.00, change: 0.62, signal: 'BUY', confidence: 71, category: 'Indices', entry: 39842, sl: 39400, tp: 40500 },
  { symbol: 'USD/JPY', price: 157.823, change: 0.29, signal: 'BUY', confidence: 67, category: 'Forex', entry: 157.82, sl: 156.50, tp: 159.50 },
  { symbol: 'WTI/USD', price: 78.34, change: -1.12, signal: 'SELL', confidence: 76, category: 'Commodities', entry: 78.34, sl: 80.00, tp: 75.00 },
];

const CATEGORIES = ['All', 'Forex', 'Crypto', 'Indices', 'Commodities'];

const SignalBadge = ({ signal }) => {
  const config = {
    BUY: { bg: 'bg-[#00d4aa22]', text: 'text-[#00d4aa]', border: 'border-[#00d4aa44]' },
    SELL: { bg: 'bg-[#ff475722]', text: 'text-[#ff4757]', border: 'border-[#ff475744]' },
    HOLD: { bg: 'bg-[#ffa50222]', text: 'text-[#ffa502]', border: 'border-[#ffa50244]' },
  };
  const c = config[signal] || config.HOLD;
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${c.bg} ${c.text} ${c.border}`}>
      {signal}
    </span>
  );
};

const ConfidenceBar = ({ value }) => {
  const color = value >= 75 ? '#00d4aa' : value >= 55 ? '#ffa502' : '#ff4757';
  return (
    <div className="w-full bg-[#1f2937] rounded-full h-1.5 mt-1">
      <div
        className="h-1.5 rounded-full transition-all duration-500"
        style={{ width: `${value}%`, backgroundColor: color }}
      />
    </div>
  );
};

const SkeletonCard = () => (
  <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4 animate-pulse">
    <div className="flex justify-between items-start mb-3">
      <div className="h-4 w-20 bg-[#1f2937] rounded" />
      <div className="h-5 w-12 bg-[#1f2937] rounded" />
    </div>
    <div className="h-6 w-28 bg-[#1f2937] rounded mb-2" />
    <div className="h-3 w-16 bg-[#1f2937] rounded mb-3" />
    <div className="h-1.5 w-full bg-[#1f2937] rounded-full" />
  </div>
);

const SkeletonStat = () => (
  <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-5 animate-pulse">
    <div className="h-3 w-24 bg-[#1f2937] rounded mb-3" />
    <div className="h-8 w-16 bg-[#1f2937] rounded mb-1" />
    <div className="h-3 w-20 bg-[#1f2937] rounded" />
  </div>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const [assetsRes, signalsRes] = await Promise.all([
        fetch(`${baseUrl}/api/market/assets`),
        fetch(`${baseUrl}/api/signals`),
      ]);

      if (!assetsRes.ok || !signalsRes.ok) throw new Error('API error');

      const assetsData = await assetsRes.json();
      const signalsData = await signalsRes.json();

      const merged = (Array.isArray(assetsData) ? assetsData : []).map((asset) => {
        const sig = (Array.isArray(signalsData) ? signalsData : []).find(
          (s) => s.symbol === asset.symbol
        );
        return {
          ...asset,
          signal: sig?.signal || 'HOLD',
          confidence: sig?.confidence || 50,
          entry: sig?.entry || asset.price,
          sl: sig?.sl || null,
          tp: sig?.tp || null,
        };
      });

      if (merged.length === 0) throw new Error('Empty response');

      setAssets(merged);
      setError(null);
    } catch {
      setAssets(MOCK_DATA);
      setError('Using demo data — live feed unavailable.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLastUpdated(new Date());
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const filtered = activeCategory === 'All'
    ? assets
    : assets.filter((a) => a.category === activeCategory);

  const buyCount = assets.filter((a) => a.signal === 'BUY').length;
  const sellCount = assets.filter((a) => a.signal === 'SELL').length;
  const avgConfidence = assets.length
    ? Math.round(assets.reduce((sum, a) => sum + (a.confidence || 0), 0) / assets.length)
    : 0;

  const topSignals = [...assets]
    .filter((a) => a.signal !== 'HOLD')
    .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
    .slice(0, 5);

  const formatPrice = (price, symbol) => {
    if (!price && price !== 0) return '—';
    if (symbol?.includes('BTC') || symbol?.includes('US30'))
      return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return price.toFixed(symbol?.includes('JPY') ? 3 : 5);
  };

  const formatTime = (date) => {
    if (!date) return '—';
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
            <BarChart2 className="text-[#00d4aa]" size={28} />
            Market Dashboard
          </h1>
          <p className="text-gray-400 text-sm mt-1">Live signals &amp; market overview</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Clock size={13} />
            <span>Updated: {formatTime(lastUpdated)}</span>
          </div>
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs bg-[#111827] border border-[#1f2937] text-gray-300 hover:text-[#00d4aa] hover:border-[#00d4aa44] px-3 py-1.5 rounded-lg transition-all"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <button
            onClick={() => navigate('/watchlist')}
            className="flex items-center gap-1.5 text-xs bg-[#00d4aa22] border border-[#00d4aa44] text-[#00d4aa] hover:bg-[#00d4aa33] px-3 py-1.5 rounded-lg transition-all"
          >
            <Star size={13} />
            Manage Watchlist
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 bg-[#ffa50211] border border-[#ffa50244] text-[#ffa502] text-sm px-4 py-2.5 rounded-lg mb-6">
          <AlertTriangle size={15} />
          {error}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />)
        ) : (
          <>
            <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-5">
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Active Signals</p>
              <p className="text-3xl font-bold text-white">{assets.length}</p>
              <p className="text-gray-500 text-xs mt-1">across all markets</p>
            </div>
            <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-5">
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">BUY Signals</p>
              <p className="text-3xl font-bold text-[#00d4aa]">{buyCount}</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp size={12} className="text-[#00d4aa]" />
                <p className="text-gray-500 text-xs">bullish setups</p>
              </div>
            </div>
            <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-5">
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">SELL Signals</p>
              <p className="text-3xl font-bold text-[#ff4757]">{sellCount}</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingDown size={12} className="text-[#ff4757]" />
                <p className="text-gray-500 text-xs">bearish setups</p>
              </div>
            </div>
            <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-5">
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Avg Confidence</p>
              <p className="text-3xl font-bold text-[#ffa502]">{avgConfidence}%</p>
              <ConfidenceBar value={avgConfidence} />
            </div>
          </>
        )}
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`text-sm px-4 py-1.5 rounded-lg border whitespace-nowrap transition-all ${
              activeCategory === cat
                ? 'bg-[#00d4aa22] border-[#00d4aa66] text-[#00d4aa] font-medium'
                : 'bg-[#111827] border-[#1f2937] text-gray-400 hover:text-white hover:border-[#374151]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Market Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mb-10">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : filtered.map((asset) => (
              <div
                key={asset.symbol}
                onClick={() => navigate(`/asset/${encodeURIComponent(asset.symbol)}`)}
                className="bg-[#111827] border border-[#1f2937] hover:border-[#374151] rounded-xl p-4 cursor-pointer transition-all hover:bg-[#161d2e] group"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-gray-400 text-xs font-medium uppercase tracking-wide">
                    {asset.category || 'Market'}
                  </span>
                  <SignalBadge signal={asset.signal} />
                </div>
                <p className="text-white font-bold text-base mb-0.5 group-hover:text-[#00d4aa] transition-colors">
                  {asset.symbol}
                </p>
                <p className="text-white text-lg font-semibold mb-0.5">
                  {formatPrice(asset.price, asset.symbol)}
                </p>
                <div className="flex items-center gap-1 mb-2">
                  {asset.change >= 0 ? (
                    <TrendingUp size={11} className="text-[#00d4aa]" />
                  ) : (
                    <TrendingDown size={11} className="text-[#ff4757]" />
                  )}
                  <span
                    className={`text-xs font-medium ${
                      asset.change >= 0 ? 'text-[#00d4aa]' : 'text-[#ff4757]'
                    }`}
                  >
                    {asset.change >= 0 ? '+' : ''}
                    {typeof asset.change === 'number' ? asset.change.toFixed(2) : '0.00'}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-xs">{asset.confidence}% conf.</span>
                </div>
                <ConfidenceBar value={asset.confidence || 0} />
              </div>
            ))}
      </div>

      {/* Top Signals Section */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity size={18} className="text-[#00d4aa]" />
            Top Signals
          </h2>
          <button
            onClick={() => navigate('/signals')}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#00d4aa] transition-colors"
          >
            View all <ChevronRight size={13} />
          </button>
        </div>

        <div className="bg-[#111827] border border-[#1f2937] rounded-xl overflow-hidden">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 px-5 py-4 border-b border-[#1f2937] last:border-0 animate-pulse"
              >
                <div className="h-4 w-20 bg-[#1f2937] rounded" />
                <div className="h-5 w-12 bg-[#1f2937] rounded" />
                <div className="h-4 w-16 bg-[#1f2937] rounded ml-auto" />
              </div>
            ))
          ) : topSignals.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-500 text-sm">No signals available</div>
          ) : (
            topSignals.map((sig, idx) => (
              <div
                key={sig.symbol}
                onClick={() => navigate(`/asset/${encodeURIComponent(sig.symbol)}`)}
                className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-5 py-4 border-b border-[#1f2937] last:border-0 cursor-pointer hover:bg-[#161d2e] transition-colors group"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-gray-600 text-xs w-4 shrink-0">#{idx + 1}</span>
                  <span className="text-white font-semibold text-sm group-hover:text-[#00d4aa] transition-colors truncate">
                    {sig.symbol}
                  </span>
                  <SignalBadge signal={sig.signal} />
                </div>
                <div className="flex items-center gap-4 sm:gap-6 text-xs text-gray-400 flex-wrap">
                  <div className="flex flex-col items-start">
                    <span className="text-gray-600 text-[10px]">ENTRY</span>
                    <span className="text-white">{sig.entry ?? '—'}</span>
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-gray-600 text-[10px]">SL</span>
                    <span className="text-[#ff4757]">{sig.sl ?? '—'}</span>
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-gray-600 text-[10px]">TP</span>
                    <span className="text-[#00d4aa]">{sig.tp ?? '—'}</span>
                  </div>
                  <div className="flex flex-col items-start min-w-[64px]">
                    <span className="text-gray-600 text-[10px]">CONFIDENCE</span>
                    <span
                      className={`font-semibold ${
                        (sig.confidence || 0) >= 75
                          ? 'text-[#00d4aa]'
                          : (sig.confidence || 0) >= 55
                          ? 'text-[#ffa502]'
                          : 'text-[#ff4757]'
                      }`}
                    >
                      {sig.confidence}%
                    </span>
                  </div>
                </div>
                <ChevronRight
                  size={14}
                  className="text-gray-600 group-hover:text-[#00d4aa] shrink-0 hidden sm:block transition-colors"
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 bg-[#111827] border border-[#1f2937] rounded-xl px-5 py-4 text-xs text-gray-500">
        <AlertTriangle size={14} className="text-[#ffa502] shrink-0 mt-0.5" />
        <p>
          <span className="text-[#ffa502] font-semibold">Not financial advice.</span>{' '}
          All signals and data displayed are for informational purposes only. Trading involves
          substantial risk of loss. Past performance does not guarantee future results. Always
          conduct your own research and consult a qualified financial advisor before making any
          investment decisions.
        </p>
      </div>
    </div>
  );
}
