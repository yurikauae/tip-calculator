import { useState, useEffect } from "react";

const RiskCalculator = () => {
  const [accountBalance, setAccountBalance] = useState("");
  const [riskPercent, setRiskPercent] = useState("1");
  const [customRisk, setCustomRisk] = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");

  const getRisk = () => {
    if (riskPercent === "custom") return parseFloat(customRisk) || 0;
    return parseFloat(riskPercent);
  };

  const balance = parseFloat(accountBalance) || 0;
  const risk = getRisk();
  const entry = parseFloat(entryPrice) || 0;
  const sl = parseFloat(stopLoss) || 0;
  const tp = parseFloat(takeProfit) || 0;

  const dollarRisk = balance * (risk / 100);
  const stopDistance = entry > 0 && sl > 0 ? Math.abs(entry - sl) : 0;
  const positionSize = stopDistance > 0 ? dollarRisk / stopDistance : 0;
  const tpDistance = entry > 0 && tp > 0 ? Math.abs(tp - entry) : 0;
  const potentialProfit = positionSize * tpDistance;
  const rrRatio = stopDistance > 0 && tpDistance > 0 ? tpDistance / stopDistance : 0;
  const maxDailyLoss = dollarRisk * 3;

  const riskOptions = [
    { label: "0.5%", value: "0.5" },
    { label: "1%", value: "1" },
    { label: "2%", value: "2" },
    { label: "Custom", value: "custom" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Risk Calculator</h1>
          <p className="text-gray-400">Calculate position size and manage your trading risk</p>
        </div>

        <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-xl p-4 mb-6 flex items-start gap-3">
          <span className="text-yellow-400 text-xl mt-0.5">âš </span>
          <p className="text-yellow-300 text-sm">
            <strong>Risk Warning:</strong> Trading leveraged products can result in losses exceeding your deposit. Only trade with capital you can afford to lose.
          </p>
        </div>

        {risk > 2 && (
          <div className="bg-red-900/40 border border-red-600/60 rounded-xl p-4 mb-6 flex items-start gap-3">
            <span className="text-red-400 text-xl mt-0.5">ðŸš¨</span>
            <p className="text-red-300 text-sm">
              <strong>High Risk Warning:</strong> You are risking more than 2% per trade. Most professional traders risk no more than 1-2% per trade to protect their capital.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Account Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Account Balance ($)</label>
                  <input
                    type="number"
                    value={accountBalance}
                    onChange={(e) => setAccountBalance(e.target.value)}
                    placeholder="e.g. 10000"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Risk Per Trade</label>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {riskOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setRiskPercent(opt.value)}
                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          riskPercent === opt.value
                            ? "bg-blue-600 text-white"
                            : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {riskPercent === "custom" && (
                    <input
                      type="number"
                      value={customRisk}
                      onChange={(e) => setCustomRisk(e.target.value)}
                      placeholder="Enter custom % (e.g. 1.5)"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Trade Parameters</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Entry Price</label>
                  <input
                    type="number"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(e.target.value)}
                    placeholder="e.g. 1.0850"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Stop Loss</label>
                  <input
                    type="number"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    placeholder="e.g. 1.0800"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Take Profit</label>
                  <input
                    type="number"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(e.target.value)}
                    placeholder="e.g. 1.0950"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Calculated Results</h2>
              <div className="space-y-4">
                <div className="bg-gray-800/60 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Position Size (Units)</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {positionSize > 0 ? positionSize.toFixed(2) : "â€”"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Dollar Risk</p>
                    <p className="text-xl font-bold text-red-400">
                      {dollarRisk > 0 ? `$${dollarRisk.toFixed(2)}` : "â€”"}
                    </p>
                  </div>
                  <div className="bg-green-900/20 border border-green-800/30 rounded-lg p-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Potential Profit</p>
                    <p className="text-xl font-bold text-green-400">
                      {potentialProfit > 0 ? `$${potentialProfit.toFixed(2)}` : "â€”"}
                    </p>
                  </div>
                </div>
                <div className="bg-gray-800/60 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Risk:Reward Ratio</p>
                  <p className="text-2xl font-bold text-purple-400">
                    {rrRatio > 0 ? `1 : ${rrRatio.toFixed(2)}` : "â€”"}
                  </p>
                  {rrRatio > 0 && rrRatio < 1.5 && (
                    <p className="text-xs text-yellow-400 mt-1">Consider improving your R:R ratio (aim for 1:2+)</p>
                  )}
                  {rrRatio >= 1.5 && (
                    <p className="text-xs text-green-400 mt-1">Good R:R ratio</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Max Daily Loss (3 Trades)</h2>
              <div className="bg-orange-900/20 border border-orange-800/30 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Max Daily Drawdown</p>
                <p className="text-2xl font-bold text-orange-400">
                  {maxDailyLoss > 0 ? `$${maxDailyLoss.toFixed(2)}` : "â€”"}
                </p>
                {balance > 0 && maxDailyLoss > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    {((maxDailyLoss / balance) * 100).toFixed(2)}% of account balance
                  </p>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Many professional traders have a rule to stop trading if they lose 3 consecutive trades or hit a daily loss limit of 3x their per-trade risk.
              </p>
            </div>

            {stopDistance > 0 && entry > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-3">Trade Summary</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>Stop Distance:</span>
                    <span className="text-white">{stopDistance.toFixed(5)} ({((stopDistance / entry) * 100).toFixed(2)}%)</span>
                  </div>
                  {tpDistance > 0 && (
                    <div className="flex justify-between text-gray-400">
                      <span>TP Distance:</span>
                      <span className="text-white">{tpDistance.toFixed(5)} ({((tpDistance / entry) * 100).toFixed(2)}%)</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-400">
                    <span>Risk % of Balance:</span>
                    <span className={risk > 2 ? "text-red-400 font-semibold" : "text-white"}>{risk}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskCalculator;
