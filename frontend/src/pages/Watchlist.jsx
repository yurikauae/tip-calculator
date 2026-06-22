import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Star, Trash2, Download, Plus, Search, ChevronUp, ChevronDown, X, TrendingUp, TrendingDown
} from 'lucide-react';

const STORAGE_KEY = 'msi_watchlist';
const DEFAULT_SYMBOLS = ['EURUSD', 'BTCUSD', 'XAUUSD', 'SPX500'];

const CATEGORY_MAP = {
  EURUSD: 'Forex', GBPUSD: 'Forex', USDJPY: 'Forex', AUDUSD: 'Forex', USDCAD: 'Forex',
  BTCUSD: 'Crypto', ETHUSD: 'Crypto', XRPUSD: 'Crypto', SOLUSD: 'Crypto', BNBUSD: 'Crypto',
  XAUUSD: 'Commodity', XAGUSD: 'Commodity', WTIUSD: 'Commodity', NATGAS: 'Commodity',
  SPX500: 'Index', NAS100: 'Index', DOW30: 'Index', DAX40: 'Index',
};

const BASE_PRICES = {
  EURUSD: 1.0842, GBPUSD: 1.2714, USDJPY: 149.52, AUDUSD: 0.6521, USDCAD: 1.3612,
  BTCUSD: 67420.5, ETHUSD: 3521.8, XRPUSD: 0.5842, SOLUSD: 142.35, BNBUSD: 412.7,
  XAUUSD: 2341.5, XAGUSD: 27.84, WTIUSD: 78.42, NATGAS: 2.614,
  SPX500: 5218.4, NAS100: 18432.6, DOW30: 39512.3, DAX40: 18214.8,
};

const SIGNALS = ['BUY', 'SELL', 'HOLD', 'WAIT'];

function getCategory(symbol) {
  return CATEGORY_MAP[symbol] || 'Other';
}

function getBasePrice(symbol) {
  return BASE_PRICES[symbol] || 100 + Math.random() * 900;
}

function randomWalk(price) {
  const change = price * (Math.random() * 0.002 - 0.001);
  return price + change;
}

function generateSignal() {
  return SIGNALS[Math.floor(Math.random() * SIGNALS.length)];
}

function generateConfidence() {
  return Math.floor(55 + Math.random() * 40);
}

function initAssetData(symbol) {
  const price = getBasePrice(symbol);
  const changePercent = parseFloat((Math.random() * 6 - 3).toFixed(2));
  return {
    symbol,
    price,
    changePercent,
    signal: generateSignal(),
    confidence: generateConfidence(),
  };
}

const SIGNAL_STYLES = {
  BUY: { bg: 'bg-[#003d30]', text: 'text-[#00d4aa]', border: 'border-[#00d4aa]' },
  SELL: { bg: 'bg-[#3d0a10]', text: 'text-[#ff4757]', border: 'border-[#ff4757]' },
  HOLD: { bg: 'bg-[#3d2a00]', text: 'text-[#ffa502]', border: 'border-[#ffa502]' },
  WAIT: { bg: 'bg-[#1f2937]', text: 'text-gray-400', border: 'border-gray-500' },
};

