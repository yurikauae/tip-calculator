import { useState } from "react";
import { AlertTriangle, TrendingUp, TrendingDown, Plus, X, DollarSign, Activity } from "lucide-react";

const INITIAL_OPEN = [
  { id: 1, symbol: "EUR/USD", direction: "BUY", lots: 1.0, entry: 1.08100, current: 1.08432, sl: 1.07800, tp: 1.09200, openTime: "2024-06-21 09:15" },
  { id: 2, symbol: "BTC/USD", direction: "BUY", lots: 0.1, entry: 65800, current: 67240, sl: 65000, tp: 70000, openTime: "2024-06-21 08:00" },
  { id: 3, symbol: "GBP/USD", direction: "SELL", lots: 0.5, entry: 1.27100, current: 1.26781, sl: 1.27500, tp: 1.25800, openTime: "2024-06-21 10:30" },
];

const INITIAL_CLOSED = [
  { id: 4, symbol: "NAS100", direction: "BUY", lots: 1.0, entry: 18100, exit: 18420, pnl: 320, openTime: "2024-06-20 14:00", closeTime: "2024-06-21 08:30" },
  { id: 5, symbol: "GOLD", direction: "SELL", lots: 0.5, entry: 2340, exit: 2318.5, pnl: 107.5, openTime: "2024-06-20 16:00", closeTime: "2024-06-21 09:00" },
  { id: 6, symbol: "USD/JPY", direction: "BUY", lots: 1.0, entry: 156.80, exit: 156.20, pnl: -60, openTime: "2024-06-19 11:00", closeTime: "2024-06-20 15:00" },
  { id: 7, symbol: "ETH/USD", direction: "BUY", lots: 0.2, entry: 3200, exit: 3512, pnl: 62.4, openTime: "2024-06-19 09:00", closeTime: "2024-06-20 20:00" },
];

const STARTING_BALANCE = 10000;

function calcPnl(trade) {
  const diff = trade.direction === "BUY"
    ? (trade.current - trade.entry)
    : (trade.entry - trade.current);
  return +(diff * trade.lots * 100).toFixed(2);
}

const DIRECTION_COLORS = {
  BUY: { bg: "bg-[#00d4aa]/20", text: "text-[#00d4aa]", border: "border-[#00d4aa]/40" },
  SELL: { bg: "bg-[#ff4757]/20", text: "text-[#ff4757]", border: "border-[#ff4757]/40" },
};

function DirectionBadge({ direction }) {
  const c = DIRECTION_COLORS[direction];
  return (
    <span className={`inline-flex font-bold rounded border px-2.5 py-0.5 text-xs ${c.bg} ${c.text} ${c.border}`}>
      {direction}
    </span>
  );
}

const DEFAULT_FORM = { symbol: "", direction: "BUY", lots: "1.0", entry: "", sl: "", tp: "" };

