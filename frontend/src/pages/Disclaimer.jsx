import { useState, useEffect } from "react";

const STORAGE_KEY = "disclaimer_accepted";

const Disclaimer = () => {
  const [accepted, setAccepted] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") setAccepted(true);
  }, []);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setAccepted(true);
  };

  const handleRevoke = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAccepted(false);
    setChecked(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Legal Disclaimer</h1>
          <p className="text-gray-400">Please read carefully before using this platform</p>
        </div>

        {accepted && (
          <div className="bg-green-900/30 border border-green-700/50 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3 text-green-400">
              <span className="text-lg">âœ“</span>
              <span className="text-sm font-medium">You have accepted this disclaimer.</span>
            </div>
            <button onClick={handleRevoke} className="text-xs text-gray-500 hover:text-gray-300 underline transition-colors">
              Revoke
            </button>
          </div>
        )}

        <div className="space-y-5">
          <section className="bg-gray-900 border border-red-800/40 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-red-400 mb-3 flex items-center gap-2">
              <span>âš </span> Not Financial Advice
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              The information, tools, signals, analyses, charts, and content provided on this platform are for <strong className="text-white">educational and informational purposes only</strong>. Nothing on this platform constitutes financial advice, investment advice, trading advice, or any other sort of advice. You should not treat any of the platform's content as such.
            </p>
            <p className="text-gray-400 text-sm leading-relaxed mt-3">
              This platform does not recommend that any asset should be bought, sold, or held by you. Do your own due diligence and consult your financial advisor before making any investment decisions.
            </p>
          </section>

          <section className="bg-gray-900 border border-orange-800/40 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-orange-400 mb-3 flex items-center gap-2">
              <span>âš¡</span> Risk Warning â€” CFDs, Forex, and Cryptocurrency
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              Trading contracts for difference (CFDs), foreign exchange (Forex), and cryptocurrencies involves a <strong className="text-white">high level of risk</strong> and may not be suitable for all investors. The high degree of leverage can work against you as well as for you.
            </p>
            <ul className="mt-3 space-y-2 text-gray-400 text-sm">
              <li className="flex gap-2"><span className="text-orange-400 flex-shrink-0">â€¢</span> Leveraged trading can result in losses that <strong className="text-white">exceed your initial deposit</strong>.</li>
              <li className="flex gap-2"><span className="text-orange-400 flex-shrink-0">â€¢</span> Cryptocurrency markets are highly volatile and largely unregulated.</li>
              <li className="flex gap-2"><span className="text-orange-400 flex-shrink-0">â€¢</span> Forex markets are open 24 hours and can gap significantly on news events.</li>
              <li className="flex gap-2"><span className="text-orange-400 flex-shrink-0">â€¢</span> You should only trade with money you can afford to lose entirely.</li>
              <li className="flex gap-2"><span className="text-orange-400 flex-shrink-0">â€¢</span> Between 65-80% of retail investor accounts lose money when trading CFDs.</li>
            </ul>
          </section>

          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-yellow-400 mb-3">Past Performance Disclaimer</h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              Past performance of any strategy, indicator, signal, or trading system shown on this platform is <strong className="text-white">not indicative of future results</strong>. Backtested results are hypothetical and do not represent actual trading. Hypothetical performance results have many inherent limitations, including:
            </p>
            <ul className="mt-3 space-y-1 text-gray-400 text-sm">
              <li className="flex gap-2"><span className="text-yellow-500 flex-shrink-0">â€¢</span> Results do not account for slippage, spread, commissions, or liquidity.</li>
              <li className="flex gap-2"><span className="text-yellow-500 flex-shrink-0">â€¢</span> Backtests may be subject to curve-fitting bias.</li>
              <li className="flex gap-2"><span className="text-yellow-500 flex-shrink-0">â€¢</span> Market conditions change over time and historical patterns may not repeat.</li>
            </ul>
          </section>

          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-blue-400 mb-3">Paper Trading Recommendation</h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              If you are new to trading, we <strong className="text-white">strongly recommend</strong> using the paper trading (demo) mode exclusively until you have developed a consistent strategy, understand risk management principles, and can demonstrate profitability in simulation over a minimum of 3-6 months. Do not trade real money until you are ready.
            </p>
          </section>

          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-300 mb-3">Data Accuracy Disclaimer</h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              Market data, prices, charts, and indicators displayed on this platform are provided by third-party data sources (including but not limited to Twelve Data, Alpha Vantage, and Binance). We make no representation or warranty as to the accuracy, completeness, timeliness, or reliability of this data. Data may be delayed, incorrect, or unavailable.
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Always verify prices with your broker before placing any trade. This platform should not be used as the sole basis for trading decisions.
            </p>
          </section>

          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-300 mb-3">Regulatory Information</h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              This platform is a software tool and is <strong className="text-white">not a regulated financial service, broker, or investment adviser</strong>. It does not hold any financial services license. Users are responsible for ensuring that their trading activities comply with the laws and regulations of their country of residence.
            </p>
            <p className="text-gray-400 text-sm mt-2">
              If you require regulated financial advice, please contact a licensed financial adviser in your jurisdiction. Trading financial instruments may be restricted or prohibited in certain countries.
            </p>
          </section>

          {!accepted && (
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
              <label className="flex items-start gap-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setChecked(e.target.checked)}
                  className="mt-0.5 w-5 h-5 accent-blue-500 flex-shrink-0"
                />
                <span className="text-gray-300 text-sm leading-relaxed">
                  I have read and understood this disclaimer. I acknowledge that this platform provides no financial advice, that trading involves significant risk of loss, and that past performance is not indicative of future results. I am solely responsible for my trading decisions.
                </span>
              </label>
              <button
                onClick={handleAccept}
                disabled={!checked}
                className="mt-5 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
              >
                I Understand â€” Accept and Continue
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Disclaimer;
