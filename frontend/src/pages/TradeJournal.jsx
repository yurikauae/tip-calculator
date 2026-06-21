import { useState, useMemo } from "react";
import { BookOpen, Plus, Filter, TrendingUp, TrendingDown, Award, BarChart2, ChevronDown, ChevronUp } from "lucide-react";

const INITIAL_ENTRIES = [
  {
    id: 1, date: "2024-06-20", symbol: "EUR/USD", direction: "BUY", entry: "1.08100", exit: "1.08920",
    outcome: "WIN", pnl: 82, rr: "1:2.6",
    notes: "Clean breakout above 1.0820 resistance. Entered on retest. Volume confirmed the move.",
    emotions: "Confident, patient", lesson: "Waiting for retest confirmation significantly improved entry quality.",
  },
  {
    id: 2, date: "2024-06-20", symbol: "GBP/USD", direction: "SELL", entry: "1.27200", exit: "1.26900",
    outcome: "WIN", pnl: 30, rr: "1:1.5",
    notes: "Double top pattern. Entered on second rejection. Took partial profits early.",
    emotions: "Slightly anxious, took profits too early", lesson: "Trust the setup. Taking profits at 50% TP left money on the table.",
  },
  {
    id: 3, date: "2024-06-19", symbol: "USD/JPY", direction: "BUY", entry: "156.80", exit: "156.20",
    outcome: "LOSS", pnl: -60, rr: "1:0.5",
    notes: "Entered against the trend. BoJ intervention risk was present and I ignored it.",
    emotions: "FOMO, rushed", lesson: "Never enter a trade when there is a known fundamental risk event. Check the calendar first.",
  },
  {
    id: 4, date: "2024-06-19", symbol: "BTC/USD", direction: "BUY", entry: "64500", exit: "66200",
    outcome: "WIN", pnl: 170, rr: "1:3.1",
    notes: "Perfect bull flag breakout on 4H. Held through a small pullback with conviction.",
    emotions: "Calm, disciplined", lesson: "Holding through shallow pullbacks when the trend is intact is the right move.",
  },
  {
    id: 5, date: "2024-06-18", symbol: "NAS100", direction: "BUY", entry: "18050", exit: "17900",
    outcome: "LOSS", pnl: -150, rr: "1:0.3",
    notes: "Poor risk management. Moved stop to breakeven too early and got stopped out before the rally.",
    emotions: "Nervous, impatient", lesson: "Moving stop to breakeven too early on a volatile index is counterproductive. Give the trade room.",
  },
  {
    id: 6, date: "2024-06-18", symbol: "GOLD", direction: "SELL", entry: "2340", exit: "2318",
    outcome: "WIN", pnl: 110, rr: "1:2.2",
    notes: "Supply zone rejection with bearish engulfing candle on 4H. Clean setup.",
    emotions: "Neutral, methodical", lesson: "Sticking to the plan and not second-guessing the setup pays off.",
  },
];

const OUTCOMES = ["All", "WIN", "LOSS", "BREAK EVEN"];
const DIRECTIONS = ["All", "BUY", "SELL"];

function OutcomeBadge({ outcome }) {
  const config = {
    WIN: "bg-[#00d4aa]/20 text-[#00d4aa] border-[#00d4aa]/40",
    LOSS: "bg-[#ff4757]/20 text-[#ff4757] border-[#ff4757]/40",
    "BREAK EVEN": "bg-[#ffa502]/20 text-[#ffa502] border-[#ffa502]/40",
  };
  return (
    <span className={`inline-flex font-bold rounded border px-2.5 py-0.5 text-xs ${config[outcome] || config["BREAK EVEN"]}`}>
      {outcome}
    </span>
  );
}

function DirectionBadge({ direction }) {
  return (
    <span className={`inline-flex font-bold rounded border px-2.5 py-0.5 text-xs ${
      direction === "BUY" ? "bg-[#00d4aa]/20 text-[#00d4aa] border-[#00d4aa]/40" : "bg-[#ff4757]/20 text-[#ff4757] border-[#ff4757]/40"
    }`}>
      {direction}
    </span>
  );
}

const DEFAULT_FORM = {
  date: new Date().toISOString().slice(0, 10),
  symbol: "", direction: "BUY", entry: "", exit: "", outcome: "WIN",
  pnl: "", rr: "", notes: "", emotions: "", lesson: "",
};

