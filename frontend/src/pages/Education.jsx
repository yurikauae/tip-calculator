import { useState } from "react";

const topics = [
  {
    id: "rsi",
    title: "What is RSI?",
    icon: "ðŸ“Š",
    category: "Indicators",
    summary: "The Relative Strength Index measures momentum and overbought/oversold conditions.",
    content: `The Relative Strength Index (RSI) is a momentum oscillator that measures the speed and magnitude of recent price changes. It oscillates between 0 and 100.

Key levels:
â€¢ Above 70 = Overbought (potential sell signal)
â€¢ Below 30 = Oversold (potential buy signal)
â€¢ 50 = Neutral midpoint

In this app, RSI signals appear as colored markers on the chart. A green arrow below a candle suggests RSI crossed above 30 (oversold bounce). A red arrow above a candle suggests RSI crossed below 70 (overbought reversal).

Best used in combination with trend direction â€” avoid selling RSI overbought in a strong uptrend.`,
  },
  {
    id: "macd",
    title: "MACD Explained",
    icon: "ðŸ“ˆ",
    category: "Indicators",
    summary: "MACD shows trend direction, momentum, and potential reversals via two moving averages.",
    content: `MACD stands for Moving Average Convergence Divergence. It consists of:

â€¢ MACD Line: 12-period EMA minus 26-period EMA
â€¢ Signal Line: 9-period EMA of the MACD line
â€¢ Histogram: Difference between MACD and Signal line

Signals:
â€¢ Bullish crossover: MACD crosses above Signal line
â€¢ Bearish crossover: MACD crosses below Signal line
â€¢ Zero-line cross: Indicates trend direction change
â€¢ Divergence: Price makes new high/low but MACD doesn't â€” potential reversal

In this app, MACD crossovers are highlighted with colored dots. Green = bullish crossover, Red = bearish crossover.`,
  },
  {
    id: "sr",
    title: "Support & Resistance",
    icon: "ðŸ”²",
    category: "Price Action",
    summary: "Key price levels where buying and selling pressure historically concentrate.",
    content: `Support and Resistance are horizontal price levels where the market has repeatedly reversed.

Support: A price floor where demand exceeds supply. Price tends to bounce here.
Resistance: A price ceiling where supply exceeds demand. Price tends to reverse here.

Key concepts:
â€¢ Role reversal: Broken support becomes resistance and vice versa
â€¢ Stronger levels are tested multiple times
â€¢ Round numbers (e.g. 1.1000, $50,000) often act as psychological S/R
â€¢ S/R from higher timeframes carry more weight

How to use in this app: Draw horizontal lines on the chart at previous swing highs/lows. Watch for candle patterns (pin bars, engulfing) at these levels for entry signals.`,
  },
  {
    id: "risk",
    title: "Risk Management",
    icon: "ðŸ›¡ï¸",
    category: "Risk",
    summary: "The foundation of consistent trading â€” protecting capital above all else.",
    content: `Risk management is the single most important skill in trading. Even a strategy with a 40% win rate can be profitable with proper risk management.

Core rules:
â€¢ Never risk more than 1-2% of your account per trade
â€¢ Always use a stop loss â€” no exceptions
â€¢ Your reward should be at least 1.5x your risk (1:1.5 R:R minimum)
â€¢ Stop trading after 3 consecutive losses (cool-down rule)
â€¢ Never add to a losing position

Position sizing formula:
Position Size = (Account Balance Ã— Risk %) Ã· Stop Distance

Use the Risk Calculator page to calculate your exact position size before every trade. This removes emotion from the equation.`,
  },
  {
    id: "position",
    title: "Position Sizing",
    icon: "âš–ï¸",
    category: "Risk",
    summary: "How to calculate exactly how many units/lots to trade on each position.",
    content: `Position sizing determines how much of a market you buy or sell based on your risk parameters.

The formula:
Dollar Risk = Account Balance Ã— Risk %
Position Size = Dollar Risk Ã· Stop Loss Distance (in price)

Example:
â€¢ Account: $10,000
â€¢ Risk: 1% = $100
â€¢ Entry: 1.0850, Stop: 1.0800 (50 pips = 0.0050)
â€¢ Position Size = $100 Ã· 0.0050 = 20,000 units (0.2 lots)

Lot sizes in Forex:
â€¢ Standard lot = 100,000 units
â€¢ Mini lot = 10,000 units
â€¢ Micro lot = 1,000 units

Use the Risk Calculator in this app to automate this calculation for every trade.`,
  },
  {
    id: "candles",
    title: "Reading Candlesticks",
    icon: "ðŸ•¯ï¸",
    category: "Price Action",
    summary: "Understand what each candle tells you about market sentiment and momentum.",
    content: `A candlestick shows four prices: Open, High, Low, Close (OHLC).

Anatomy:
â€¢ Body: Distance between open and close
â€¢ Wick/Shadow: Extension above/below body showing intraday extremes
â€¢ Green/White candle: Close > Open (bullish)
â€¢ Red/Black candle: Close < Open (bearish)

Key patterns:
â€¢ Doji: Open â‰ˆ Close â€” indecision
â€¢ Pin Bar (Hammer/Shooting Star): Long wick, small body â€” rejection of a price level
â€¢ Engulfing: One candle completely covers the previous â€” strong reversal signal
â€¢ Inside Bar: Candle fits within previous candle's range â€” consolidation/breakout setup
â€¢ Marubozu: No wicks â€” strong momentum candle

In this app, hovering over any candle shows its OHLC values. Look for pin bars at support/resistance for high-probability setups.`,
  },
  {
    id: "trend",
    title: "Trend Following",
    icon: "ðŸ“‰",
    category: "Strategy",
    summary: "Trade in the direction of the dominant trend â€” the market's path of least resistance.",
    content: `"The trend is your friend" â€” following the trend is one of the most statistically reliable trading approaches.

Identifying a trend:
â€¢ Uptrend: Higher highs and higher lows
â€¢ Downtrend: Lower highs and lower lows
â€¢ Sideways: Equal highs and lows (range)

Tools:
â€¢ Moving averages (EMA 20, 50, 200) â€” price above MA = bullish bias
â€¢ ADX indicator â€” above 25 indicates a strong trend
â€¢ Trendlines â€” connect swing lows (uptrend) or swing highs (downtrend)

Entry strategy:
1. Identify the trend on a higher timeframe
2. Wait for a pullback to a support level or moving average
3. Look for a reversal candle (pin bar, engulfing)
4. Enter in the direction of the trend with a tight stop

In this app, EMA crossovers on the chart highlight trend changes. Green = bullish trend, Red = bearish trend.`,
  },
  {
    id: "bollinger",
    title: "Bollinger Bands",
    icon: "ðŸ“",
    category: "Indicators",
    summary: "Volatility bands around a moving average that help identify breakouts and reversals.",
    content: `Bollinger Bands consist of three lines:
â€¢ Middle Band: 20-period Simple Moving Average
â€¢ Upper Band: Middle + 2 standard deviations
â€¢ Lower Band: Middle - 2 standard deviations

Key concepts:
â€¢ Squeeze: Bands narrow = low volatility = breakout approaching
â€¢ Expansion: Bands widen = high volatility = trend in motion
â€¢ Price at upper band = relatively overbought
â€¢ Price at lower band = relatively oversold

Trading strategies:
â€¢ Mean reversion: Fade touches of upper/lower bands in a ranging market
â€¢ Breakout: Enter on a close outside the bands during a squeeze
â€¢ Trend confirmation: Price riding the upper/lower band confirms strong trend

Note: Bollinger Bands work best in ranging markets for mean-reversion and in breakout scenarios after a squeeze. They are less effective as standalone signals in strongly trending markets.`,
  },
];

