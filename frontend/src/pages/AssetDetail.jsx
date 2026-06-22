import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  ArrowLeft, Star, TrendingUp, TrendingDown, Activity, Target, Shield, AlertTriangle
} from 'lucide-react';

// ── helpers ──────────────────────────────────────────────────────────────────

function generateMockCandles(symbol, count = 120) {
  const now = Date.now();
  const interval = 3600 * 1000;
  let price = 40000 + Math.random() * 20000;
  const candles = [];
  for (let i = count; i >= 0; i--) {
    const open = price;
    const change = (Math.random() - 0.48) * price * 0.015;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * price * 0.005;
    const low = Math.min(open, close) - Math.random() * price * 0.005;
    const volume = Math.random() * 1000 + 100;
    candles.push({
      time: new Date(now - i * interval).toISOString(),
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +close.toFixed(2),
      volume: +volume.toFixed(2),
    });
    price = close;
  }
  return candles;
}

function calcEMA(closes, period) {
  if (closes.length < period) return closes.map(() => null);
  const k = 2 / (period + 1);
  const result = new Array(period - 1).fill(null);
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result.push(+ema.toFixed(2));
  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k);
    result.push(+ema.toFixed(2));
  }
  return result;
}

function calcRSI(closes, period = 14) {
  if (closes.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff; else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(diff, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-diff, 0)) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return +(100 - 100 / (1 + rs)).toFixed(2);
}

function formatTime(iso, timeframe) {
  const d = new Date(iso);
  if (timeframe === '1D') return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatPrice(n) {
  if (!n && n !== 0) return '—';
  if (n >= 1000) return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 1) return n.toFixed(4);
  return n.toFixed(6);
}

// ── custom tooltip ────────────────────────────────────────────────────────────

const CandleTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const isUp = d.close >= d.open;
  return (
    <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
      <p style={{ color: '#9ca3af', marginBottom: 4 }}>{d.timeLabel}</p>
      <p style={{ color: isUp ? '#00d4aa' : '#ff4757' }}>O: {formatPrice(d.open)}</p>
      <p style={{ color: isUp ? '#00d4aa' : '#ff4757' }}>H: {formatPrice(d.high)}</p>
      <p style={{ color: isUp ? '#00d4aa' : '#ff4757' }}>L: {formatPrice(d.low)}</p>
      <p style={{ color: isUp ? '#00d4aa' : '#ff4757' }}>C: {formatPrice(d.close)}</p>
    </div>
  );
};

