import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Bell,
  Plus,
  Trash2,
  RotateCcw,
  Download,
  TrendingUp,
  Activity,
  CheckCircle,
  XCircle,
  PauseCircle,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';

const STORAGE_KEY = 'msi_alerts';
const HISTORY_KEY = 'msi_alerts_history';

const CONDITIONS = ['Above', 'Below', 'Crosses', 'Between'];

const generateId = () => `alert_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const defaultForm = {
  symbol: '',
  condition: 'Above',
  price: '',
  price2: '',
  label: '',
  active: true,
};

const loadFromStorage = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

// Simulated last prices per symbol (module-level so interval keeps state)
const lastPrices = {};

const simulatePrice = (symbol, referencePrice) => {
  const base = lastPrices[symbol] !== undefined ? lastPrices[symbol] : referencePrice;
  const change = base * (Math.random() * 0.02 - 0.01); // ±1%
  const next = parseFloat((base + change).toFixed(6));
  lastPrices[symbol] = next;
  return next;
};

const conditionMet = (condition, currentPrice, price, price2) => {
  switch (condition) {
    case 'Above':
      return currentPrice > price;
    case 'Below':
      return currentPrice < price;
    case 'Crosses':
      return Math.abs(currentPrice - price) / price < 0.005;
    case 'Between':
      return price2 !== null && currentPrice >= price && currentPrice <= price2;
    default:
      return false;
  }
};

const formatTimestamp = (ts) => new Date(ts).toLocaleString();

const StatusBadge = ({ status }) => {
  const styles = {
    Active: 'bg-[#00d4aa]/10 text-[#00d4aa] border border-[#00d4aa]/30',
    Triggered: 'bg-[#ff4757]/10 text-[#ff4757] border border-[#ff4757]/30',
    Paused: 'bg-[#ffa502]/10 text-[#ffa502] border border-[#ffa502]/30',
  };
  const icons = {
    Active: <CheckCircle size={11} />,
    Triggered: <AlertTriangle size={11} />,
    Paused: <PauseCircle size={11} />,
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}
    >
      {icons[status]}
      {status}
    </span>
  );
};

export default function Alerts() {
  const [alerts, setAlerts] = useState(() => loadFromStorage(STORAGE_KEY, []));
  const [history, setHistory] = useState(() => loadFromStorage(HISTORY_KEY, []));
  const [form, setForm] = useState(defaultForm);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState('');

  // Persist to localStorage
  useEffect(() => { saveToStorage(STORAGE_KEY, alerts); }, [alerts]);
  useEffect(() => { saveToStorage(HISTORY_KEY, history); }, [history]);

  // Price-checking interval — every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setAlerts((prev) => {
        const next = prev.map((alert) => {
          if (!alert.active || alert.triggered) return alert;
          const ref = parseFloat(alert.price);
          if (isNaN(ref)) return alert;
          const current = simulatePrice(alert.symbol, ref);
          const price2Val =
            alert.condition === 'Between' ? parseFloat(alert.price2) : null;
          if (conditionMet(alert.condition, current, ref, price2Val)) {
            const entry = {
              id: generateId(),
              alertId: alert.id,
              symbol: alert.symbol,
              condition: alert.condition,
              price: alert.price,
              price2: alert.price2 || null,
              label: alert.label,
              triggerPrice: current.toFixed(6),
              timestamp: Date.now(),
            };
            // Use functional update for history inside setAlerts callback
            setHistory((h) => [entry, ...h]);
            return { ...alert, triggered: true, active: false, lastPrice: current };
          }
          return { ...alert, lastPrice: current };
        });
        return next;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatus = (alert) => {
    if (alert.triggered) return 'Triggered';
    if (!alert.active) return 'Paused';
    return 'Active';
  };

  const handleFormChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setFormError('');
  };

  const handleAddAlert = () => {
    if (!form.symbol.trim()) {
      setFormError('Symbol is required.');
      return;
    }
    if (!form.price || isNaN(parseFloat(form.price))) {
      setFormError('A valid price is required.');
      return;
    }
    if (
      form.condition === 'Between' &&
      (!form.price2 || isNaN(parseFloat(form.price2)))
    ) {
      setFormError('A second price is required for the Between condition.');
      return;
    }
    const newAlert = {
      id: generateId(),
      symbol: form.symbol.trim().toUpperCase(),
      condition: form.condition,
      price: form.price,
      price2: form.condition === 'Between' ? form.price2 : '',
      label: form.label.trim(),
      active: form.active,
      triggered: false,
      lastPrice: null,
      createdAt: Date.now(),
    };
    setAlerts((prev) => [newAlert, ...prev]);
    setForm(defaultForm);
    setShowForm(false);
    setFormError('');
  };

  const handleToggle = useCallback((id) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id && !a.triggered ? { ...a, active: !a.active } : a
      )
    );
  }, []);

  const handleDelete = useCallback((id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const handleReset = useCallback((id) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, triggered: false, active: true, lastPrice: null }
          : a
      )
    );
  }, []);

  const stats = useMemo(() => {
    const total = alerts.length;
    const active = alerts.filter((a) => a.active && !a.triggered).length;
    const triggered = alerts.filter((a) => a.triggered).length;
    return { total, active, triggered };
  }, [alerts]);

  const exportCSV = () => {
    if (!history.length) return;
    const headers = [
      'Symbol',
      'Condition',
      'Target Price',
      'Price 2',
      'Label',
      'Trigger Price',
      'Timestamp',
    ];
    const rows = history.map((h) => [
      h.symbol,
      h.condition,
      h.price,
      h.price2 || '',
      h.label || '',
      h.triggerPrice,
      formatTimestamp(h.timestamp),
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'alert_history.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#00d4aa]/10 border border-[#00d4aa]/20">
            <Bell size={22} className="text-[#00d4aa]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Price Alerts</h1>
            <p className="text-sm text-gray-400">
              Monitor price conditions in real time
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setShowForm((v) => !v);
            setFormError('');
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00d4aa] text-[#0a0e1a] font-semibold text-sm hover:bg-[#00b894] transition-colors"
        >
          <Plus size={16} />
          New Alert
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: 'Total Alerts',
            value: stats.total,
            icon: <Bell size={18} />,
            color: 'text-blue-400',
            bg: 'bg-blue-400/10',
          },
          {
            label: 'Active',
            value: stats.active,
            icon: <Activity size={18} />,
            color: 'text-[#00d4aa]',
            bg: 'bg-[#00d4aa]/10',
          },
          {
            label: 'Triggered',
            value: stats.triggered,
            icon: <AlertTriangle size={18} />,
            color: 'text-[#ff4757]',
            bg: 'bg-[#ff4757]/10',
          },
          {
            label: 'Accuracy',
            value: '72%',
            icon: <TrendingUp size={18} />,
            color: 'text-[#ffa502]',
            bg: 'bg-[#ffa502]/10',
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-[#111827] border border-[#1f2937] rounded-xl p-4 flex items-center gap-4"
          >
            <div className={`p-2 rounded-lg ${s.bg} ${s.color}`}>
              {s.icon}
            </div>
            <div>
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Create Alert Form */}
      {showForm && (
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-5 text-white">
            Create New Alert
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Symbol */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Symbol
              </label>
              <input
                type="text"
                value={form.symbol}
                onChange={(e) => handleFormChange('symbol', e.target.value)}
                placeholder="e.g. BTCUSDT"
                className="w-full bg-[#1a2234] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4aa] transition-colors"
              />
            </div>

            {/* Condition */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Condition
              </label>
              <div className="relative">
                <select
                  value={form.condition}
                  onChange={(e) =>
                    handleFormChange('condition', e.target.value)
                  }
                  className="w-full appearance-none bg-[#1a2234] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00d4aa] transition-colors pr-8"
                >
                  {CONDITIONS.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                {form.condition === 'Between' ? 'Lower Price' : 'Price'}
              </label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => handleFormChange('price', e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#1a2234] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4aa] transition-colors"
              />
            </div>

            {/* Second price for Between */}
            {form.condition === 'Between' && (
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Upper Price
                </label>
                <input
                  type="number"
                  value={form.price2}
                  onChange={(e) =>
                    handleFormChange('price2', e.target.value)
                  }
                  placeholder="0.00"
                  className="w-full bg-[#1a2234] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4aa] transition-colors"
                />
              </div>
            )}

            {/* Notification Label */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Notification Label
              </label>
              <input
                type="text"
                value={form.label}
                onChange={(e) => handleFormChange('label', e.target.value)}
                placeholder="Optional label"
                className="w-full bg-[#1a2234] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4aa] transition-colors"
              />
            </div>

            {/* Active toggle */}
            <div className="flex items-end pb-0.5">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() =>
                    handleFormChange('active', !form.active)
                  }
                  className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                    form.active ? 'bg-[#00d4aa]' : 'bg-[#1f2937]'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      form.active ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </div>
                <span className="text-sm text-gray-300">
                  {form.active ? 'Active on create' : 'Paused on create'}
                </span>
              </label>
            </div>
          </div>

          {formError && (
            <p className="mt-3 text-sm text-[#ff4757] flex items-center gap-1">
              <XCircle size={14} />
              {formError}
            </p>
          )}

          <div className="flex gap-3 mt-5">
            <button
              onClick={handleAddAlert}
              className="px-5 py-2 rounded-lg bg-[#00d4aa] text-[#0a0e1a] font-semibold text-sm hover:bg-[#00b894] transition-colors"
            >
              Create Alert
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setFormError('');
                setForm(defaultForm);
              }}
              className="px-5 py-2 rounded-lg border border-[#1f2937] text-gray-300 text-sm hover:border-gray-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Alerts List */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 text-white">Your Alerts</h2>
        {alerts.length === 0 ? (
          <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-12 flex flex-col items-center justify-center text-center">
            <div className="p-4 rounded-full bg-[#1a2234] mb-4">
              <Bell size={32} className="text-gray-500" />
            </div>
            <p className="text-gray-300 font-medium mb-1">No alerts yet</p>
            <p className="text-sm text-gray-500">
              Click "New Alert" to set up your first price alert.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const status = getStatus(alert);
              return (
                <div
                  key={alert.id}
                  className="bg-[#111827] border border-[#1f2937] rounded-xl px-5 py-4 flex flex-col md:flex-row md:items-center gap-4"
                >
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-bold text-white text-base">
                        {alert.symbol}
                      </span>
                      <StatusBadge status={status} />
                      {alert.label && (
                        <span className="text-xs text-gray-400 bg-[#1a2234] px-2 py-0.5 rounded-full border border-[#1f2937]">
                          {alert.label}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2 flex-wrap text-sm text-gray-400">
                      <span className="text-gray-500">{alert.condition}</span>
                      <span className="text-[#00d4aa] font-mono">
                        ${parseFloat(alert.price).toLocaleString()}
                      </span>
                      {alert.condition === 'Between' && alert.price2 && (
                        <>
                          <span className="text-gray-500">to</span>
                          <span className="text-[#00d4aa] font-mono">
                            ${parseFloat(alert.price2).toLocaleString()}
                          </span>
                        </>
                      )}
                      {alert.lastPrice !== null && (
                        <span className="text-gray-600 text-xs ml-1">
                          sim:{' '}
                          <span className="text-gray-400">
                            ${Number(alert.lastPrice).toLocaleString()}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Toggle active (only when not triggered) */}
                    {!alert.triggered && (
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <div
                          onClick={() => handleToggle(alert.id)}
                          className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${
                            alert.active ? 'bg-[#00d4aa]' : 'bg-[#1f2937]'
                          }`}
                        >
                          <div
                            className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                              alert.active
                                ? 'translate-x-5'
                                : 'translate-x-0.5'
                            }`}
                          />
                        </div>
                        <span className="text-xs text-gray-400">
                          {alert.active ? 'On' : 'Off'}
                        </span>
                      </label>
                    )}

                    {/* Reset triggered */}
                    {alert.triggered && (
                      <button
                        onClick={() => handleReset(alert.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#ffa502]/10 border border-[#ffa502]/30 text-[#ffa502] text-xs font-medium hover:bg-[#ffa502]/20 transition-colors"
                      >
                        <RotateCcw size={13} />
                        Reset
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(alert.id)}
                      className="p-2 rounded-lg text-gray-500 hover:text-[#ff4757] hover:bg-[#ff4757]/10 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Triggered History */}
      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-lg font-semibold text-white">
            Triggered History
          </h2>
          {history.length > 0 && (
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#1f2937] text-gray-300 text-xs font-medium hover:border-[#00d4aa] hover:text-[#00d4aa] transition-colors"
            >
              <Download size={13} />
              Export CSV
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-8 flex flex-col items-center text-center">
            <Activity size={28} className="text-gray-600 mb-3" />
            <p className="text-gray-400 text-sm">
              No alerts have been triggered yet.
            </p>
          </div>
        ) : (
          <div className="bg-[#111827] border border-[#1f2937] rounded-xl overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-[#1f2937]">
                  {[
                    'Symbol',
                    'Condition',
                    'Target',
                    'Trigger Price',
                    'Label',
                    'Time',
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((entry, i) => (
                  <tr
                    key={entry.id}
                    className={`border-b border-[#1f2937] last:border-0 hover:bg-[#1a2234] transition-colors ${
                      i % 2 === 0 ? '' : 'bg-[#0a0e1a]/20'
                    }`}
                  >
                    <td className="px-4 py-3 font-bold text-white">
                      {entry.symbol}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {entry.condition}
                    </td>
                    <td className="px-4 py-3 font-mono text-[#00d4aa]">
                      ${parseFloat(entry.price).toLocaleString()}
                      {entry.price2 && (
                        <span className="text-gray-400">
                          {' '}
                          – ${parseFloat(entry.price2).toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-[#ff4757]">
                      ${Number(entry.triggerPrice).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {entry.label || (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {formatTimestamp(entry.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
