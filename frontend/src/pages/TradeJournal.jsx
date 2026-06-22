import { useState, useMemo, useEffect, useCallback } from "react";
import { BookOpen, Plus, Filter, TrendingUp, TrendingDown, Award, BarChart2, ChevronDown, ChevronUp, Download } from "lucide-react";
import api from "../services/api";

const OUTCOMES = ["All", "WIN", "LOSS", "BREAK EVEN"];
const DIRECTIONS = ["All", "BUY", "SELL"];

const MOODS = [
  { emoji: "😰", label: "Fearful" },
  { emoji: "😐", label: "Neutral" },
  { emoji: "😊", label: "Confident" },
  { emoji: "🤑", label: "Greedy" },
  { emoji: "😤", label: "Revenge" },
];

const DEFAULT_FORM = {
  date: new Date().toISOString().slice(0, 10),
  symbol: "", direction: "BUY", entry: "", exit: "", outcome: "WIN",
  pnl: "", rr: "", notes: "", mood: "😐", lesson: "",
};

function validateForm(form) {
  const errors = [];
  if (!form.symbol.trim()) errors.push("Symbol is required.");
  if (!form.direction) errors.push("Direction is required.");
  if (!form.outcome) errors.push("Outcome is required.");
  if (!form.lesson.trim()) errors.push("Lesson Learned is required.");
  else if (form.lesson.trim().length < 20) errors.push("Lesson Learned must be at least 20 characters.");
  return errors;
}