const glossary = [
  { term: "Pip", def: "The smallest standard price move in forex. For EUR/USD, 1 pip = 0.0001." },
  { term: "Lot", def: "A standard forex trade size. 1 standard lot = 100,000 units of base currency." },
  { term: "Spread", def: "The difference between the bid (sell) and ask (buy) price. This is the broker's fee." },
  { term: "Leverage", def: "Borrowed capital that amplifies both gains and losses. 1:100 leverage = $1 controls $100." },
  { term: "Margin", def: "The deposit required to open a leveraged position." },
  { term: "R:R Ratio", def: "Risk-to-Reward Ratio. 1:2 means you risk $1 to potentially gain $2." },
  { term: "Drawdown", def: "The peak-to-trough decline in account value. Max drawdown is the worst historical dip." },
  { term: "Slippage", def: "When a trade executes at a different price than expected, usually during high volatility." },
  { term: "Liquidity", def: "How easily an asset can be bought or sold without affecting its price." },
  { term: "Volatility", def: "The degree of price fluctuation in a market over a given period." },
  { term: "Bull/Bear", def: "Bull market = rising prices. Bear market = falling prices." },
  { term: "Confluence", def: "Multiple signals agreeing at the same level â€” increases probability of a trade." },
];

const Education = () => {
  const [expanded, setExpanded] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [glossaryOpen, setGlossaryOpen] = useState(false);

  const categories = ["All", ...new Set(topics.map((t) => t.category))];
  const filtered = activeCategory === "All" ? topics : topics.filter((t) => t.category === activeCategory);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Learn Trading</h1>
          <p className="text-gray-400">Build your knowledge from the ground up</p>
        </div>

        <div className="bg-blue-900/20 border border-blue-800/40 rounded-xl p-4 mb-6">
          <h3 className="text-blue-300 font-semibold mb-2">How to Read Signals in This App</h3>
          <ul className="text-blue-200/80 text-sm space-y-1">
            <li>â€¢ <strong>Green arrows</strong> below candles = potential buy signal (RSI oversold recovery + EMA crossover)</li>
            <li>â€¢ <strong>Red arrows</strong> above candles = potential sell signal (RSI overbought + bearish MACD cross)</li>
            <li>â€¢ <strong>Yellow markers</strong> = alert levels you have set</li>
            <li>â€¢ <strong>Signal strength bars</strong> (1-5) indicate how many indicators agree</li>
            <li>â€¢ Always confirm signals with price action at a key S/R level</li>
          </ul>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {filtered.map((topic) => (
            <div
              key={topic.id}
              className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setExpanded(expanded === topic.id ? null : topic.id)}
                className="w-full text-left p-5 hover:bg-gray-800/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl mt-0.5">{topic.icon}</span>
                    <div>
                      <p className="font-semibold text-white">{topic.title}</p>
                      <p className="text-gray-400 text-sm mt-0.5">{topic.summary}</p>
                      <span className="inline-block mt-2 text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
                        {topic.category}
                      </span>
                    </div>
                  </div>
                  <span className={`text-gray-500 text-lg flex-shrink-0 transition-transform ${expanded === topic.id ? "rotate-180" : ""}`}>
                    â–¾
                  </span>
                </div>
              </button>
              {expanded === topic.id && (
                <div className="px-5 pb-5 border-t border-gray-800">
                  <pre className="mt-4 text-gray-300 text-sm whitespace-pre-wrap font-sans leading-relaxed">
                    {topic.content}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <button
            onClick={() => setGlossaryOpen(!glossaryOpen)}
            className="w-full text-left p-5 flex items-center justify-between hover:bg-gray-800/40 transition-colors"
          >
            <div>
              <h2 className="text-lg font-semibold text-white">Trading Glossary</h2>
              <p className="text-gray-400 text-sm">Key terms every trader should know</p>
            </div>
            <span className={`text-gray-500 text-lg transition-transform ${glossaryOpen ? "rotate-180" : ""}`}>â–¾</span>
          </button>
          {glossaryOpen && (
            <div className="border-t border-gray-800 divide-y divide-gray-800/50">
              {glossary.map(({ term, def }) => (
                <div key={term} className="px-5 py-3 grid grid-cols-3 gap-4">
                  <p className="text-blue-400 font-semibold text-sm">{term}</p>
                  <p className="col-span-2 text-gray-300 text-sm">{def}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Education;
