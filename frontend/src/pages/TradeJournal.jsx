import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Plus, X, Download, ChevronDown, ChevronUp, Trash2, Filter, BookOpen, TrendingUp, TrendingDown, BarChart2
} from 'lucide-react';

const STORAGE_KEY = 'msi_journal';

const MOODS = [
  { value: 'fearful', emoji: '😰', label: 'Fearful' },
  { value: 'neutral', emoji: '😐', label: 'Neutral' },
  { value: 'confident', emoji: '😊', label: 'Confident' },
  { value: 'greedy', emoji: '🤑', label: 'Greedy' },
  { value: 'revenge', emoji: '😤', label: 'Revenge' },
];

const SAMPLE_ENTRIES = [
  {
    id: '1',
    date: '2026-06-10',
    symbol: 'BTC/USD',
    direction: 'BUY',
    entryPrice: '65000',
    exitPrice: '68500',
    outcome: 'WIN',
    pnlPercent: '5.38',
    mood: 'confident',
    setupNotes: 'Strong breakout above weekly resistance with volume confirmation. RSI not yet overbought.',
    lessonLearned: 'Patience paid off waiting for the weekly close above resistance before entering.',
  },
  {
    id: '2',
    date: '2026-06-14',
    symbol: 'ETH/USD',
    direction: 'SELL',
    entryPrice: '3200',
    exitPrice: '3480',
    outcome: 'LOSS',
    pnlPercent: '-8.75',
    mood: 'revenge',
    setupNotes: 'Tried to short the bounce after a big down move. Market was still in uptrend.',
    lessonLearned: 'Never trade against the primary trend when emotional after a previous loss. Revenge trading is always a mistake.',
  },
  {
    id: '3',
    date: '2026-06-18',
    symbol: 'SOL/USD',
    direction: 'BUY',
    entryPrice: '145',
    exitPrice: '145',
    outcome: 'BREAKEVEN',
    pnlPercent: '0.00',
    mood: 'neutral',
    setupNotes: 'Range bound consolidation entry. Broke even after stop was moved to entry.',
    lessonLearned: 'Moving stop to breakeven too early can prevent the trade from breathing. Allow more room when consolidation is evident.',
  },
];

const defaultForm = {
  date: new Date().toISOString().slice(0, 10),
  symbol: '',
  direction: 'BUY',
  entryPrice: '',
  exitPrice: '',
  outcome: '',
  pnlPercent: '',
  mood: 'neutral',
  setupNotes: '',
  lessonLearned: '',
};

function getMoodEmoji(value) {
  return MOODS.find(m => m.value === value)?.emoji || '';
}
function getMoodLabel(value) {
  return MOODS.find(m => m.value === value)?.label || value;
}

function OutcomeBadge({ outcome }) {
  const styles = {
    WIN: 'bg-[#00d4aa]/20 text-[#00d4aa] border border-[#00d4aa]/40',
    LOSS: 'bg-[#ff4757]/20 text-[#ff4757] border border-[#ff4757]/40',
    BREAKEVEN: 'bg-[#ffa502]/20 text-[#ffa502] border border-[#ffa502]/40',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${styles[outcome] || ''}`}>
      {outcome}
    </span>
  );
}

function DirectionBadge({ direction }) {
  const style = direction === 'BUY'
    ? 'bg-[#00d4aa]/10 text-[#00d4aa] border border-[#00d4aa]/30'
    : 'bg-[#ff4757]/10 text-[#ff4757] border border-[#ff4757]/30';
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-bold ${style}`}>
      {direction}
    </span>
  );
}

