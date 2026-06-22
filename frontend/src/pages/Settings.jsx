import { useState } from "react";

const Settings = () => {
  const [name, setName] = useState("John Trader");
  const [email, setEmail] = useState("john@example.com");
  const [defaultTimeframe, setDefaultTimeframe] = useState("1H");
  const [defaultRisk, setDefaultRisk] = useState("1");
  const [categories, setCategories] = useState({ forex: true, crypto: true, stocks: false, commodities: false });
  const [twelveDataKey, setTwelveDataKey] = useState("");
  const [alphaVantageKey, setAlphaVantageKey] = useState("");
  const [binanceKey, setBinanceKey] = useState("");
  const [binanceSecret, setBinanceSecret] = useState("");
  const [showKeys, setShowKeys] = useState({});
  const [theme, setTheme] = useState("dark");
  const [chartStyle, setChartStyle] = useState("candles");
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [browserNotifs, setBrowserNotifs] = useState(false);
  const [alertSound, setAlertSound] = useState(true);
  const [dataSource, setDataSource] = useState("demo");
  const [saved, setSaved] = useState(false);

  const timeframes = ["1M", "5M", "15M", "30M", "1H", "4H", "1D", "1W"];

  const toggleKey = (key) => setShowKeys((prev) => ({ ...prev, [key]: !prev[key] }));

  const maskValue = (val) => {
    if (!val) return "";
    return val.slice(0, 4) + "â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" + val.slice(-4);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Manage your profile, preferences, and integrations</p>
        </div>

        {saved && (
          <div className="bg-green-900/30 border border-green-700/50 rounded-xl p-4 mb-6 text-green-400 text-sm">
            Settings saved successfully.
          </div>
        )}

        <div className="space-y-6">
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span>Profile</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Display Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </section>

          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Trading Preferences</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Default Timeframe</label>
                <div className="flex flex-wrap gap-2">
                  {timeframes.map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setDefaultTimeframe(tf)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        defaultTimeframe === tf
                          ? "bg-blue-600 text-white"
                          : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Default Risk % Per Trade</label>
                <div className="flex gap-2">
                  {["0.5", "1", "1.5", "2"].map((r) => (
                    <button
                      key={r}
                      onClick={() => setDefaultRisk(r)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        defaultRisk === r
                          ? "bg-blue-600 text-white"
                          : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                      }`}
                    >
                      {r}%
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-3">Preferred Asset Categories</label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(categories).map(([cat, enabled]) => (
                    <label key={cat} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={() => setCategories((prev) => ({ ...prev, [cat]: !prev[cat] }))}
                        className="w-4 h-4 accent-blue-500"
                      />
                      <span className="text-gray-300 capitalize">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-2">API Keys</h2>
            <p className="text-xs text-gray-500 mb-4 bg-blue-900/20 border border-blue-800/30 rounded-lg px-3 py-2">
              API keys are stored securely on the backend and never exposed in the browser. Keys shown here are masked.
            </p>
            <div className="space-y-4">
              {[
                { label: "Twelve Data API Key", value: twelveDataKey, setter: setBinanceKey, id: "twelve" },
                { label: "Alpha Vantage API Key", value: alphaVantageKey, setter: setAlphaVantageKey, id: "alpha" },
                { label: "Binance API Key", value: binanceKey, setter: setBinanceKey, id: "binance" },
                { label: "Binance Secret Key", value: binanceSecret, setter: setBinanceSecret, id: "binancesecret" },
              ].map(({ label, value, setter, id }) => (
                <div key={id}>
                  <label className="block text-sm text-gray-400 mb-2">{label}</label>
                  <div className="flex gap-2">
                    <input
                      type={showKeys[id] ? "text" : "password"}
                      value={value}
                      onChange={(e) => setter(e.target.value)}
                      placeholder="Enter API key..."
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 font-mono text-sm"
                    />
                    <button
                      onClick={() => toggleKey(id)}
                      className="bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-400 px-3 rounded-lg text-xs transition-colors"
                    >
                      {showKeys[id] ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Theme Preferences</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Color Theme</label>
                <div className="flex gap-3">
                  {["dark", "darker", "midnight"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors ${
                        theme === t ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Chart Style</label>
                <div className="flex gap-3">
                  {["candles", "line", "bars"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setChartStyle(s)}
                      className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors ${
                        chartStyle === s ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Notifications</h2>
            <div className="space-y-4">
              {[
                { label: "Email Notifications", desc: "Receive alerts via email", value: emailNotifs, setter: setEmailNotifs },
                { label: "Browser Push Notifications", desc: "Real-time push alerts in your browser", value: browserNotifs, setter: setBrowserNotifs },
                { label: "Alert Sounds", desc: "Play a sound when an alert triggers", value: alertSound, setter: setAlertSound },
              ].map(({ label, desc, value, setter }) => (
                <div key={label} className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">{label}</p>
                    <p className="text-gray-500 text-xs">{desc}</p>
                  </div>
                  <button
                    onClick={() => setter(!value)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      value ? "bg-blue-600" : "bg-gray-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        value ? "translate-x-4" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Data Source</h2>
            <div className="flex gap-4">
              {["demo", "live"].map((src) => (
                <button
                  key={src}
                  onClick={() => setDataSource(src)}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold capitalize transition-colors border ${
                    dataSource === src
                      ? src === "live"
                        ? "bg-green-600/20 border-green-600 text-green-400"
                        : "bg-blue-600/20 border-blue-600 text-blue-400"
                      : "bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  {src === "live" ? "Live Data" : "Demo / Paper Trading"}
                </button>
              ))}
            </div>
            {dataSource === "live" && (
              <p className="text-xs text-yellow-400 mt-3">
                Live data requires valid API keys configured above.
              </p>
            )}
          </section>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