export default function PaperTrading() {
  const [openPositions, setOpenPositions] = useState(INITIAL_OPEN);
  const [closedTrades, setClosedTrades] = useState(INITIAL_CLOSED);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [formError, setFormError] = useState("");

  const openPnl = openPositions.reduce((acc, t) => acc + calcPnl(t), 0);
  const closedPnl = closedTrades.reduce((acc, t) => acc + t.pnl, 0);
  const totalPnl = openPnl + closedPnl;
  const balance = STARTING_BALANCE + closedPnl;
  const equity = balance + openPnl;

  const submitTrade = () => {
    if (!form.symbol || !form.entry || !form.sl || !form.tp) {
      setFormError("Please fill in all required fields.");
      return;
    }
    const newTrade = {
      id: Date.now(),
      symbol: form.symbol.toUpperCase(),
      direction: form.direction,
      lots: parseFloat(form.lots) || 1,
      entry: parseFloat(form.entry),
      current: parseFloat(form.entry),
      sl: parseFloat(form.sl),
      tp: parseFloat(form.tp),
      openTime: new Date().toISOString().slice(0, 16).replace("T", " "),
    };
    setOpenPositions((prev) => [newTrade, ...prev]);
    setForm(DEFAULT_FORM);
    setShowForm(false);
    setFormError("");
  };

  const closePosition = (id) => {
    const trade = openPositions.find((t) => t.id === id);
    if (!trade) return;
    const pnl = calcPnl(trade);
    setClosedTrades((prev) => [{
      id: trade.id,
      symbol: trade.symbol,
      direction: trade.direction,
      lots: trade.lots,
      entry: trade.entry,
      exit: trade.current,
      pnl,
      openTime: trade.openTime,
      closeTime: new Date().toISOString().slice(0, 16).replace("T", " "),
    }, ...prev]);
    setOpenPositions((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white p-6">
      {/* Risk Warning */}
      <div className="flex items-start gap-3 bg-[#ffa502]/10 border border-[#ffa502]/30 rounded-xl p-4 mb-6">
        <AlertTriangle size={18} className="text-[#ffa502] shrink-0 mt-0.5" />
        <div>
          <span className="text-[#ffa502] font-semibold text-sm">Paper Trading â€” Simulated Account</span>
          <p className="text-gray-400 text-xs mt-0.5">
            This is a simulated trading environment using virtual funds. Results do not reflect real market execution, slippage, or real capital risk. Not financial advice.
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Paper Trading</h1>
          <p className="text-gray-400 text-sm">Simulated account · Practice without risk</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#00d4aa] text-[#0a0e1a] font-semibold rounded-xl hover:bg-[#00d4aa]/90 transition-colors"
        >
          <Plus size={16} /> New Trade
        </button>
      </div>

      {/* Account Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <AccountCard label="Account Balance" value={`$${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} color="text-white" icon={DollarSign} />
        <AccountCard label="Equity" value={`$${equity.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} color={equity >= balance ? "text-[#00d4aa]" : "text-[#ff4757]"} icon={Activity} />
        <AccountCard label="Open P&L" value={`${openPnl >= 0 ? "+" : ""}$${openPnl.toFixed(2)}`} color={openPnl >= 0 ? "text-[#00d4aa]" : "text-[#ff4757]"} icon={openPnl >= 0 ? TrendingUp : TrendingDown} />
        <AccountCard label="Total P&L" value={`${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(2)}`} color={totalPnl >= 0 ? "text-[#00d4aa]" : "text-[#ff4757]"} icon={totalPnl >= 0 ? TrendingUp : TrendingDown} />
      </div>

      {/* New Trade Form */}
      {showForm && (
        <div className="bg-[#111827] rounded-xl border border-[#00d4aa]/20 p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
            <Plus size={18} className="text-[#00d4aa]" /> New Paper Trade
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Symbol *</label>
              <input
                type="text"
                value={form.symbol}
                onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value }))}
                placeholder="EUR/USD"
                className="w-full bg-[#0a0e1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#00d4aa]/50 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Direction</label>
              <div className="flex gap-2">
                {["BUY", "SELL"].map((d) => (
                  <button
                    key={d}
                    onClick={() => setForm((f) => ({ ...f, direction: d }))}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${
                      form.direction === d
                        ? d === "BUY" ? "bg-[#00d4aa] text-[#0a0e1a] border-[#00d4aa]" : "bg-[#ff4757] text-white border-[#ff4757]"
                        : "border-white/10 text-gray-400 hover:border-white/30"
                    }`}
                  >{d}</button>
                ))}
              </div>
            </div>
            <FormInput label="Lot Size" value={form.lots} onChange={(v) => setForm((f) => ({ ...f, lots: v }))} placeholder="1.0" />
            <FormInput label="Entry Price *" value={form.entry} onChange={(v) => setForm((f) => ({ ...f, entry: v }))} placeholder="1.08200" />
            <FormInput label="Stop Loss *" value={form.sl} onChange={(v) => setForm((f) => ({ ...f, sl: v }))} placeholder="1.07800" />
            <FormInput label="Take Profit *" value={form.tp} onChange={(v) => setForm((f) => ({ ...f, tp: v }))} placeholder="1.09200" />
          </div>
          {formError && <p className="text-[#ff4757] text-xs mb-3">{formError}</p>}
          <div className="flex gap-3">
            <button onClick={submitTrade} className="px-6 py-2 bg-[#00d4aa] text-[#0a0e1a] font-semibold text-sm rounded-lg hover:bg-[#00d4aa]/90 transition-colors">
              Open Trade
            </button>
            <button onClick={() => { setShowForm(false); setFormError(""); }} className="px-6 py-2 border border-white/10 text-gray-400 text-sm rounded-lg hover:border-white/30 hover:text-white transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Open Positions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Open Positions ({openPositions.length})</h2>
        {openPositions.length === 0 ? (
          <div className="bg-[#111827] rounded-xl border border-white/5 p-8 text-center text-gray-500">No open positions.</div>
        ) : (
          <div className="bg-[#111827] rounded-xl border border-white/5 overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-white/5 text-xs text-gray-400">
                  <th className="text-left px-5 py-3">Symbol</th>
                  <th className="text-left px-4 py-3">Dir</th>
                  <th className="text-right px-4 py-3">Lots</th>
                  <th className="text-right px-4 py-3">Entry</th>
                  <th className="text-right px-4 py-3">Current</th>
                  <th className="text-right px-4 py-3">SL</th>
                  <th className="text-right px-4 py-3">TP</th>
                  <th className="text-right px-4 py-3">P&L</th>
                  <th className="text-left px-4 py-3">Opened</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {openPositions.map((t) => {
                  const pnl = calcPnl(t);
                  return (
                    <tr key={t.id} className="hover:bg-white/2 transition-colors">
                      <td className="px-5 py-3 font-semibold text-white">{t.symbol}</td>
                      <td className="px-4 py-3"><DirectionBadge direction={t.direction} /></td>
                      <td className="px-4 py-3 text-right text-gray-300">{t.lots}</td>
                      <td className="px-4 py-3 text-right font-mono text-gray-300">{t.entry}</td>
                      <td className="px-4 py-3 text-right font-mono text-white">{t.current}</td>
                      <td className="px-4 py-3 text-right font-mono text-[#ff4757]">{t.sl}</td>
                      <td className="px-4 py-3 text-right font-mono text-[#00d4aa]">{t.tp}</td>
                      <td className={`px-4 py-3 text-right font-bold ${pnl >= 0 ? "text-[#00d4aa]" : "text-[#ff4757]"}`}>
                        {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{t.openTime}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => closePosition(t.id)} className="p-1.5 text-gray-500 hover:text-[#ff4757] hover:bg-[#ff4757]/10 rounded-lg transition-all" title="Close position">
                          <X size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Closed Trades */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Trade History ({closedTrades.length})</h2>
        <div className="bg-[#111827] rounded-xl border border-white/5 overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs text-gray-400">
                <th className="text-left px-5 py-3">Symbol</th>
                <th className="text-left px-4 py-3">Dir</th>
                <th className="text-right px-4 py-3">Lots</th>
                <th className="text-right px-4 py-3">Entry</th>
                <th className="text-right px-4 py-3">Exit</th>
                <th className="text-right px-4 py-3">P&L</th>
                <th className="text-left px-4 py-3">Closed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {closedTrades.map((t) => (
                <tr key={t.id} className="hover:bg-white/2 transition-colors">
                  <td className="px-5 py-3 font-semibold text-white">{t.symbol}</td>
                  <td className="px-4 py-3"><DirectionBadge direction={t.direction} /></td>
                  <td className="px-4 py-3 text-right text-gray-300">{t.lots}</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-300">{t.entry}</td>
                  <td className="px-4 py-3 text-right font-mono text-white">{t.exit}</td>
                  <td className={`px-4 py-3 text-right font-bold ${t.pnl >= 0 ? "text-[#00d4aa]" : "text-[#ff4757]"}`}>
                    {t.pnl >= 0 ? "+" : ""}${t.pnl.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{t.closeTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AccountCard({ label, value, color, icon: Icon }) {
  return (
    <div className="bg-[#111827] rounded-xl p-5 border border-white/5">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className="text-gray-400" />
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

function FormInput({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="text-xs text-gray-400 mb-1 block">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#0a0e1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#00d4aa]/50 outline-none placeholder-gray-600"
      />
    </div>
  );
}