export default function TradeJournal() {
  const [entries, setEntries] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return SAMPLE_ENTRIES;
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [filterOutcome, setFilterOutcome] = useState('All');
  const [filterSymbol, setFilterSymbol] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const handleFormChange = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  }, [errors]);

  const validate = () => {
    const newErrors = {};
    if (!form.symbol.trim()) newErrors.symbol = 'Symbol is required';
    if (!form.outcome) newErrors.outcome = 'Outcome is required';
    if (form.lessonLearned.trim().length < 10) newErrors.lessonLearned = 'Lesson learned must be at least 10 characters';
    return newErrors;
  };

  const handleSubmit = () => {
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    const entry = {
      ...form,
      id: Date.now().toString(),
      symbol: form.symbol.toUpperCase().trim(),
    };
    setEntries(prev => [entry, ...prev]);
    setForm(defaultForm);
    setErrors({});
    setShowForm(false);
  };

  const handleDelete = (id) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    setConfirmDeleteId(null);
    if (expandedId === id) setExpandedId(null);
  };

  const filtered = useMemo(() => {
    return entries.filter(e => {
      if (filterOutcome !== 'All' && e.outcome !== filterOutcome) return false;
      if (filterSymbol && !e.symbol.toLowerCase().includes(filterSymbol.toLowerCase())) return false;
      if (filterDateFrom && e.date < filterDateFrom) return false;
      if (filterDateTo && e.date > filterDateTo) return false;
      return true;
    });
  }, [entries, filterOutcome, filterSymbol, filterDateFrom, filterDateTo]);

  const stats = useMemo(() => {
    const total = entries.length;
    const wins = entries.filter(e => e.outcome === 'WIN');
    const losses = entries.filter(e => e.outcome === 'LOSS');
    const winRate = total > 0 ? ((wins.length / total) * 100).toFixed(1) : '0.0';
    const avgWin = wins.length > 0
      ? (wins.reduce((s, e) => s + parseFloat(e.pnlPercent || 0), 0) / wins.length).toFixed(2)
      : '0.00';
    const avgLoss = losses.length > 0
      ? (losses.reduce((s, e) => s + parseFloat(e.pnlPercent || 0), 0) / losses.length).toFixed(2)
      : '0.00';
    const allPnl = entries.map(e => ({ pnl: parseFloat(e.pnlPercent || 0), symbol: e.symbol, date: e.date }));
    const best = allPnl.length > 0 ? allPnl.reduce((a, b) => a.pnl > b.pnl ? a : b) : null;
    const worst = allPnl.length > 0 ? allPnl.reduce((a, b) => a.pnl < b.pnl ? a : b) : null;
    return { total, winRate, avgWin, avgLoss, best, worst };
  }, [entries]);

  const moodAnalysis = useMemo(() => {
    return MOODS.map(mood => {
      const moodEntries = entries.filter(e => e.mood === mood.value);
      const wins = moodEntries.filter(e => e.outcome === 'WIN').length;
      const winRate = moodEntries.length > 0 ? ((wins / moodEntries.length) * 100).toFixed(0) : null;
      return { ...mood, count: moodEntries.length, winRate };
    });
  }, [entries]);

  const exportCSV = () => {
    const headers = ['Date', 'Symbol', 'Direction', 'Entry Price', 'Exit Price', 'Outcome', 'P&L %', 'Mood', 'Setup Notes', 'Lesson Learned'];
    const rows = entries.map(e => [
      e.date, e.symbol, e.direction, e.entryPrice, e.exitPrice, e.outcome, e.pnlPercent,
      getMoodLabel(e.mood), `"${(e.setupNotes || '').replace(/"/g, '""')}"`, `"${(e.lessonLearned || '').replace(/"/g, '""')}"`
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trade_journal.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <BookOpen className="text-[#00d4aa]" size={28} />
            <div>
              <h1 className="text-2xl font-bold text-white">Trade Journal</h1>
              <p className="text-gray-400 text-sm">Track, reflect, and improve your trading</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#1f2937] text-gray-300 hover:text-white hover:border-[#00d4aa]/50 transition-colors text-sm"
            >
              <Download size={15} />
              Export CSV
            </button>
            <button
              onClick={() => { setShowForm(true); setForm(defaultForm); setErrors({}); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00d4aa] text-[#0a0e1a] font-semibold hover:bg-[#00d4aa]/90 transition-colors text-sm"
            >
              <Plus size={16} />
              New Entry
            </button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {[
            { label: 'Total Trades', value: stats.total, color: 'text-white' },
            { label: 'Win Rate', value: `${stats.winRate}%`, color: 'text-[#00d4aa]' },
            { label: 'Avg Win', value: `${stats.avgWin}%`, color: 'text-[#00d4aa]' },
            { label: 'Avg Loss', value: `${stats.avgLoss}%`, color: 'text-[#ff4757]' },
            { label: 'Best Trade', value: stats.best ? `${stats.best.pnl >= 0 ? '+' : ''}${stats.best.pnl.toFixed(2)}%` : 'N/A', color: 'text-[#00d4aa]' },
            { label: 'Worst Trade', value: stats.worst ? `${stats.worst.pnl >= 0 ? '+' : ''}${stats.worst.pnl.toFixed(2)}%` : 'N/A', color: 'text-[#ff4757]' },
          ].map((s) => (
            <div key={s.label} className="bg-[#111827] border border-[#1f2937] rounded-xl p-4 text-center">
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-gray-400 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Mood Analysis */}
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={16} className="text-[#00d4aa]" />
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Mood Analysis — Win Rate by Mood</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1f2937]">
                  <th className="text-left text-gray-400 font-medium pb-2 pr-4">Mood</th>
                  <th className="text-center text-gray-400 font-medium pb-2 px-4">Trades</th>
                  <th className="text-center text-gray-400 font-medium pb-2 px-4">Win Rate</th>
                  <th className="text-left text-gray-400 font-medium pb-2 pl-4">Bar</th>
                </tr>
              </thead>
              <tbody>
                {moodAnalysis.map(m => (
                  <tr key={m.value} className="border-b border-[#1f2937]/50 last:border-0">
                    <td className="py-2 pr-4">
                      <span className="mr-2">{m.emoji}</span>
                      <span className="text-gray-300">{m.label}</span>
                    </td>
                    <td className="py-2 px-4 text-center text-gray-400">{m.count}</td>
                    <td className="py-2 px-4 text-center font-semibold" style={{ color: m.winRate === null ? '#6b7280' : parseInt(m.winRate) >= 50 ? '#00d4aa' : '#ff4757' }}>
                      {m.winRate === null ? '—' : `${m.winRate}%`}
                    </td>
                    <td className="py-2 pl-4 w-40">
                      {m.winRate !== null && (
                        <div className="w-full bg-[#1f2937] rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: `${m.winRate}%`,
                              backgroundColor: parseInt(m.winRate) >= 50 ? '#00d4aa' : '#ff4757'
                            }}
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={14} className="text-gray-400" />
            <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">Filters</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Outcome</label>
              <select
                value={filterOutcome}
                onChange={e => setFilterOutcome(e.target.value)}
                className="w-full bg-[#0a0e1a] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00d4aa]/50"
              >
                {['All', 'WIN', 'LOSS', 'BREAKEVEN'].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Symbol</label>
              <input
                type="text"
                value={filterSymbol}
                onChange={e => setFilterSymbol(e.target.value)}
                placeholder="e.g. BTC"
                className="w-full bg-[#0a0e1a] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00d4aa]/50"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Date From</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={e => setFilterDateFrom(e.target.value)}
                className="w-full bg-[#0a0e1a] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00d4aa]/50"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Date To</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={e => setFilterDateTo(e.target.value)}
                className="w-full bg-[#0a0e1a] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00d4aa]/50"
              />
            </div>
          </div>
        </div>

        {/* New Entry Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-[#111827] border border-[#1f2937] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-[#1f2937]">
                <h2 className="text-lg font-bold text-white">New Journal Entry</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Date</label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={e => handleFormChange('date', e.target.value)}
                      className="w-full bg-[#0a0e1a] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00d4aa]/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Symbol <span className="text-[#ff4757]">*</span></label>
                    <input
                      type="text"
                      value={form.symbol}
                      onChange={e => handleFormChange('symbol', e.target.value)}
                      placeholder="e.g. BTC/USD"
                      className={`w-full bg-[#0a0e1a] border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00d4aa]/50 ${errors.symbol ? 'border-[#ff4757]' : 'border-[#1f2937]'}`}
                    />
                    {errors.symbol && <p className="text-[#ff4757] text-xs mt-1">{errors.symbol}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Direction</label>
                    <div className="flex gap-2">
                      {['BUY', 'SELL'].map(d => (
                        <button
                          key={d}
                          onClick={() => handleFormChange('direction', d)}
                          className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                            form.direction === d
                              ? d === 'BUY' ? 'bg-[#00d4aa]/20 border-[#00d4aa] text-[#00d4aa]' : 'bg-[#ff4757]/20 border-[#ff4757] text-[#ff4757]'
                              : 'bg-transparent border-[#1f2937] text-gray-400 hover:border-gray-500'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Outcome <span className="text-[#ff4757]">*</span></label>
                    <div className="flex gap-2">
                      {['WIN', 'LOSS', 'BREAKEVEN'].map(o => (
                        <button
                          key={o}
                          onClick={() => handleFormChange('outcome', o)}
                          className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                            form.outcome === o
                              ? o === 'WIN' ? 'bg-[#00d4aa]/20 border-[#00d4aa] text-[#00d4aa]'
                                : o === 'LOSS' ? 'bg-[#ff4757]/20 border-[#ff4757] text-[#ff4757]'
                                : 'bg-[#ffa502]/20 border-[#ffa502] text-[#ffa502]'
                              : 'bg-transparent border-[#1f2937] text-gray-400 hover:border-gray-500'
                          }`}
                        >
                          {o}
                        </button>
                      ))}
                    </div>
                    {errors.outcome && <p className="text-[#ff4757] text-xs mt-1">{errors.outcome}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Entry Price</label>
                    <input
                      type="number"
                      value={form.entryPrice}
                      onChange={e => handleFormChange('entryPrice', e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-[#0a0e1a] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00d4aa]/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Exit Price</label>
                    <input
                      type="number"
                      value={form.exitPrice}
                      onChange={e => handleFormChange('exitPrice', e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-[#0a0e1a] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00d4aa]/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">P&L %</label>
                    <input
                      type="number"
                      value={form.pnlPercent}
                      onChange={e => handleFormChange('pnlPercent', e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-[#0a0e1a] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00d4aa]/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Mood</label>
                  <div className="flex gap-2 flex-wrap">
                    {MOODS.map(m => (
                      <button
                        key={m.value}
                        onClick={() => handleFormChange('mood', m.value)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-colors ${
                          form.mood === m.value
                            ? 'bg-[#00d4aa]/10 border-[#00d4aa]/50 text-white'
                            : 'bg-[#0a0e1a] border-[#1f2937] text-gray-400 hover:border-gray-500'
                        }`}
                      >
                        <span>{m.emoji}</span>
                        <span className="text-xs">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Setup Notes</label>
                  <textarea
                    value={form.setupNotes}
                    onChange={e => handleFormChange('setupNotes', e.target.value)}
                    rows={3}
                    placeholder="Describe your trade setup, confluence factors..."
                    className="w-full bg-[#0a0e1a] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00d4aa]/50 resize-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs text-gray-400">Lesson Learned <span className="text-[#ff4757]">*</span></label>
                    <span className={`text-xs ${form.lessonLearned.length < 10 ? 'text-[#ff4757]' : 'text-[#00d4aa]'}`}>
                      {form.lessonLearned.length} chars {form.lessonLearned.length < 10 ? `(${10 - form.lessonLearned.length} more needed)` : ''}
                    </span>
                  </div>
                  <textarea
                    value={form.lessonLearned}
                    onChange={e => handleFormChange('lessonLearned', e.target.value)}
                    rows={3}
                    placeholder="What did you learn from this trade? (min. 10 characters)"
                    className={`w-full bg-[#0a0e1a] border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00d4aa]/50 resize-none ${errors.lessonLearned ? 'border-[#ff4757]' : 'border-[#1f2937]'}`}
                  />
                  {errors.lessonLearned && <p className="text-[#ff4757] text-xs mt-1">{errors.lessonLearned}</p>}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-2.5 rounded-lg border border-[#1f2937] text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="flex-1 py-2.5 rounded-lg bg-[#00d4aa] text-[#0a0e1a] font-semibold hover:bg-[#00d4aa]/90 transition-colors text-sm"
                  >
                    Save Entry
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Entries List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Journal Entries <span className="text-gray-600">({filtered.length})</span>
            </h2>
          </div>

          {filtered.length === 0 ? (
            <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-16 text-center">
              <BookOpen size={48} className="text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">Start your trading journal</h3>
              <p className="text-gray-600 text-sm mb-6">Document your trades, learn from your mistakes, and track your growth as a trader.</p>
              <button
                onClick={() => { setShowForm(true); setForm(defaultForm); setErrors({}); }}
                className="px-6 py-3 rounded-lg bg-[#00d4aa] text-[#0a0e1a] font-semibold hover:bg-[#00d4aa]/90 transition-colors"
              >
                Add Your First Entry
              </button>
            </div>
          ) : (
            filtered.map(entry => {
              const isExpanded = expandedId === entry.id;
              const pnl = parseFloat(entry.pnlPercent || 0);
              const pnlColor = pnl > 0 ? '#00d4aa' : pnl < 0 ? '#ff4757' : '#ffa502';

              return (
                <div key={entry.id} className="bg-[#111827] border border-[#1f2937] rounded-xl overflow-hidden hover:border-[#1f2937]/80 transition-colors">
                  {/* Entry Header Row */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  >
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-gray-500 text-xs">{entry.date}</span>
                      <span className="text-white font-bold text-sm">{entry.symbol}</span>
                      <DirectionBadge direction={entry.direction} />
                      <OutcomeBadge outcome={entry.outcome} />
                      <span className="font-semibold text-sm" style={{ color: pnlColor }}>
                        {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}%
                      </span>
                      <span className="text-lg" title={getMoodLabel(entry.mood)}>{getMoodEmoji(entry.mood)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {confirmDeleteId === entry.id ? (
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <span className="text-xs text-gray-400">Delete?</span>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="px-2 py-1 text-xs bg-[#ff4757]/20 text-[#ff4757] border border-[#ff4757]/40 rounded hover:bg-[#ff4757]/30"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 text-xs bg-[#1f2937] text-gray-400 border border-[#1f2937] rounded hover:text-white"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={e => { e.stopPropagation(); setConfirmDeleteId(entry.id); }}
                          className="p-1.5 text-gray-600 hover:text-[#ff4757] transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      {isExpanded ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                    </div>
                  </div>

                  {/* Truncated preview when collapsed */}
                  {!isExpanded && (
                    <div className="px-4 pb-4 border-t border-[#1f2937]/50 pt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {entry.setupNotes && (
                        <div>
                          <span className="text-xs text-gray-500 uppercase tracking-wider">Setup</span>
                          <p className="text-gray-400 text-xs mt-1 line-clamp-2 leading-relaxed">{entry.setupNotes}</p>
                        </div>
                      )}
                      {entry.lessonLearned && (
                        <div>
                          <span className="text-xs text-gray-500 uppercase tracking-wider">Lesson</span>
                          <p className="text-gray-400 text-xs mt-1 line-clamp-2 leading-relaxed">{entry.lessonLearned}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Expanded full details */}
                  {isExpanded && (
                    <div className="border-t border-[#1f2937] p-5 space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-[#0a0e1a] rounded-lg p-3">
                          <div className="text-xs text-gray-500 mb-1">Entry Price</div>
                          <div className="text-white font-semibold">{entry.entryPrice || '—'}</div>
                        </div>
                        <div className="bg-[#0a0e1a] rounded-lg p-3">
                          <div className="text-xs text-gray-500 mb-1">Exit Price</div>
                          <div className="text-white font-semibold">{entry.exitPrice || '—'}</div>
                        </div>
                        <div className="bg-[#0a0e1a] rounded-lg p-3">
                          <div className="text-xs text-gray-500 mb-1">P&L %</div>
                          <div className="font-semibold" style={{ color: pnlColor }}>
                            {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}%
                          </div>
                        </div>
                        <div className="bg-[#0a0e1a] rounded-lg p-3">
                          <div className="text-xs text-gray-500 mb-1">Mood</div>
                          <div className="text-white font-semibold">
                            {getMoodEmoji(entry.mood)} {getMoodLabel(entry.mood)}
                          </div>
                        </div>
                      </div>

                      {entry.setupNotes && (
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <TrendingUp size={11} /> Setup Notes
                          </div>
                          <p className="text-gray-300 text-sm leading-relaxed bg-[#0a0e1a] rounded-lg p-3">{entry.setupNotes}</p>
                        </div>
                      )}

                      {entry.lessonLearned && (
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <TrendingDown size={11} /> Lesson Learned
                          </div>
                          <p className="text-gray-300 text-sm leading-relaxed bg-[#0a0e1a] rounded-lg p-3">{entry.lessonLearned}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