export default function TradeJournal() {
  const [entries, setEntries] = useState(INITIAL_ENTRIES);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [formError, setFormError] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState("All");
  const [directionFilter, setDirectionFilter] = useState("All");
  const [symbolSearch, setSymbolSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [sortNewest, setSortNewest] = useState(true);

  const filtered = useMemo(() => {
    let r = entries;
    if (outcomeFilter !== "All") r = r.filter((e) => e.outcome === outcomeFilter);
    if (directionFilter !== "All") r = r.filter((e) => e.direction === directionFilter);
    if (symbolSearch) r = r.filter((e) => e.symbol.toLowerCase().includes(symbolSearch.toLowerCase()));
    r = [...r].sort((a, b) => sortNewest ? b.id - a.id : a.id - b.id);
    return r;
  }, [entries, outcomeFilter, directionFilter, symbolSearch, sortNewest]);

  const wins = entries.filter((e) => e.outcome === "WIN").length;
  const losses = entries.filter((e) => e.outcome === "LOSS").length;
  const winRate = entries.length > 0 ? ((wins / entries.length) * 100).toFixed(1) : "0";
  const avgRR = useMemo(() => {
    const validRR = entries.filter((e) => e.rr).map((e) => parseFloat(e.rr.split(":")[1]) || 0);
    if (!validRR.length) return "â€”";
    return (validRR.reduce((a, b) => a + b, 0) / validRR.length).toFixed(2);
  }, [entries]);
  const totalPnl = entries.reduce((a, e) => a + (parseFloat(e.pnl) || 0), 0);

  const submitEntry = () => {
    if (!form.symbol || !form.entry || !form.exit) {
      setFormError("Symbol, entry and exit are required.");
      return;
    }
    setEntries((prev) => [{ ...form, id: Date.now(), pnl: parseFloat(form.pnl) || 0 }, ...prev]);
    setForm(DEFAULT_FORM);
    setShowForm(false);
    setFormError("");
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-2">
            <BookOpen size={26} className="text-[#00d4aa]" /> Trade Journal
          </h1>
          <p className="text-gray-400 text-sm">Track your performance and refine your edge</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#00d4aa] text-[#0a0e1a] font-semibold rounded-xl hover:bg-[#00d4aa]/90 transition-colors"
        >
          <Plus size={16} /> Add Entry
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Win Rate" value={`${winRate}%`} icon={Award} color={+winRate >= 50 ? "text-[#00d4aa]" : "text-[#ff4757]"} sub={`${wins}W / ${losses}L`} />
        <StatCard label="Avg R:R" value={`1 : ${avgRR}`} icon={BarChart2} color="text-[#ffa502]" sub="Risk/Reward ratio" />
        <StatCard label="Total P&L" value={`${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(2)}`} icon={totalPnl >= 0 ? TrendingUp : TrendingDown} color={totalPnl >= 0 ? "text-[#00d4aa]" : "text-[#ff4757]"} sub={`${entries.length} total trades`} />
        <StatCard label="Total Entries" value={entries.length} icon={BookOpen} color="text-gray-300" sub="Journal entries" />
      </div>

      {/* Add Entry Form */}
      {showForm && (
        <div className="bg-[#111827] rounded-xl border border-[#00d4aa]/20 p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-5">New Journal Entry</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <JournalInput label="Date" type="date" value={form.date} onChange={(v) => setForm((f) => ({ ...f, date: v }))} />
            <JournalInput label="Symbol *" value={form.symbol} onChange={(v) => setForm((f) => ({ ...f, symbol: v }))} placeholder="EUR/USD" />
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Direction</label>
              <div className="flex gap-2">
                {["BUY", "SELL"].map((d) => (
                  <button key={d} onClick={() => setForm((f) => ({ ...f, direction: d }))}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${
                      form.direction === d
                        ? d === "BUY" ? "bg-[#00d4aa] text-[#0a0e1a] border-[#00d4aa]" : "bg-[#ff4757] text-white border-[#ff4757]"
                        : "border-white/10 text-gray-400"
                    }`}>{d}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Outcome</label>
              <select
                value={form.outcome}
                onChange={(e) => setForm((f) => ({ ...f, outcome: e.target.value }))}
                className="w-full bg-[#0a0e1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#00d4aa]/50 outline-none"
              >
                <option>WIN</option>
                <option>LOSS</option>
                <option>BREAK EVEN</option>
              </select>
            </div>
            <JournalInput label="Entry Price *" value={form.entry} onChange={(v) => setForm((f) => ({ ...f, entry: v }))} placeholder="1.08200" />
            <JournalInput label="Exit Price *" value={form.exit} onChange={(v) => setForm((f) => ({ ...f, exit: v }))} placeholder="1.08900" />
            <JournalInput label="P&L ($)" value={form.pnl} onChange={(v) => setForm((f) => ({ ...f, pnl: v }))} placeholder="82.50" />
            <JournalInput label="R:R Ratio" value={form.rr} onChange={(v) => setForm((f) => ({ ...f, rr: v }))} placeholder="1:2.5" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <JournalTextarea label="Trade Notes" value={form.notes} onChange={(v) => setForm((f) => ({ ...f, notes: v }))} placeholder="Describe the setup, execution, and what happened..." />
            <JournalTextarea label="Emotions / Psychology" value={form.emotions} onChange={(v) => setForm((f) => ({ ...f, emotions: v }))} placeholder="How were you feeling? Calm, anxious, FOMO..." />
            <JournalTextarea label="Lesson Learned" value={form.lesson} onChange={(v) => setForm((f) => ({ ...f, lesson: v }))} placeholder="What will you do differently next time?" />
          </div>
          {formError && <p className="text-[#ff4757] text-xs mb-3">{formError}</p>}
          <div className="flex gap-3">
            <button onClick={submitEntry} className="px-6 py-2 bg-[#00d4aa] text-[#0a0e1a] font-semibold text-sm rounded-lg hover:bg-[#00d4aa]/90 transition-colors">
              Save Entry
            </button>
            <button onClick={() => { setShowForm(false); setFormError(""); }} className="px-6 py-2 border border-white/10 text-gray-400 text-sm rounded-lg hover:border-white/30 hover:text-white transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap mb-5">
        <Filter size={14} className="text-gray-500" />
        <input
          type="text"
          value={symbolSearch}
          onChange={(e) => setSymbolSearch(e.target.value)}
          placeholder="Search symbol..."
          className="bg-[#111827] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-[#00d4aa]/40 outline-none w-36"
        />
        {OUTCOMES.map((o) => (
          <button key={o} onClick={() => setOutcomeFilter(o)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              outcomeFilter === o ? "bg-[#00d4aa] text-[#0a0e1a] border-[#00d4aa]" : "border-white/10 text-gray-400 hover:border-white/30"
            }`}>{o}</button>
        ))}
        {DIRECTIONS.map((d) => (
          <button key={d} onClick={() => setDirectionFilter(d)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              directionFilter === d ? "bg-[#ffa502] text-[#0a0e1a] border-[#ffa502]" : "border-white/10 text-gray-400 hover:border-white/30"
            }`}>{d}</button>
        ))}
        <button onClick={() => setSortNewest((v) => !v)}
          className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors border border-white/10 rounded-lg px-3 py-1.5">
          {sortNewest ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
          {sortNewest ? "Newest First" : "Oldest First"}
        </button>
      </div>

      <div className="text-sm text-gray-400 mb-4">
        Showing <span className="text-white font-semibold">{filtered.length}</span> entries
      </div>

      {/* Entries List */}
      <div className="space-y-3">
        {filtered.map((entry) => (
          <div key={entry.id} className="bg-[#111827] rounded-xl border border-white/5 hover:border-white/10 transition-all overflow-hidden">
            {/* Summary Row */}
            <button
              className="w-full text-left px-5 py-4 flex items-center gap-4 flex-wrap"
              onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
            >
              <div className="text-sm text-gray-500 w-24 shrink-0">{entry.date}</div>
              <div className="font-bold text-white w-24 shrink-0">{entry.symbol}</div>
              <DirectionBadge direction={entry.direction} />
              <div className="flex gap-3 text-xs">
                <span className="text-gray-400">Entry <span className="text-white">{entry.entry}</span></span>
                <span className="text-gray-400">Exit <span className="text-white">{entry.exit}</span></span>
              </div>
              <OutcomeBadge outcome={entry.outcome} />
              <div className={`text-sm font-bold ${entry.pnl >= 0 ? "text-[#00d4aa]" : "text-[#ff4757]"}`}>
                {entry.pnl >= 0 ? "+" : ""}${parseFloat(entry.pnl).toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 ml-1">{entry.rr && `R:R ${entry.rr}`}</div>
              <div className="ml-auto text-gray-500">
                {expandedId === entry.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </button>

            {/* Expanded Details */}
            {expandedId === entry.id && (
              <div className="border-t border-white/5 px-5 py-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-[#00d4aa] font-semibold mb-1">Trade Notes</div>
                  <p className="text-xs text-gray-300 leading-relaxed">{entry.notes || "â€”"}</p>
                </div>
                <div>
                  <div className="text-xs text-[#ffa502] font-semibold mb-1">Emotions / Psychology</div>
                  <p className="text-xs text-gray-300 leading-relaxed">{entry.emotions || "â€”"}</p>
                </div>
                <div>
                  <div className="text-xs text-[#ff4757] font-semibold mb-1">Lesson Learned</div>
                  <p className="text-xs text-gray-300 leading-relaxed">{entry.lesson || "â€”"}</p>
                </div>
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <BookOpen size={40} className="mx-auto mb-4 opacity-30" />
            <p>No journal entries match your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="bg-[#111827] rounded-xl p-5 border border-white/5">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className="text-gray-400" />
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <div className={`text-2xl font-bold mb-0.5 ${color}`}>{value}</div>
      <div className="text-xs text-gray-500">{sub}</div>
    </div>
  );
}

function JournalInput({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label className="text-xs text-gray-400 mb-1 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#0a0e1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#00d4aa]/50 outline-none placeholder-gray-600"
      />
    </div>
  );
}

function JournalTextarea({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="text-xs text-gray-400 mb-1 block">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full bg-[#0a0e1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#00d4aa]/50 outline-none placeholder-gray-600 resize-none"
      />
    </div>
  );
}
