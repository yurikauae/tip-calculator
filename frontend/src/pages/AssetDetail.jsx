import { useState } from "react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { Star, StarOff, ArrowUpRight, ArrowDownRight, Info } from "lucide-react";

const TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "1D"];

function generateCandles(n, base, volatility) {
  const data = [];
  let prev = base;
  for (let i = 0; i < n; i++) {
    const open = prev;
    const change = (Math.random() - 0.48) * volatility;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    data.push({
      time: i,
      open: +open.toFixed(5),
      close: +close.toFixed(5),
      high: +high.toFixed(5),
      low: +low.toFixed(5),
      barColor: close >= open ? "#00d4aa" : "#ff4757",
      barBottom: +Math.min(open, close).toFixed(5),
      barSize: +Math.abs(close - open).toFixed(5),
      rsi: 40 + Math.random() * 30,
      macd: (Math.random() - 0.5) * 0.001,
    });
    prev = close;
  }
  return data;
}

const CANDLE_DATA = generateCandles(60, 1.0843, 0.0015);

function SignalBadge({ signal }) {
  const config = {
    BUY: { bg: "bg-[#00d4aa]/20", text: "text-[#00d4aa]", border: "border-[#00d4aa]/40" },
    SELL: { bg: "bg-[#ff4757]/20", text: "text-[#ff4757]", border: "border-[#ff4757]/40" },
    NEUTRAL: { bg: "bg-[#ffa502]/20", text: "text-[#ffa502]", border: "border-[#ffa502]/40" },
  };
  const c = config[signal] || config.NEUTRAL;
  return (
    <span className={`inline-flex items-center font-bold rounded border px-3 py-1 text-sm ${c.bg} ${c.text} ${c.border}`}>
      {signal}
    </span>
  );
}

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0]?.payload;
    if (!d) return null;
    return (
      <div className="bg-[#111827] border border-white/10 rounded-lg p-3 text-xs shadow-xl">
        <div className="text-gray-400 mb-1">Candle #{d.time + 1}</div>
        <div className="flex flex-col gap-0.5">
          <div><span className="text-gray-400">O </span><span className="text-white">{d.open}</span></div>
          <div><span className="text-gray-400">H </span><span className="text-[#00d4aa]">{d.high}</span></div>
          <div><span className="text-gray-400">L </span><span className="text-[#ff4757]">{d.low}</span></div>
          <div><span className="text-gray-400">C </span><span className="text-white">{d.close}</span></div>
        </div>
      </div>
    );
  }
  return null;
};