function OutcomeBadge({ outcome }) {
  const config = {
    WIN: "bg-[#00d4aa]/20 text-[#00d4aa] border-[#00d4aa]/40",
    LOSS: "bg-[#ff4757]/20 text-[#ff4757] border-[#ff4757]/40",
    "BREAK EVEN": "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
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

function JournalInput({ label, value, onChange, placeholder, type = "text", required }) {
  return (
    <div>
      <label className="text-xs text-gray-400 mb-1 block">
        {label}{required && <span className="text-[#ff4757] ml-0.5">*</span>}
      </label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-[#0a0e1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#00d4aa]/50 outline-none placeholder-gray-600" />
    </div>
  );
}

function JournalTextarea({ label, value, onChange, placeholder, minLength, required }) {
  const tooShort = required && minLength && value.length > 0 && value.length < minLength;
  return (
    <div>
      <label className="text-xs text-gray-400 mb-1 block">
        {label}{required && <span className="text-[#ff4757] ml-0.5">*</span>}
        {minLength && <span className="text-gray-600 ml-1">({value.length}/{minLength} min)</span>}
      </label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3}
        className={`w-full bg-[#0a0e1a] border rounded-lg px-3 py-2 text-sm text-white focus:border-[#00d4aa]/50 outline-none placeholder-gray-600 resize-none transition-colors ${tooShort ? "border-[#ff4757]/50" : "border-white/10"}`} />
      {tooShort && <p className="text-xs text-[#ff4757] mt-0.5">{minLength - value.length} more characters needed</p>}
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

export default function TradeJournal() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [formErrors, setFormErrors] = useState([]);
  const [outcomeFilter, setOutcomeFilter] = useState("All");
  const [directionFilter, setDirectionFilter] = useState("All");
  const [symbolSearch, setSymbolSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [sortNewest, setSortNewest] = useState(true);
  const [activeTab, setActiveTab] = useState("entries");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get("/journal");
        if (!cancelled) setEntries(Array.isArray(data) ? data : (data.entries || data.data || []));
      } catch (err) {
        if (!cancelled) setLoadError(err.message || "Failed to load journal entries.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    let r = entries;
    if (outcomeFilter !== "All") r = r.filter((e) => e.outcome === outcomeFilter);
    if (directionFilter !== "All") r = r.filter((e) => e.direction === directionFilter);
    if (symbolSearch) r = r.filter((e) => e.symbol?.toLowerCase().includes(symbolSearch.toLowerCase()));
    if (dateFrom) r = r.filter((e) => e.date >= dateFrom);
    if (dateTo) r = r.filter((e) => e.date <= dateTo);
    r = [...r].sort((a, b) => sortNewest ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date));
    return r;
  }, [entries, outcomeFilter, directionFilter, symbolSearch, dateFrom, dateTo, sortNewest]);

  const wins = entries.filter((e) => e.outcome === "WIN").length;
  const losses = entries.filter((e) => e.outcome === "LOSS").length;
  const winRate = entries.length > 0 ? ((wins / entries.length) * 100).toFixed(1) : "0";
  const totalPnl = entries.reduce((a, e) => a + (parseFloat(e.pnl) || 0), 0);
  const avgRR = useMemo(() => {
    const valid = entries.filter((e) => e.rr).map((e) => parseFloat((e.rr + "").split(":")[1]) || 0);
    if (!valid.length) return "—";
    return (valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(2);
  }, [entries]);

  const moodStats = useMemo(() => MOODS.map((m) => {
    const me = entries.filter((e) => e.mood === m.emoji);
    const mw = me.filter((e) => e.outcome === "WIN").length;
    return { ...m, count: me.length, winRate: me.length > 0 ? ((mw / me.length) * 100).toFixed(0) : null };
  }), [entries]);

  const submitEntry = useCallback(async () => {
    const errors = validateForm(form);
    if (errors.length > 0) { setFormErrors(errors); return; }
    setFormErrors([]);
    setSaving(true);
    const payload = { ...form, pnl: parseFloat(form.pnl) || 0 };
    try {
      const saved = await api.post("/journal", payload);
      const newEntry = saved?.id ? saved : { ...payload, id: Date.now() };
      setEntries((prev) => [newEntry, ...prev]);
    } catch {
      setEntries((prev) => [{ ...payload, id: Date.now() }, ...prev]);
    } finally {
      setForm(DEFAULT_FORM); setShowForm(false); setSaving(false);
    }
  }, [form]);

  const exportCSV = () => {
    const cols = ["date", "symbol", "direction", "entry", "exit", "outcome", "pnl", "rr", "mood", "lesson", "notes"];
    const rows = [cols.join(","), ...entries.map((e) => cols.map((c) => `"${(e[c] ?? "").toString().replace(/"/g, '""')}"`).join(","))];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "trade_journal.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white p-6">

      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-2">
            <BookOpen size={26} className="text-[#00d4aa]" /> Trade Journal
          </h1>
          <p className="text-gray-400 text-sm">Track your performance and refine your edge</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-white/10 text-gray-400 font-semibold text-sm rounded-xl hover:border-[#00d4aa]/40 hover:text-[#00d4aa] transition-colors">
            <Download size={14} /> Export CSV
          </button>
          <button onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#00d4aa] text-[#0a0e1a] font-semibold rounded-xl hover:bg-[#00d4aa]/90 transition-colors">
            <Plus size={16} /> Add Entry
          </button>
        </div>
      </div>

      {loadError && (
        <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-xl p-3 mb-4 text-yellow-400 text-xs">
          Could not load from server: {loadError}. Entries added locally will not persist.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Win Rate" value={`${winRate}%`} icon={Award} color={+winRate >= 50 ? "text-[#00d4aa]" : "text-[#ff4757]"} sub={`${wins}W / ${losses}L`} />
        <StatCard label="Avg R:R" value={`1 : ${avgRR}`} icon={BarChart2} color="text-yellow-400" sub="Risk/Reward ratio" />
        <StatCard label="Total P&L" value={`${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(2)}`} icon={totalPnl >= 0 ? TrendingUp : TrendingDown} color={totalPnl >= 0 ? "text-[#00d4aa]" : "text-[#ff4757]"} sub={`${entries.length} total trades`} />
        <StatCard label="Total Entries" value={entries.length} icon={BookOpen} color="text-gray-300" sub="Journal entries" />
      </div>

      {showForm && (
        <div className="bg-[#111827] rounded-xl border border-[#00d4aa]/20 p-6 mb-6">
          <h2 className="text-base font-semibold text-white mb-5">New Journal Entry</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <JournalInput label="Date" type="date" value={form.date} onChange={(v) => setForm((f) => ({ ...f, date: v }))} />
            <JournalInput label="Symbol" value={form.symbol} onChange={(v) => setForm((f) => ({ ...f, symbol: v }))} placeholder="EUR/USD" required />
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Direction<span className="text-[#ff4757] ml-0.5">*</span></label>
              <div className="flex gap-2">
                {["BUY", "SELL"].map((d) => (
                  <button key={d} onClick={() => setForm((f) => ({ ...f, direction: d }))}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${
                      form.direction === d
                        ? d === "BUY" ? "bg-[#00d4aa] text-[#0a0e1a] border-[#00d4aa]" : "bg-[#ff4757] text-white border-[#ff4757]"
                        : "border-white/10 text-gray-400 hover:border-white/30"
                    }`}>{d}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Outcome<span className="text-[#ff4757] ml-0.5">*</span></label>
              <select value={form.outcome} onChange={(e) => setForm((f) => ({ ...f, outcome: e.target.value }))}
                className="w-full bg-[#0a0e1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#00d4aa]/50 outline-none">
                <option>WIN</option><option>LOSS</option><option>BREAK EVEN</option>
              </select>
            </div>
            <JournalInput label="Entry Price" value={form.entry} onChange={(v) => setForm((f) => ({ ...f, entry: v }))} placeholder="1.08200" />
            <JournalInput label="Exit Price" value={form.exit} onChange={(v) => setForm((f) => ({ ...f, exit: v }))} placeholder="1.08900" />
            <JournalInput label="P&L ($)" value={form.pnl} onChange={(v) => setForm((f) => ({ ...f, pnl: v }))} placeholder="82.50" />
            <JournalInput label="R:R Ratio" value={form.rr} onChange={(v) => setForm((f) => ({ ...f, rr: v }))} placeholder="1:2.5" />
          </div>

          <div className="mb-4">
            <label className="text-xs text-gray-400 mb-2 block">Trading Mood</label>
            <div className="flex gap-2 flex-wrap">
              {MOODS.map((m) => (
                <button key={m.emoji} onClick={() => setForm((f) => ({ ...f, mood: m.emoji }))}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-all ${
                    form.mood === m.emoji ? "border-[#00d4aa]/60 bg-[#00d4aa]/10 text-white" : "border-white/10 text-gray-400 hover:border-white/30"
                  }`}>
                  <span>{m.emoji}</span><span className="text-xs">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <JournalTextarea label="Trade Notes" value={form.notes} onChange={(v) => setForm((f) => ({ ...f, notes: v }))} placeholder="Describe the setup, execution, and what happened..." />
            <JournalTextarea label="Lesson Learned" value={form.lesson} onChange={(v) => setForm((f) => ({ ...f, lesson: v }))} placeholder="What will you do differently next time?" required minLength={20} />
          </div>

          {formErrors.length > 0 && (
            <div className="bg-[#ff4757]/10 border border-[#ff4757]/30 rounded-lg p-3 mb-3">
              {formErrors.map((e, i) => <p key={i} className="text-[#ff4757] text-xs">{e}</p>)}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={submitEntry} disabled={saving}
              className="px-6 py-2 bg-[#00d4aa] text-[#0a0e1a] font-semibold text-sm rounded-lg hover:bg-[#00d4aa]/90 disabled:opacity-50 transition-colors flex items-center gap-2">
              {saving && <span className="inline-block w-3 h-3 border-2 border-[#0a0e1a] border-t-transparent rounded-full animate-spin"></span>}
              Save Entry
            </button>
            <button onClick={() => { setShowForm(false); setFormErrors([]); }}
              className="px-6 py-2 border border-white/10 text-gray-400 text-sm rounded-lg hover:border-white/30 hover:text-white transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-1 mb-4 bg-[#111827] rounded-xl p-1 border border-white/5 w-fit">
        {[{ key: "entries", label: "Entries" }, { key: "mood", label: "Mood Stats" }].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === tab.key ? "bg-[#00d4aa] text-[#0a0e1a]" : "text-gray-400 hover:text-white"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "mood" && (
        <div className="bg-[#111827] border border-white/5 rounded-xl p-6 mb-6">
          <h2 className="text-base font-semibold text-white mb-4">Win Rate by Trading Mood</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {moodStats.map((m) => (
              <div key={m.emoji} className="bg-[#0a0e1a] border border-white/5 rounded-xl p-4 text-center">
                <div className="text-3xl mb-2">{m.emoji}</div>
                <div className="text-xs text-gray-400 mb-1">{m.label}</div>
                <div className={`text-xl font-bold mb-0.5 ${m.winRate === null ? "text-gray-600" : +m.winRate >= 55 ? "text-[#00d4aa]" : +m.winRate >= 40 ? "text-yellow-400" : "text-[#ff4757]"}`}>
                  {m.winRate !== null ? `${m.winRate}%` : "—"}
                </div>
                <div className="text-xs text-gray-600">{m.count} trade{m.count !== 1 ? "s" : ""}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-4">Tip: trade more when your win rate is highest, reduce size or avoid trading in low-performance mood states.</p>
        </div>
      )}

      {activeTab === "entries" && (
        <>
          <div className="flex items-center gap-3 flex-wrap mb-4">
            <Filter size={14} className="text-gray-500" />
            <input type="text" value={symbolSearch} onChange={(e) => setSymbolSearch(e.target.value)} placeholder="Search symbol..."
              className="bg-[#111827] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-[#00d4aa]/40 outline-none w-36" />
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="bg-[#111827] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-[#00d4aa]/40 outline-none" />
            <span className="text-gray-600 text-xs">to</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="bg-[#111827] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-[#00d4aa]/40 outline-none" />
            {OUTCOMES.map((o) => (
              <button key={o} onClick={() => setOutcomeFilter(o)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${outcomeFilter === o ? "bg-[#00d4aa] text-[#0a0e1a] border-[#00d4aa]" : "border-white/10 text-gray-400 hover:border-white/30"}`}>
                {o}
              </button>
            ))}
            {DIRECTIONS.map((d) => (
              <button key={d} onClick={() => setDirectionFilter(d)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${directionFilter === d ? "bg-yellow-500 text-[#0a0e1a] border-yellow-500" : "border-white/10 text-gray-400 hover:border-white/30"}`}>
                {d}
              </button>
            ))}
            {(symbolSearch || dateFrom || dateTo || outcomeFilter !== "All" || directionFilter !== "All") && (
              <button onClick={() => { setSymbolSearch(""); setDateFrom(""); setDateTo(""); setOutcomeFilter("All"); setDirectionFilter("All"); }}
                className="text-xs text-[#ff4757] border border-[#ff4757]/30 rounded-lg px-2 py-1 hover:bg-[#ff4757]/10 transition-colors">
                Clear
              </button>
            )}
            <button onClick={() => setSortNewest((v) => !v)}
              className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-white border border-white/10 rounded-lg px-3 py-1.5 transition-colors">
              {sortNewest ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
              {sortNewest ? "Newest First" : "Oldest First"}
            </button>
          </div>

          <div className="text-xs text-gray-500 mb-3">
            Showing <span className="text-white font-semibold">{filtered.length}</span> of {entries.length} entries
          </div>

          {loading ? (
            <div className="text-center py-16 text-gray-500">
              <div className="inline-block w-6 h-6 border-2 border-[#00d4aa] border-t-transparent rounded-full animate-spin mb-3"></div>
              <p>Loading journal entries...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((entry) => (
                <div key={entry.id} className="bg-[#111827] rounded-xl border border-white/5 hover:border-white/10 transition-all overflow-hidden">
                  <button className="w-full text-left px-5 py-4 flex items-center gap-4 flex-wrap"
                    onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}>
                    <div className="text-sm text-gray-500 w-24 shrink-0">{entry.date}</div>
                    <div className="font-bold text-white w-24 shrink-0">{entry.symbol}</div>
                    <DirectionBadge direction={entry.direction} />
                    <div className="flex gap-3 text-xs">
                      <span className="text-gray-400">Entry <span className="text-white">{entry.entry}</span></span>
                      <span className="text-gray-400">Exit <span className="text-white">{entry.exit}</span></span>
                    </div>
                    <OutcomeBadge outcome={entry.outcome} />
                    <div className={`text-sm font-bold ${parseFloat(entry.pnl) >= 0 ? "text-[#00d4aa]" : "text-[#ff4757]"}`}>
                      {parseFloat(entry.pnl) >= 0 ? "+" : ""}${parseFloat(entry.pnl || 0).toFixed(2)}
                    </div>
                    {entry.rr && <div className="text-xs text-gray-500">R:R {entry.rr}</div>}
                    {entry.mood && <div className="text-base" title={MOODS.find((m) => m.emoji === entry.mood)?.label}>{entry.mood}</div>}
                    <div className="ml-auto text-gray-500">
                      {expandedId === entry.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </button>

                  {expandedId === entry.id && (
                    <div className="border-t border-white/5 px-5 py-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-xs text-[#00d4aa] font-semibold mb-1">Trade Notes</div>
                        <p className="text-xs text-gray-300 leading-relaxed">{entry.notes || "—"}</p>
                      </div>
                      <div>
                        <div className="text-xs text-yellow-400 font-semibold mb-1">Trading Mood</div>
                        <p className="text-sm">{entry.mood || "—"} {MOODS.find((m) => m.emoji === entry.mood)?.label || ""}</p>
                      </div>
                      <div>
                        <div className="text-xs text-[#ff4757] font-semibold mb-1">Lesson Learned</div>
                        <p className="text-xs text-gray-300 leading-relaxed">{entry.lesson || "—"}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {filtered.length === 0 && !loading && (
                <div className="text-center py-16 text-gray-500">
                  <BookOpen size={40} className="mx-auto mb-4 opacity-30" />
                  <p>No journal entries match your filters.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}