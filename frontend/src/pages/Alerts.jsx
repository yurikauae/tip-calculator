import { useState } from "react";

const CONDITIONS = ["above", "below", "crosses above", "crosses below"];
const NOTIFY_TYPES = ["In-App", "Email", "Browser Push"];
const SYMBOLS = ["EUR/USD", "GBP/USD", "USD/JPY", "BTC/USD", "ETH/USD", "AAPL", "TSLA", "SPY", "GOLD", "OIL"];

const initialAlerts = [
  { id: 1, symbol: "BTC/USD", condition: "above", price: "70000", notify: "In-App", enabled: true, created: "2024-12-01" },
  { id: 2, symbol: "EUR/USD", condition: "below", price: "1.0800", notify: "Email", enabled: true, created: "2024-12-03" },
  { id: 3, symbol: "AAPL", condition: "crosses above", price: "200.00", notify: "Browser Push", enabled: false, created: "2024-12-05" },
];

const triggeredHistory = [
  { id: 1, symbol: "GOLD", condition: "above", price: "2100", triggeredAt: "2024-12-10 14:32", notify: "In-App" },
  { id: 2, symbol: "ETH/USD", condition: "below", price: "3200", triggeredAt: "2024-12-09 09:15", notify: "Email" },
  { id: 3, symbol: "BTC/USD", condition: "crosses above", price: "65000", triggeredAt: "2024-12-08 18:44", notify: "In-App" },
  { id: 4, symbol: "USD/JPY", condition: "above", price: "155.00", triggeredAt: "2024-12-07 06:22", notify: "Browser Push" },
];

const Alerts = () => {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [symbol, setSymbol] = useState("BTC/USD");
  const [condition, setCondition] = useState("above");
  const [price, setPrice] = useState("");
  const [notify, setNotify] = useState("In-App");
  const [success, setSuccess] = useState(false);

  const activeCount = alerts.filter((a) => a.enabled).length;

  const createAlert = () => {
    if (!price) return;
    const newAlert = {
      id: Date.now(),
      symbol,
      condition,
      price,
      notify,
      enabled: true,
      created: new Date().toLocaleDateString(),
    };
    setAlerts([newAlert, ...alerts]);
    setPrice("");
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const toggleAlert = (id) => {
    setAlerts(alerts.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)));
  };

  const deleteAlert = (id) => {
    setAlerts(alerts.filter((a) => a.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Price Alerts</h1>
            <p className="text-gray-400">Get notified when prices hit your targets</p>
          </div>
          {activeCount > 0 && (
            <div className="bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-full">
              {activeCount} Active Alert{activeCount !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Create New Alert</h2>
          {success && (
            <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-3 mb-4 text-green-400 text-sm">
              Alert created successfully.
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div>
              <label className="block text-xs text-gray-400 mb-2">Symbol</label>
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
              >
                {SYMBOLS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-2">Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
              >
                {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-2">Price</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Enter price"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-2">Notification</label>
              <select
                value={notify}
                onChange={(e) => setNotify(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
              >
                {NOTIFY_TYPES.map((n) => <option key={n}>{n}</option>)}
              </select>
            </div>
            <button
              onClick={createAlert}
              disabled={!price}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
            >
              + Add Alert
            </button>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Active Alerts</h2>
          {alerts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No alerts configured. Create one above.</p>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                    alert.enabled
                      ? "bg-gray-800/60 border-gray-700"
                      : "bg-gray-800/20 border-gray-800 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="font-semibold text-white">{alert.symbol}</span>
                      <span className="text-gray-400 mx-2">price</span>
                      <span className="text-yellow-400 font-medium">{alert.condition}</span>
                      <span className="text-green-400 font-bold ml-2">{alert.price}</span>
                    </div>
                    <span className="hidden md:inline text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
                      {alert.notify}
                    </span>
                    <span className="hidden lg:inline text-xs text-gray-500">Created {alert.created}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleAlert(alert.id)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        alert.enabled ? "bg-blue-600" : "bg-gray-700"
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          alert.enabled ? "translate-x-4" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="text-gray-600 hover:text-red-400 transition-colors text-lg leading-none"
                    >
                      Ã—
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Triggered History</h2>
          <div className="space-y-2">
            {triggeredHistory.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3 px-4 bg-gray-800/30 rounded-lg border border-gray-800/50">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0"></span>
                  <span className="font-medium text-white text-sm">{item.symbol}</span>
                  <span className="text-gray-400 text-sm">{item.condition}</span>
                  <span className="text-green-400 text-sm font-medium">{item.price}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{item.notify}</span>
                  <span>{item.triggeredAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Alerts;