export default function AssetDetail() {
  const [activeTimeframe, setActiveTimeframe] = useState("1h");
  const [inWatchlist, setInWatchlist] = useState(false);

  const lastCandle = CANDLE_DATA[CANDLE_DATA.length - 1];
  const firstCandle = CANDLE_DATA[0];
  const isPositive = lastCandle.close >= firstCandle.open;
  const changePct = (((lastCandle.close - firstCandle.open) / firstCandle.open) * 100).toFixed(3);
  const lastRsi = CANDLE_DATA[CANDLE_DATA.length - 1].rsi.toFixed(2);
  const lastMacd = CANDLE_DATA[CANDLE_DATA.length - 1].macd.toFixed(6);

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold text-white">EUR/USD</h1>
            <SignalBadge signal="BUY" />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-3xl font-bold text-white">{lastCandle.close.toFixed(5)}</span>
            <span className={`flex items-center gap-1 text-xl font-semibold ${isPositive ? "text-[#00d4aa]" : "text-[#ff4757]"}`}>
              {isPositive ? <ArrowUpRight size={22} /> : <ArrowDownRight size={22} />}
              {isPositive ? "+" : ""}{changePct}%
            </span>
          </div>
          <p className="text-gray-400 text-sm mt-1">Euro / US Dollar · Forex · Session: London/NY Overlap</p>
        </div>
        <button
          onClick={() => setInWatchlist((v) => !v)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all border ${
            inWatchlist
              ? "bg-[#ffa502]/10 text-[#ffa502] border-[#ffa502]/40 hover:bg-[#ffa502]/20"
              : "bg-[#00d4aa]/10 text-[#00d4aa] border-[#00d4aa]/40 hover:bg-[#00d4aa]/20"
          }`}
        >
          {inWatchlist ? <StarOff size={16} /> : <Star size={16} />}
          {inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Chart Area */}
        <div className="xl:col-span-2">
          <div className="bg-[#111827] rounded-xl border border-white/5 p-5 mb-6">
            {/* Timeframe Selector */}
            <div className="flex items-center gap-2 mb-5">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setActiveTimeframe(tf)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    activeTimeframe === tf
                      ? "bg-[#00d4aa] text-[#0a0e1a]"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {tf}
                </button>
              ))}
              <span className="ml-auto text-xs text-gray-500">Candlestick · EUR/USD · {activeTimeframe}</span>
            </div>

            {/* Candlestick Chart using ComposedChart */}
            <ResponsiveContainer width="100%" height={340}>
              <ComposedChart data={CANDLE_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis dataKey="time" hide />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fill: "#9ca3af", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => v.toFixed(4)}
                  width={70}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={lastCandle.close} stroke="#00d4aa" strokeDasharray="4 4" strokeOpacity={0.5} />
                {/* Wicks as thin lines */}
                <Line
                  dataKey="high"
                  stroke="transparent"
                  dot={false}
                  activeDot={false}
                />
                {/* Body bars */}
                <Bar
                  dataKey="barSize"
                  stackId="candle"
                  fill="transparent"
                  stroke="none"
                  shape={(props) => {
                    const { x, y, width, height, payload } = props;
                    const color = payload.close >= payload.open ? "#00d4aa" : "#ff4757";
                    return (
                      <g key={payload.time}>
                        {/* Wick line */}
                        <line
                          x1={x + width / 2}
                          y1={y - 10}
                          x2={x + width / 2}
                          y2={y + height + 10}
                          stroke={color}
                          strokeWidth={1}
                          opacity={0.5}
                        />
                        {/* Body rect */}
                        <rect
                          x={x + 1}
                          y={y}
                          width={Math.max(width - 2, 2)}
                          height={Math.max(height, 1)}
                          fill={color}
                          opacity={0.85}
                          rx={1}
                        />
                      </g>
                    );
                  }}
                />
                <Line
                  dataKey="close"
                  stroke="#00d4aa"
                  strokeWidth={1.5}
                  dot={false}
                  strokeDasharray="0"
                  opacity={0.3}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Indicator Panel */}
          <div className="bg-[#111827] rounded-xl border border-white/5 p-5">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Info size={15} className="text-gray-400" /> Technical Indicators
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <IndicatorCard label="RSI (14)" value={lastRsi} note={+lastRsi > 70 ? "Overbought" : +lastRsi < 30 ? "Oversold" : "Neutral"} color={+lastRsi > 70 ? "#ff4757" : +lastRsi < 30 ? "#00d4aa" : "#ffa502"} />
              <IndicatorCard label="MACD" value={lastMacd} note="Bullish crossover" color="#00d4aa" />
              <IndicatorCard label="EMA 50" value="1.07920" note="Price above" color="#00d4aa" />
              <IndicatorCard label="EMA 200" value="1.06540" note="Price above" color="#00d4aa" />
              <IndicatorCard label="Bollinger" value="Mid" note="Near upper band" color="#ffa502" />
              <IndicatorCard label="ATR (14)" value="0.00082" note="Low volatility" color="#9ca3af" />
              <IndicatorCard label="Volume" value="2.1B" note="+14% avg" color="#00d4aa" />
              <IndicatorCard label="Stoch RSI" value="78.4" note="Overbought" color="#ff4757" />
            </div>
          </div>
        </div>

        {/* Signal Card + Details */}
        <div className="flex flex-col gap-5">
          {/* Signal Card */}
          <div className="bg-[#111827] rounded-xl border border-[#00d4aa]/20 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white">Active Signal</h3>
              <SignalBadge signal="BUY" />
            </div>

            <div className="space-y-3 text-sm">
              <Row label="Timeframe" value="1H" />
              <Row label="Confidence" value={
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden w-24">
                    <div className="h-full bg-[#00d4aa] rounded-full" style={{ width: "87%" }} />
                  </div>
                  <span className="text-white font-semibold">87%</span>
                </div>
              } />
              <Row label="Entry Zone" value={<span className="text-white font-semibold">1.08280 â€“ 1.08380</span>} />
              <Row label="Take Profit" value={<span className="text-[#00d4aa] font-semibold">1.09200</span>} />
              <Row label="Stop Loss" value={<span className="text-[#ff4757] font-semibold">1.07800</span>} />
              <Row label="R:R Ratio" value={<span className="text-[#ffa502] font-semibold">1 : 2.84</span>} />
              <Row label="Generated" value="2 hours ago" />
            </div>

            <div className="mt-4 p-3 bg-[#00d4aa]/5 rounded-lg border border-[#00d4aa]/10">
              <p className="text-xs text-gray-300 leading-relaxed">
                RSI bullish divergence on 1H with price breaking above key resistance at 1.0828. EMA 50/200 golden cross confirmed. Momentum favors continuation to 1.0920 supply zone.
              </p>
            </div>
          </div>

          {/* Key Levels */}
          <div className="bg-[#111827] rounded-xl border border-white/5 p-5">
            <h3 className="text-base font-semibold text-white mb-4">Key Price Levels</h3>
            <div className="space-y-2 text-sm">
              {[
                { label: "Daily High", val: "1.08760", color: "text-[#00d4aa]" },
                { label: "Daily Low", val: "1.08010", color: "text-[#ff4757]" },
                { label: "Weekly Pivot", val: "1.08220", color: "text-[#ffa502]" },
                { label: "1H Resistance", val: "1.08920", color: "text-gray-300" },
                { label: "1H Support", val: "1.08150", color: "text-gray-300" },
                { label: "52W High", val: "1.09425", color: "text-gray-500" },
                { label: "52W Low", val: "1.06130", color: "text-gray-500" },
              ].map((l) => (
                <div key={l.label} className="flex items-center justify-between">
                  <span className="text-gray-400">{l.label}</span>
                  <span className={`font-mono font-medium ${l.color}`}>{l.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-gray-400 shrink-0">{label}</span>
      <span className="text-gray-200 text-right">{value}</span>
    </div>
  );
}

function IndicatorCard({ label, value, note, color }) {
  return (
    <div className="bg-[#0a0e1a] rounded-lg p-3 border border-white/5">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className="text-lg font-bold text-white">{value}</div>
      <div className="text-xs font-medium mt-0.5" style={{ color }}>{note}</div>
    </div>
  );
}
