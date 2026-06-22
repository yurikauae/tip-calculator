import { useState, useCallback } from "react";
import { Bell, Plus, Download, RotateCcw, Trash2 } from "lucide-react";

const CONDITIONS = ["above", "below", "crosses", "between"];
const NOTIFY_TYPES = ["In-App", "Email", "Browser Push"];
const SYMBOLS = ["EUR/USD", "GBP/USD", "USD/JPY", "BTC/USD", "ETH/USD", "AAPL", "TSLA", "SPY", "GOLD", "OIL"];

const MOCK_PRICES = {
  "EUR/USD": 1.0842, "GBP/USD": 1.2715, "USD/JPY": 157.34, "BTC/USD": 67850,
  "ETH/USD": 3412, "AAPL": 213.5, "TSLA": 178.2, "SPY": 531.8, "GOLD": 2345, "OIL": 79.4,
};

const INITIAL_ALERTS = [
  { id: 1, symbol: "BTC/USD", condition: "above", price: "70000", price2: "", notify: "In-App", enabled: true, triggered: false, triggeredAt: null, triggeredPrice: null, created: "2024-12-01" },
  { id: 2, symbol: "EUR/USD", condition: "below", price: "1.0800", price2: "", notify: "Email", enabled: true, triggered: false, triggeredAt: null, triggeredPrice: null, created: "2024-12-03" },
  { id: 3, symbol: "AAPL", condition: "crosses", price: "200.00", price2: "", notify: "Browser Push", enabled: false, triggered: false, triggeredAt: null, triggeredPrice: null, created: "2024-12-05" },
];

const INITIAL_HISTORY = [
  { id: 1, symbol: "GOLD", condition: "above", price: "2100", triggeredAt: "2024-12-10 14:32", triggeredPrice: 2108.5, notify: "In-App", accuracy: "correct" },
  { id: 2, symbol: "ETH/USD", condition: "below", price: "3200", triggeredAt: "2024-12-09 09:15", triggeredPrice: 3185.2, notify: "Email", accuracy: "correct" },
  { id: 3, symbol: "BTC/USD", condition: "crosses", price: "65000", triggeredAt: "2024-12-08 18:44", triggeredPrice: 65120, notify: "In-App", accuracy: "neutral" },
  { id: 4, symbol: "USD/JPY", condition: "above", price: "155.00", triggeredAt: "2024-12-07 06:22", triggeredPrice: 155.82, notify: "Browser Push", accuracy: "incorrect" },
];

function conditionColor(c) {
  if (c === "above" || c === "crosses") return "text-[#00d4aa]";
  if (c === "below") return "text-[#ff4757]";
  return "text-yellow-400";
}

function accuracyBadge(acc) {
  if (acc === "correct") return <span className="text-xs font-bold text-[#00d4aa]">Correct</span>;
  if (acc === "incorrect") return <span className="text-xs font-bold text-[#ff4757]">Incorrect</span>;
  return <span className="text-xs text-gray-500">Neutral</span>;
}

const INPUT_CLASS = "w-full bg-[#0a0e1a] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00d4aa]/50";
const LABEL_CLASS = "block text-xs text-gray-400 mb-1.5";