// ── small helper component ────────────────────────────────────────────────────
function Row({ icon, label, color, children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b7280' }}>
        {icon} {label}
      </span>
      <span style={{ fontWeight: 600, color: color || '#fff' }}>{children}</span>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function AssetDetail() {
  const { symbol } = useParams();
  const navigate = useNavigate();

  const [timeframe, setTimeframe] = useState('1h');
  const [candles, setCandles] = useState([]);
  const [signal, setSignal] = useState(null);
  const [priceData, setPriceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inWatchlist, setInWatchlist] = useState(false);

  // ── check watchlist ───────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const wl = JSON.parse(localStorage.getItem('watchlist') || '[]');
      setInWatchlist(wl.includes(symbol?.toUpperCase()));
    } catch { /* ignore */ }
  }, [symbol]);

  // ── fetch candles ─────────────────────────────────────────────────────────
  const fetchCandles = useCallback(async (tf) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/market/assets/${symbol}/candles?timeframe=${tf}`);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setCandles(Array.isArray(data) ? data : data.candles || generateMockCandles(symbol));
    } catch {
      setCandles(generateMockCandles(symbol));
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  // ── fetch signal ──────────────────────────────────────────────────────────
  const fetchSignal = useCallback(async () => {
    try {
      const res = await fetch(`/api/signals/${symbol}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSignal(data);
    } catch {
      setSignal({
        signal: 'LONG',
        confidence: 72,
        entryZone: [null, null],
        sl: null,
        tp1: null,
        tp2: null,
        tp3: null,
        rr: '2.4',
        reason: 'Price is consolidating above key support with bullish EMA crossover. RSI approaching oversold territory indicating potential reversal.',
      });
    }
  }, [symbol]);

  // ── fetch price ───────────────────────────────────────────────────────────
  const fetchPrice = useCallback(async () => {
    try {
      const res = await fetch(`/api/market/assets/${symbol}/price`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPriceData(data);
    } catch {
      setPriceData(null);
    }
  }, [symbol]);

  useEffect(() => {
    fetchCandles(timeframe);
    fetchSignal();
    fetchPrice();
  }, [fetchCandles, fetchSignal, fetchPrice, timeframe]);

  // ── memoized chart data ───────────────────────────────────────────────────
  const chartData = useMemo(() => {
    if (!candles.length) return [];
    const closes = candles.map(c => c.close);
    const ema20 = calcEMA(closes, 20);
    const ema50 = calcEMA(closes, 50);

    return candles.map((c, i) => {
      const isUp = c.close >= c.open;
      const bodyLow = Math.min(c.open, c.close);
      const bodyHigh = Math.max(c.open, c.close);
      return {
        ...c,
        timeLabel: formatTime(c.time, timeframe),
        isUp,
        bodyRange: [bodyLow, bodyHigh],
        bodyColor: isUp ? '#00d4aa' : '#ff4757',
        wickRange: [c.low, c.high],
        ema20: ema20[i],
        ema50: ema50[i],
      };
    });
  }, [candles, timeframe]);

  // ── derived indicators ────────────────────────────────────────────────────
  const indicators = useMemo(() => {
    if (!candles.length) return null;
    const closes = candles.map(c => c.close);
    const rsi = calcRSI(closes);
    const ema20arr = calcEMA(closes, 20);
    const ema50arr = calcEMA(closes, 50);
    const lastClose = closes[closes.length - 1];
    const lastEma20 = ema20arr[ema20arr.length - 1];
    const lastEma50 = ema50arr[ema50arr.length - 1];

    // simple MACD: EMA12 - EMA26
    const ema12arr = calcEMA(closes, 12);
    const ema26arr = calcEMA(closes, 26);
    const macd = ema12arr[ema12arr.length - 1] != null && ema26arr[ema26arr.length - 1] != null
      ? ema12arr[ema12arr.length - 1] - ema26arr[ema26arr.length - 1]
      : null;

    // Bollinger Bands (20, 2)
    let bbPos = null;
    if (closes.length >= 20) {
      const slice = closes.slice(-20);
      const mean = slice.reduce((a, b) => a + b, 0) / 20;
      const std = Math.sqrt(slice.reduce((a, b) => a + (b - mean) ** 2, 0) / 20);
      const upper = mean + 2 * std;
      const lower = mean - 2 * std;
      if (lastClose > upper) bbPos = 'Above Upper';
      else if (lastClose < lower) bbPos = 'Below Lower';
      else {
        const pct = ((lastClose - lower) / (upper - lower) * 100).toFixed(0);
        bbPos = `${pct}% of Band`;
      }
    }

    const emaAlignment = lastClose != null && lastEma20 != null && lastEma50 != null
      ? (lastClose > lastEma20 && lastEma20 > lastEma50 ? 'Bullish' : lastClose < lastEma20 && lastEma20 < lastEma50 ? 'Bearish' : 'Mixed')
      : null;

    return { rsi, macd, bbPos, emaAlignment };
  }, [candles]);

  // ── derived price display ─────────────────────────────────────────────────
  const displayPrice = useMemo(() => {
    if (priceData) return priceData;
    if (!candles.length) return null;
    const last = candles[candles.length - 1];
    const prev = candles[candles.length - 2];
    if (!prev) return { price: last.close, change: 0, changePct: 0 };
    const change = last.close - prev.close;
    const changePct = (change / prev.close) * 100;
    return { price: last.close, change: +change.toFixed(2), changePct: +changePct.toFixed(2) };
  }, [priceData, candles]);

  // ── signal helpers ────────────────────────────────────────────────────────
  const signalWithPrice = useMemo(() => {
    if (!signal || !displayPrice) return signal;
    const p = displayPrice.price;
    return {
      ...signal,
      entryZone: signal.entryZone?.every(Boolean) ? signal.entryZone : [+(p * 0.995).toFixed(2), +(p * 1.002).toFixed(2)],
      sl: signal.sl || +(p * 0.97).toFixed(2),
      tp1: signal.tp1 || +(p * 1.03).toFixed(2),
      tp2: signal.tp2 || +(p * 1.06).toFixed(2),
      tp3: signal.tp3 || +(p * 1.10).toFixed(2),
    };
  }, [signal, displayPrice]);

  // ── actions ───────────────────────────────────────────────────────────────
  const handleWatchlist = () => {
    try {
      const wl = JSON.parse(localStorage.getItem('watchlist') || '[]');
      const sym = symbol.toUpperCase();
      const updated = inWatchlist ? wl.filter(s => s !== sym) : [...wl, sym];
      localStorage.setItem('watchlist', JSON.stringify(updated));
      setInWatchlist(!inWatchlist);
    } catch { /* ignore */ }
  };

  const handlePaperTrade = () => {
    if (!signalWithPrice || !displayPrice) return;
    const params = new URLSearchParams({
      symbol: symbol.toUpperCase(),
      entry: displayPrice.price,
      sl: signalWithPrice.sl || '',
      tp: signalWithPrice.tp1 || '',
    });
    navigate(`/paper-trading?${params.toString()}`);
  };

  // ── render helpers ────────────────────────────────────────────────────────
  const rsiColor = (v) => {
    if (v == null) return '#9ca3af';
    if (v < 40) return '#00d4aa';
    if (v <= 60) return '#ffa502';
    return '#ff4757';
  };

  const signalColor = (s) => {
    if (!s) return '#9ca3af';
    const u = s.toUpperCase();
    if (u === 'LONG' || u === 'BUY') return '#00d4aa';
    if (u === 'SHORT' || u === 'SELL') return '#ff4757';
    return '#ffa502';
  };

  const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1D'];

  // ── chart: custom bar shape for candle body ───────────────────────────────
  const CandleBar = (props) => {
    const { x, y, width, height, payload } = props;
    if (!payload || height == null || isNaN(height) || height <= 0) return null;
    return (
      <rect
        x={x}
        y={y}
        width={Math.max(width - 1, 1)}
        height={Math.max(height, 1)}
        fill={payload.bodyColor}
        opacity={0.9}
      />
    );
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#0a0e1a', color: '#e5e7eb', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #1f2937', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'transparent', border: '1px solid #1f2937', borderRadius: 8, color: '#9ca3af', cursor: 'pointer', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <ArrowLeft size={16} /> Back
        </button>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#fff' }}>
          {symbol?.toUpperCase()}
          <span style={{ fontSize: 14, color: '#6b7280', fontWeight: 400, marginLeft: 8 }}>/ USDT</span>
        </h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <button
            onClick={handleWatchlist}
            style={{
              background: inWatchlist ? '#ffa50222' : 'transparent',
              border: `1px solid ${inWatchlist ? '#ffa502' : '#1f2937'}`,
              borderRadius: 8, color: inWatchlist ? '#ffa502' : '#9ca3af',
              cursor: 'pointer', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13
            }}
          >
            <Star size={15} fill={inWatchlist ? '#ffa502' : 'none'} />
            {inWatchlist ? 'Watching' : 'Add to Watchlist'}
          </button>
          <button
            onClick={handlePaperTrade}
            style={{
              background: '#00d4aa22', border: '1px solid #00d4aa',
              borderRadius: 8, color: '#00d4aa', cursor: 'pointer',
              padding: '8px 16px', fontWeight: 600, fontSize: 13
            }}
          >
            Open Paper Trade
          </button>
        </div>
      </div>

      <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
        {/* Price row */}
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-end', gap: 20 }}>
          <span style={{ fontSize: 38, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
            ${displayPrice ? formatPrice(displayPrice.price) : '—'}
          </span>
          {displayPrice && (
            <>
              <span style={{ color: displayPrice.change >= 0 ? '#00d4aa' : '#ff4757', fontSize: 18, fontWeight: 600 }}>
                {displayPrice.change >= 0 ? '+' : ''}{formatPrice(Math.abs(displayPrice.change))}
              </span>
              <span style={{
                background: displayPrice.changePct >= 0 ? '#00d4aa22' : '#ff475722',
                border: `1px solid ${displayPrice.changePct >= 0 ? '#00d4aa' : '#ff4757'}`,
                color: displayPrice.changePct >= 0 ? '#00d4aa' : '#ff4757',
                borderRadius: 6, padding: '3px 10px', fontSize: 14, fontWeight: 600
              }}>
                {displayPrice.changePct >= 0 ? '+' : ''}{displayPrice.changePct?.toFixed(2)}%
              </span>
            </>
          )}
        </div>

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
          {/* Left column: chart + indicators */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Chart card */}
            <div style={{ background: '#111827', borderRadius: 12, border: '1px solid #1f2937', padding: '20px' }}>
              {/* Timeframe selector */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                {TIMEFRAMES.map(tf => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    style={{
                      padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      background: timeframe === tf ? '#00d4aa22' : 'transparent',
                      border: `1px solid ${timeframe === tf ? '#00d4aa' : '#1f2937'}`,
                      color: timeframe === tf ? '#00d4aa' : '#6b7280',
                    }}
                  >
                    {tf}
                  </button>
                ))}
              </div>

              {loading ? (
                <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563' }}>
                  Loading chart...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis
                      dataKey="timeLabel"
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: '#1f2937' }}
                      interval={Math.floor(chartData.length / 8)}
                    />
                    <YAxis
                      domain={['auto', 'auto']}
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={v => formatPrice(v)}
                      width={72}
                    />
                    <Tooltip content={<CandleTooltip />} />
                    {/* Candle bodies */}
                    <Bar dataKey="bodyRange" shape={<CandleBar />} isAnimationActive={false} />
                    {/* EMA lines */}
                    <Line
                      type="monotone"
                      dataKey="ema20"
                      stroke="#ffa502"
                      strokeWidth={1.5}
                      dot={false}
                      isAnimationActive={false}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="ema50"
                      stroke="#a78bfa"
                      strokeWidth={1.5}
                      dot={false}
                      isAnimationActive={false}
                      connectNulls
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}

              {/* Legend */}
              <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#ffa502' }}>
                  <span style={{ width: 20, height: 2, background: '#ffa502', display: 'inline-block' }} /> EMA 20
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#a78bfa' }}>
                  <span style={{ width: 20, height: 2, background: '#a78bfa', display: 'inline-block' }} /> EMA 50
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#00d4aa' }}>
                  <span style={{ width: 10, height: 10, background: '#00d4aa', display: 'inline-block', borderRadius: 2 }} /> Bullish
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#ff4757' }}>
                  <span style={{ width: 10, height: 10, background: '#ff4757', display: 'inline-block', borderRadius: 2 }} /> Bearish
                </span>
              </div>
            </div>

            {/* Indicator panel */}
            <div style={{ background: '#111827', borderRadius: 12, border: '1px solid #1f2937', padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={16} color="#00d4aa" /> Technical Indicators
              </h3>
              {indicators ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  {/* RSI */}
                  <div style={{ background: '#0a0e1a', borderRadius: 10, padding: '14px 16px', border: '1px solid #1f2937' }}>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>RSI (14)</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: rsiColor(indicators.rsi) }}>
                      {indicators.rsi ?? '—'}
                    </div>
                    <div style={{ fontSize: 12, marginTop: 4, color: rsiColor(indicators.rsi) }}>
                      {indicators.rsi == null ? '—' : indicators.rsi < 30 ? 'Oversold' : indicators.rsi > 70 ? 'Overbought' : indicators.rsi < 40 ? 'Approaching Oversold' : indicators.rsi > 60 ? 'Approaching Overbought' : 'Neutral'}
                    </div>
                    {indicators.rsi != null && (
                      <div style={{ marginTop: 8, height: 4, background: '#1f2937', borderRadius: 2 }}>
                        <div style={{ width: `${indicators.rsi}%`, height: '100%', background: rsiColor(indicators.rsi), borderRadius: 2, transition: 'width 0.3s' }} />
                      </div>
                    )}
                  </div>

                  {/* MACD */}
                  <div style={{ background: '#0a0e1a', borderRadius: 10, padding: '14px 16px', border: '1px solid #1f2937' }}>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>MACD</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: indicators.macd == null ? '#9ca3af' : indicators.macd >= 0 ? '#00d4aa' : '#ff4757' }}>
                      {indicators.macd != null ? (indicators.macd >= 0 ? 'Bullish' : 'Bearish') : '—'}
                    </div>
                    <div style={{ fontSize: 12, marginTop: 4, color: '#6b7280' }}>
                      {indicators.macd != null ? `Value: ${indicators.macd.toFixed(2)}` : ''}
                    </div>
                    {indicators.macd != null && (
                      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {indicators.macd >= 0
                          ? <TrendingUp size={14} color="#00d4aa" />
                          : <TrendingDown size={14} color="#ff4757" />}
                        <span style={{ fontSize: 11, color: indicators.macd >= 0 ? '#00d4aa' : '#ff4757' }}>
                          {indicators.macd >= 0 ? 'EMA12 above EMA26' : 'EMA12 below EMA26'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Bollinger */}
                  <div style={{ background: '#0a0e1a', borderRadius: 10, padding: '14px 16px', border: '1px solid #1f2937' }}>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>Bollinger Bands</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: indicators.bbPos?.includes('Above') ? '#ff4757' : indicators.bbPos?.includes('Below') ? '#00d4aa' : '#ffa502' }}>
                      {indicators.bbPos ?? '—'}
                    </div>
                    <div style={{ fontSize: 12, marginTop: 4, color: '#6b7280' }}>20-period, 2σ</div>
                  </div>

                  {/* EMA Alignment */}
                  <div style={{ background: '#0a0e1a', borderRadius: 10, padding: '14px 16px', border: '1px solid #1f2937' }}>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>EMA Alignment</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: indicators.emaAlignment === 'Bullish' ? '#00d4aa' : indicators.emaAlignment === 'Bearish' ? '#ff4757' : '#ffa502' }}>
                      {indicators.emaAlignment ?? '—'}
                    </div>
                    <div style={{ fontSize: 12, marginTop: 4, color: '#6b7280' }}>Price / EMA20 / EMA50</div>
                  </div>
                </div>
              ) : (
                <div style={{ color: '#4b5563', textAlign: 'center', padding: '20px 0' }}>No indicator data</div>
              )}
            </div>
          </div>

          {/* Right column: signal card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {signalWithPrice && (
              <div style={{ background: '#111827', borderRadius: 12, border: '1px solid #1f2937', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#fff' }}>Signal</h3>
                  <span style={{
                    background: signalColor(signalWithPrice.signal) + '22',
                    border: `1px solid ${signalColor(signalWithPrice.signal)}`,
                    color: signalColor(signalWithPrice.signal),
                    borderRadius: 6, padding: '4px 12px', fontWeight: 700, fontSize: 13
                  }}>
                    {signalWithPrice.signal?.toUpperCase() ?? '—'}
                  </span>
                </div>

                {/* Confidence */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#9ca3af', marginBottom: 6 }}>
                    <span>Confidence</span>
                    <span style={{ fontWeight: 700, color: '#fff' }}>{signalWithPrice.confidence ?? 0}%</span>
                  </div>
                  <div style={{ height: 6, background: '#1f2937', borderRadius: 3 }}>
                    <div style={{
                      width: `${signalWithPrice.confidence ?? 0}%`, height: '100%',
                      background: `linear-gradient(90deg, #00d4aa, ${(signalWithPrice.confidence ?? 0) > 70 ? '#00d4aa' : '#ffa502'})`,
                      borderRadius: 3, transition: 'width 0.4s'
                    }} />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Row icon={<Target size={14} color="#ffa502" />} label="Entry Zone" color="#ffa502">
                    {signalWithPrice.entryZone?.every(Boolean)
                      ? `$${formatPrice(signalWithPrice.entryZone[0])} – $${formatPrice(signalWithPrice.entryZone[1])}`
                      : '—'}
                  </Row>

                  <Row icon={<Shield size={14} color="#ff4757" />} label="Stop Loss" color="#ff4757">
                    {signalWithPrice.sl ? `$${formatPrice(signalWithPrice.sl)}` : '—'}
                  </Row>

                  <Row icon={<TrendingUp size={14} color="#00d4aa" />} label="TP1" color="#00d4aa">
                    {signalWithPrice.tp1 ? `$${formatPrice(signalWithPrice.tp1)}` : '—'}
                  </Row>
                  <Row icon={<TrendingUp size={14} color="#00d4aa" />} label="TP2" color="#00d4aa">
                    {signalWithPrice.tp2 ? `$${formatPrice(signalWithPrice.tp2)}` : '—'}
                  </Row>
                  <Row icon={<TrendingUp size={14} color="#00d4aa" />} label="TP3" color="#00d4aa">
                    {signalWithPrice.tp3 ? `$${formatPrice(signalWithPrice.tp3)}` : '—'}
                  </Row>

                  <div style={{ borderTop: '1px solid #1f2937', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>Risk : Reward</span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#a78bfa' }}>1 : {signalWithPrice.rr ?? '—'}</span>
                  </div>
                </div>

                {signalWithPrice.reason && (
                  <div style={{ marginTop: 16, background: '#0a0e1a', borderRadius: 8, padding: '12px 14px', border: '1px solid #1f2937' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <AlertTriangle size={13} color="#ffa502" />
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#ffa502' }}>Analysis</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: '#9ca3af', lineHeight: 1.6 }}>
                      {signalWithPrice.reason}
                    </p>
                  </div>
                )}

                <button
                  onClick={handlePaperTrade}
                  style={{
                    marginTop: 18, width: '100%', padding: '12px', borderRadius: 8,
                    background: 'linear-gradient(135deg, #00d4aa22, #00d4aa11)',
                    border: '1px solid #00d4aa', color: '#00d4aa', fontWeight: 700,
                    fontSize: 14, cursor: 'pointer'
                  }}
                >
                  Open Paper Trade
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