function SignalBadge({ signal }) {
  const s = SIGNAL_STYLES[signal] || SIGNAL_STYLES.WAIT;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-semibold ${s.bg} ${s.text} ${s.border}`}>
      {signal}
    </span>
  );
}

function SortIcon({ column, sortConfig }) {
  if (sortConfig.key !== column) {
    return <ChevronUp className="w-3 h-3 text-gray-600 inline ml-1" />;
  }
  return sortConfig.direction === 'asc'
    ? <ChevronUp className="w-3 h-3 text-[#00d4aa] inline ml-1" />
    : <ChevronDown className="w-3 h-3 text-[#00d4aa] inline ml-1" />;
}

export default function Watchlist() {
  const navigate = useNavigate();

  const [symbols, setSymbols] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_SYMBOLS;
  });

  const [assetData, setAssetData] = useState(() => {
    let syms = DEFAULT_SYMBOLS;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) syms = parsed;
    } catch {}
    const data = {};
    syms.forEach(s => { data[s] = initAssetData(s); });
    return data;
  });

  const [selected, setSelected] = useState(new Set());
  const [sortConfig, setSortConfig] = useState({ key: 'symbol', direction: 'asc' });
  const [search, setSearch] = useState('');
  const [newSymbol, setNewSymbol] = useState('');
  const [addError, setAddError] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(symbols));
  }, [symbols]);

  useEffect(() => {
    const interval = setInterval(() => {
      setAssetData(prev => {
        const updated = { ...prev };
        symbols.forEach(sym => {
          if (updated[sym]) {
            const newPrice = randomWalk(updated[sym].price);
            const basePrice = getBasePrice(sym);
            const changePercent = parseFloat(((newPrice - basePrice) / basePrice * 100).toFixed(2));
            updated[sym] = { ...updated[sym], price: newPrice, changePercent };
          }
        });
        return updated;
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [symbols]);

  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const filteredSorted = useMemo(() => {
    let rows = symbols
      .filter(s => s.toLowerCase().includes(search.toLowerCase()))
      .map(s => assetData[s] || initAssetData(s));

    rows.sort((a, b) => {
      let aVal, bVal;
      switch (sortConfig.key) {
        case 'symbol': aVal = a.symbol; bVal = b.symbol; break;
        case 'price': aVal = a.price; bVal = b.price; break;
        case 'change': aVal = a.changePercent; bVal = b.changePercent; break;
        case 'signal': aVal = a.signal; bVal = b.signal; break;
        case 'confidence': aVal = a.confidence; bVal = b.confidence; break;
        default: aVal = a.symbol; bVal = b.symbol;
      }
      if (typeof aVal === 'string') {
        return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return rows;
  }, [symbols, assetData, search, sortConfig]);

  const allFilteredSelected = filteredSorted.length > 0 && filteredSorted.every(r => selected.has(r.symbol));

  const toggleSelectAll = useCallback(() => {
    if (allFilteredSelected) {
      setSelected(prev => {
        const next = new Set(prev);
        filteredSorted.forEach(r => next.delete(r.symbol));
        return next;
      });
    } else {
      setSelected(prev => {
        const next = new Set(prev);
        filteredSorted.forEach(r => next.add(r.symbol));
        return next;
      });
    }
  }, [allFilteredSelected, filteredSorted]);

  const toggleSelect = useCallback((sym) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(sym)) next.delete(sym);
      else next.add(sym);
      return next;
    });
  }, []);

  const removeSymbol = useCallback((sym, e) => {
    e.stopPropagation();
    setSymbols(prev => prev.filter(s => s !== sym));
    setSelected(prev => { const next = new Set(prev); next.delete(sym); return next; });
  }, []);

  const removeSelected = useCallback(() => {
    setSymbols(prev => prev.filter(s => !selected.has(s)));
    setSelected(new Set());
  }, [selected]);

  const exportCSV = useCallback(() => {
    const header = 'symbol,price,change%,signal,confidence\n';
    const rows = filteredSorted.map(r =>
      `${r.symbol},${r.price.toFixed(4)},${r.changePercent},${r.signal},${r.confidence}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'watchlist.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredSorted]);

  const handleAddSymbol = useCallback(() => {
    const sym = newSymbol.trim().toUpperCase();
    if (!sym) { setAddError('Please enter a symbol.'); return; }
    if (symbols.includes(sym)) { setAddError(`${sym} is already in your watchlist.`); return; }
    setSymbols(prev => [...prev, sym]);
    setAssetData(prev => ({ ...prev, [sym]: initAssetData(sym) }));
    setNewSymbol('');
    setAddError('');
  }, [newSymbol, symbols]);

  const handleRowClick = useCallback((sym) => {
    navigate(`/asset/${sym}`);
  }, [navigate]);

  const formatPrice = (price, symbol) => {
    if (['BTCUSD', 'ETHUSD', 'SPX500', 'NAS100', 'DOW30', 'DAX40'].includes(symbol)) {
      return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (['EURUSD', 'GBPUSD', 'AUDUSD', 'XRPUSD'].includes(symbol)) {
      return price.toFixed(4);
    }
    return price.toFixed(2);
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Star className="w-6 h-6 text-[#00d4aa]" />
          <h1 className="text-2xl font-bold text-white">Watchlist</h1>
          <span className="ml-2 px-2 py-0.5 rounded bg-[#1f2937] text-gray-400 text-sm">
            {symbols.length} symbols
          </span>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap gap-3 mb-4 items-center">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search symbols..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#111827] border border-[#1f2937] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4aa] transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Add symbol..."
              value={newSymbol}
              onChange={e => { setNewSymbol(e.target.value.toUpperCase()); setAddError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleAddSymbol()}
              className="px-3 py-2 bg-[#111827] border border-[#1f2937] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4aa] transition-colors w-32"
            />
            <button
              onClick={handleAddSymbol}
              className="flex items-center gap-1 px-3 py-2 bg-[#00d4aa] hover:bg-[#00b894] text-black font-semibold text-sm rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          <div className="flex-1" />

          {selected.size > 0 && (
            <button
              onClick={removeSelected}
              className="flex items-center gap-1 px-3 py-2 bg-[#3d0a10] border border-[#ff4757] text-[#ff4757] hover:bg-[#ff4757] hover:text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Remove ({selected.size})
            </button>
          )}
          <button
            onClick={exportCSV}
            className="flex items-center gap-1 px-3 py-2 bg-[#111827] border border-[#1f2937] hover:border-[#00d4aa] text-gray-300 hover:text-[#00d4aa] text-sm font-semibold rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {addError && (
          <div className="mb-3 px-4 py-2 bg-[#3d0a10] border border-[#ff4757] text-[#ff4757] rounded-lg text-sm">
            {addError}
          </div>
        )}

        {/* Empty State */}
        {symbols.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-[#111827] border border-[#1f2937] rounded-xl">
            <Star className="w-12 h-12 text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg mb-2">Your watchlist is empty.</p>
            <p className="text-gray-600 text-sm mb-6">Add symbols to get started.</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Enter symbol (e.g. EURUSD)"
                value={newSymbol}
                onChange={e => { setNewSymbol(e.target.value.toUpperCase()); setAddError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleAddSymbol()}
                className="px-3 py-2 bg-[#0a0e1a] border border-[#1f2937] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4aa] transition-colors w-48"
              />
              <button
                onClick={handleAddSymbol}
                className="flex items-center gap-1 px-4 py-2 bg-[#00d4aa] hover:bg-[#00b894] text-black font-semibold text-sm rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            {addError && <p className="mt-2 text-[#ff4757] text-sm">{addError}</p>}
          </div>
        ) : (
          <div className="bg-[#111827] border border-[#1f2937] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1f2937]">
                    <th className="px-4 py-3 text-left w-10">
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 accent-[#00d4aa] cursor-pointer"
                      />
                    </th>
                    {[
                      { key: 'symbol', label: 'Symbol' },
                      { key: 'price', label: 'Price' },
                      { key: 'change', label: '24h Change' },
                      { key: 'signal', label: 'Signal' },
                      { key: 'confidence', label: 'Confidence' },
                    ].map(col => (
                      <th
                        key={col.key}
                        onClick={() => handleSort(col.key)}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-[#00d4aa] select-none transition-colors"
                      >
                        {col.label}
                        <SortIcon column={col.key} sortConfig={sortConfig} />
                      </th>
                    ))}
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSorted.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-500">
                        No symbols match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredSorted.map((row, idx) => {
                      const isPositive = row.changePercent >= 0;
                      const isSelected = selected.has(row.symbol);
                      return (
                        <tr
                          key={row.symbol}
                          onClick={() => handleRowClick(row.symbol)}
                          className={`border-b border-[#1f2937] cursor-pointer transition-colors
                            ${isSelected ? 'bg-[#0d1929]' : idx % 2 === 0 ? 'bg-transparent' : 'bg-[#0d1420]'}
                            hover:bg-[#162032]`}
                        >
                          <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(row.symbol)}
                              className="w-4 h-4 accent-[#00d4aa] cursor-pointer"
                            />
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="font-bold text-white text-sm">{row.symbol}</span>
                              <span className="text-xs text-gray-500">{getCategory(row.symbol)}</span>
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <span className="font-mono text-white text-sm">
                              {formatPrice(row.price, row.symbol)}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <div className={`flex items-center gap-1 text-sm font-semibold ${isPositive ? 'text-[#00d4aa]' : 'text-[#ff4757]'}`}>
                              {isPositive
                                ? <TrendingUp className="w-3.5 h-3.5" />
                                : <TrendingDown className="w-3.5 h-3.5" />}
                              {isPositive ? '+' : ''}{row.changePercent.toFixed(2)}%
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <SignalBadge signal={row.signal} />
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-[#1f2937] rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${row.confidence}%`,
                                    background: row.confidence >= 75 ? '#00d4aa' : row.confidence >= 60 ? '#ffa502' : '#ff4757',
                                  }}
                                />
                              </div>
                              <span className="text-sm text-gray-300 font-mono">{row.confidence}%</span>
                            </div>
                          </td>

                          <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={e => removeSymbol(row.symbol, e)}
                              className="p-1 rounded text-gray-600 hover:text-[#ff4757] hover:bg-[#3d0a10] transition-colors"
                              title="Remove"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 border-t border-[#1f2937] flex items-center justify-between text-xs text-gray-500">
              <span>
                {filteredSorted.length} of {symbols.length} symbols
                {search && ` matching "${search}"`}
              </span>
              <span>Prices update every 30s</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