const Alerts = () => {
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [history, setHistory] = useState(INITIAL_HISTORY);
  const [symbol, setSymbol] = useState("BTC/USD");
  const [condition, setCondition] = useState("above");
  const [price, setPrice] = useState("");
  const [price2, setPrice2] = useState("");
  const [notify, setNotify] = useState("In-App");
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("active");

  const activeCount = alerts.filter((a) => a.enabled && !a.triggered).length;
  const triggeredCount = alerts.filter((a) => a.triggered).length;
  const accuracyScore = history.length > 0
    ? ((history.filter((h) => h.accuracy === "correct").length / history.length) * 100).toFixed(0)
    : 0;

  const createAlert = useCallback(() => {
    if (!price) return;
    if (condition === "between" && !price2) return;
    const newAlert = {
      id: Date.now(), symbol, condition, price,
      price2: condition === "between" ? price2 : "",
      notify, enabled: true, triggered: false,
      triggeredAt: null, triggeredPrice: null,
      created: new Date().toLocaleDateString(),
    };
    setAlerts((prev) => [newAlert, ...prev]);
    setPrice(""); setPrice2("");
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }, [symbol, condition, price, price2, notify]);

  const toggleAlert = (id) =>
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, enabled: !a.enabled } : a));

  const deleteAlert = (id) =>
    setAlerts((prev) => prev.filter((a) => a.id !== id));

  const resetAlert = (id) =>
    setAlerts((prev) => prev.map((a) => a.id === id
      ? { ...a, triggered: false, triggeredAt: null, triggeredPrice: null, enabled: true } : a));

  const simulateTrigger = (id) => {
    const alert = alerts.find((a) => a.id === id);
    if (!alert) return;
    const now = new Date().toLocaleString();
    const mockPrice = MOCK_PRICES[alert.symbol] || parseFloat(alert.price) * 1.005;
    setAlerts((prev) => prev.map((a) => a.id === id
      ? { ...a, triggered: true, enabled: false, triggeredAt: now, triggeredPrice: mockPrice } : a));
    setHistory((prev) => [{
      id: Date.now(), symbol: alert.symbol, condition: alert.condition, price: alert.price,
      triggeredAt: now, triggeredPrice: mockPrice, notify: alert.notify, accuracy: "neutral",
    }, ...prev]);
  };

  const exportCSV = () => {
    const rows = [
      ["Symbol", "Condition", "Price", "Triggered At", "Triggered Price", "Notify", "Accuracy"],
      ...history.map((h) => [h.symbol, h.condition, h.price, h.triggeredAt, h.triggeredPrice, h.notify, h.accuracy]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "alerts_history.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const activeAlerts = alerts.filter((a) => !a.triggered);
  const triggeredAlerts = alerts.filter((a) => a.triggered);

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-gray-100 p-6">
      <div className="max-w-5xl mx-auto">

        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-2">
              <Bell size={26} className="text-[#00d4aa]" /> Price Alerts
            </h1>
            <p className="text-gray-400 text-sm">Get notified when prices hit your targets</p>
          </div>
          <div className="flex items-center gap-3">
            {activeCount > 0 && (
              <div className="bg-[#00d4aa]/20 border border-[#00d4aa]/40 text-[#00d4aa] text-xs font-bold px-3 py-1.5 rounded-full">
                {activeCount} Active
              </div>
            )}
            {triggeredCount > 0 && (
              <div className="bg-[#ff4757]/20 border border-[#ff4757]/40 text-[#ff4757] text-xs font-bold px-3 py-1.5 rounded-full">
                {triggeredCount} Triggered
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-[#111827] border border-white/5 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 uppercase mb-1">Active Alerts</p>
            <p className="text-2xl font-bold text-white">{activeCount}</p>
          </div>
          <div className="bg-[#111827] border border-white/5 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 uppercase mb-1">History Count</p>
            <p className="text-2xl font-bold text-white">{history.length}</p>
          </div>
          <div className="bg-[#111827] border border-white/5 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 uppercase mb-1">Accuracy Score</p>
            <p className={`text-2xl font-bold ${+accuracyScore >= 60 ? "text-[#00d4aa]" : "text-[#ff4757]"}`}>{accuracyScore}%</p>
          </div>
        </div>

        <div className="bg-[#111827] border border-white/5 rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide flex items-center gap-2">
            <Plus size={14} className="text-[#00d4aa]" /> Create New Alert
          </h2>
          {success && (
            <div className="bg-[#00d4aa]/10 border border-[#00d4aa]/40 rounded-lg p-3 mb-4 text-[#00d4aa] text-sm">
              Alert created successfully.
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div>
              <label className={LABEL_CLASS}>Symbol</label>
              <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className={INPUT_CLASS}>
                {SYMBOLS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Condition</label>
              <select value={condition} onChange={(e) => setCondition(e.target.value)} className={INPUT_CLASS}>
                {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
              </select>
              <p className="text-xs text-gray-600 mt-1 leading-snug">
                {condition === "crosses" && "Triggers on price crossing in either direction"}
                {condition === "between" && "Triggers when price enters the range"}
                {condition === "above" && "Triggers when price rises above level"}
                {condition === "below" && "Triggers when price falls below level"}
              </p>
            </div>
            <div>
              <label className={LABEL_CLASS}>{condition === "between" ? "Range Low" : "Price Level"}</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Enter price" className={INPUT_CLASS} />
            </div>
            {condition === "between" ? (
              <div>
                <label className={LABEL_CLASS}>Range High</label>
                <input type="number" value={price2} onChange={(e) => setPrice2(e.target.value)} placeholder="Upper bound" className={INPUT_CLASS} />
              </div>
            ) : (
              <div>
                <label className={LABEL_CLASS}>Notification</label>
                <select value={notify} onChange={(e) => setNotify(e.target.value)} className={INPUT_CLASS}>
                  {NOTIFY_TYPES.map((n) => <option key={n}>{n}</option>)}
                </select>
              </div>
            )}
            <button
              onClick={createAlert}
              disabled={!price || (condition === "between" && !price2)}
              className="bg-[#00d4aa] hover:bg-[#00d4aa]/80 disabled:opacity-40 disabled:cursor-not-allowed text-[#0a0e1a] font-bold py-2.5 px-4 rounded-lg transition-colors text-sm"
            >
              + Add Alert
            </button>
          </div>
        </div>

        <div className="flex gap-1 mb-4 bg-[#111827] rounded-xl p-1 border border-white/5 w-fit">
          {[
            { key: "active", label: `Active (${activeAlerts.length})` },
            { key: "triggered", label: `Triggered (${triggeredAlerts.length})` },
            { key: "history", label: `History (${history.length})` },
          ].map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.key ? "bg-[#00d4aa] text-[#0a0e1a]" : "text-gray-400 hover:text-white"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "active" && (
          <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
            {activeAlerts.length === 0 ? (
              <p className="text-gray-500 text-center py-10">No active alerts. Create one above.</p>
            ) : (
              <div className="space-y-3">
                {activeAlerts.map((alert) => (
                  <div key={alert.id}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      alert.enabled ? "bg-[#0a0e1a]/60 border-white/10" : "bg-[#0a0e1a]/30 border-white/5 opacity-60"
                    }`}>
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="font-bold text-white text-sm">{alert.symbol}</span>
                      <span className="text-gray-400 text-sm">price</span>
                      <span className={`font-semibold text-sm ${conditionColor(alert.condition)}`}>{alert.condition}</span>
                      <span className="text-white font-bold text-sm">{alert.price}{alert.price2 ? ` – ${alert.price2}` : ""}</span>
                      <span className="text-xs bg-white/5 text-gray-400 px-2 py-0.5 rounded">{alert.notify}</span>
                      <span className="text-xs text-gray-600">Created {alert.created}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => simulateTrigger(alert.id)} title="Simulate trigger"
                        className="text-xs text-gray-600 hover:text-yellow-400 border border-white/10 rounded px-2 py-1 transition-colors">
                        Test
                      </button>
                      <button onClick={() => toggleAlert(alert.id)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${alert.enabled ? "bg-[#00d4aa]" : "bg-gray-700"}`}>
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${alert.enabled ? "translate-x-4" : "translate-x-0.5"}`} />
                      </button>
                      <button onClick={() => deleteAlert(alert.id)} className="text-gray-600 hover:text-[#ff4757] transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "triggered" && (
          <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
            {triggeredAlerts.length === 0 ? (
              <p className="text-gray-500 text-center py-10">No triggered alerts.</p>
            ) : (
              <div className="space-y-3">
                {triggeredAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 rounded-xl border border-[#ff4757]/20 bg-[#ff4757]/5">
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="w-2 h-2 rounded-full bg-[#ff4757] flex-shrink-0"></span>
                      <span className="font-bold text-white text-sm">{alert.symbol}</span>
                      <span className={`font-semibold text-sm ${conditionColor(alert.condition)}`}>{alert.condition}</span>
                      <span className="text-white font-bold text-sm">{alert.price}</span>
                      <div className="text-xs text-gray-400">
                        Triggered at <span className="text-white">{alert.triggeredAt}</span>
                        {alert.triggeredPrice && (
                          <span className="ml-2">Price: <span className="text-[#ff4757]">{Number(alert.triggeredPrice).toLocaleString()}</span></span>
                        )}
                        {alert.triggeredPrice && (
                          <span className="ml-2 text-gray-600">
                            ({(((Number(alert.triggeredPrice) - Number(alert.price)) / Number(alert.price)) * 100).toFixed(2)}% from level)
                          </span>
                        )}
                      </div>
                    </div>
                    <button onClick={() => resetAlert(alert.id)}
                      className="flex items-center gap-1 text-xs text-[#00d4aa] border border-[#00d4aa]/30 rounded px-2 py-1 hover:bg-[#00d4aa]/10 transition-colors">
                      <RotateCcw size={11} /> Reset
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-gray-500">Accuracy: did price continue in the expected direction after trigger?</p>
              <button onClick={exportCSV}
                className="flex items-center gap-1.5 text-xs text-[#00d4aa] border border-[#00d4aa]/30 rounded-lg px-3 py-1.5 hover:bg-[#00d4aa]/10 transition-colors">
                <Download size={12} /> Export CSV
              </button>
            </div>
            <div className="space-y-2">
              {history.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3 px-4 bg-[#0a0e1a]/60 rounded-lg border border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0"></span>
                    <span className="font-medium text-white text-sm">{item.symbol}</span>
                    <span className={`text-sm ${conditionColor(item.condition)}`}>{item.condition}</span>
                    <span className="text-[#00d4aa] text-sm font-medium">{item.price}</span>
                    {item.triggeredPrice && (
                      <span className="text-xs text-gray-500">to {Number(item.triggeredPrice).toLocaleString()}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {accuracyBadge(item.accuracy)}
                    <span>{item.notify}</span>
                    <span>{item.triggeredAt}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Alerts;