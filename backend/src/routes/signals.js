const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Signal generation engine
function generateSignals(symbol, candles) {
  const signals = [];
  if (!candles || candles.length < 20) return { signals, indicators: {} };

  const closes = candles.map(c => c.close);
  const volumes = candles.map(c => c.volume);
  const latestPrice = closes[closes.length - 1];
  const latestVolume = volumes[volumes.length - 1];

  function sma(data, period) {
    if (data.length < period) return null;
    const slice = data.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / period;
  }

  function ema(data, period) {
    if (data.length < period) return null;
    const k = 2 / (period + 1);
    let emaVal = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < data.length; i++) {
      emaVal = data[i] * k + emaVal * (1 - k);
    }
    return emaVal;
  }

  function rsi(data, period = 14) {
    if (data.length < period + 1) return null;
    const changes = [];
    for (let i = 1; i < data.length; i++) {
      changes.push(data[i] - data[i - 1]);
    }
    const gains = changes.map(c => c > 0 ? c : 0);
    const losses = changes.map(c => c < 0 ? Math.abs(c) : 0);
    const recentGains = gains.slice(-period);
    const recentLosses = losses.slice(-period);
    const avgGain = recentGains.reduce((a, b) => a + b, 0) / period;
    const avgLoss = recentLosses.reduce((a, b) => a + b, 0) / period;
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  function macd(data) {
    const ema12 = ema(data, 12);
    const ema26 = ema(data, 26);
    if (!ema12 || !ema26) return null;
    return { macdLine: ema12 - ema26, ema12, ema26 };
  }

  function bollingerBands(data, period = 20, multiplier = 2) {
    const smaVal = sma(data, period);
    if (!smaVal) return null;
    const slice = data.slice(-period);
    const variance = slice.reduce((acc, val) => acc + Math.pow(val - smaVal, 2), 0) / period;
    const stdDev = Math.sqrt(variance);
    return {
      upper: smaVal + multiplier * stdDev,
      middle: smaVal,
      lower: smaVal - multiplier * stdDev
    };
  }

  const sma20 = sma(closes, 20);
  const sma50 = sma(closes, 50);
  const ema9 = ema(closes, 9);
  const ema21 = ema(closes, 21);
  const rsiVal = rsi(closes);
  const macdVal = macd(closes);
  const bbVal = bollingerBands(closes);
  const avgVolume = sma(volumes, 20);

  const indicators = {
    sma20, sma50, ema9, ema21,
    rsi: rsiVal ? parseFloat(rsiVal.toFixed(2)) : null,
    macd: macdVal,
    bollingerBands: bbVal,
    currentPrice: latestPrice,
    volumeRatio: avgVolume ? parseFloat((latestVolume / avgVolume).toFixed(2)) : null
  };

  if (rsiVal !== null) {
    if (rsiVal < 30) {
      signals.push({
        type: 'RSI_OVERSOLD',
        direction: 'buy',
        strength: Math.min(1, (30 - rsiVal) / 30),
        description: `RSI is oversold at ${rsiVal.toFixed(1)}`,
        indicator: 'RSI'
      });
    } else if (rsiVal > 70) {
      signals.push({
        type: 'RSI_OVERBOUGHT',
        direction: 'sell',
        strength: Math.min(1, (rsiVal - 70) / 30),
        description: `RSI is overbought at ${rsiVal.toFixed(1)}`,
        indicator: 'RSI'
      });
    }
  }

  if (sma20 && sma50) {
    const prevSma20 = sma(closes.slice(0, -1), 20);
    const prevSma50 = sma(closes.slice(0, -1), 50);
    if (prevSma20 && prevSma50) {
      if (prevSma20 <= prevSma50 && sma20 > sma50) {
        signals.push({
          type: 'SMA_GOLDEN_CROSS',
          direction: 'buy',
          strength: 0.8,
          description: 'SMA20 crossed above SMA50 (Golden Cross)',
          indicator: 'SMA'
        });
      } else if (prevSma20 >= prevSma50 && sma20 < sma50) {
        signals.push({
          type: 'SMA_DEATH_CROSS',
          direction: 'sell',
          strength: 0.8,
          description: 'SMA20 crossed below SMA50 (Death Cross)',
          indicator: 'SMA'
        });
      }
    }
  }

  if (sma20) {
    if (latestPrice > sma20 * 1.02) {
      signals.push({
        type: 'PRICE_ABOVE_SMA20',
        direction: 'buy',
        strength: 0.5,
        description: `Price ${((latestPrice / sma20 - 1) * 100).toFixed(1)}% above SMA20`,
        indicator: 'SMA'
      });
    } else if (latestPrice < sma20 * 0.98) {
      signals.push({
        type: 'PRICE_BELOW_SMA20',
        direction: 'sell',
        strength: 0.5,
        description: `Price ${((1 - latestPrice / sma20) * 100).toFixed(1)}% below SMA20`,
        indicator: 'SMA'
      });
    }
  }

  if (bbVal) {
    if (latestPrice <= bbVal.lower) {
      signals.push({
        type: 'BB_LOWER_TOUCH',
        direction: 'buy',
        strength: 0.7,
        description: 'Price touching lower Bollinger Band',
        indicator: 'Bollinger Bands'
      });
    } else if (latestPrice >= bbVal.upper) {
      signals.push({
        type: 'BB_UPPER_TOUCH',
        direction: 'sell',
        strength: 0.7,
        description: 'Price touching upper Bollinger Band',
        indicator: 'Bollinger Bands'
      });
    }
  }

  if (avgVolume && latestVolume > avgVolume * 1.5) {
    const priceChange = closes[closes.length - 1] - closes[closes.length - 2];
    signals.push({
      type: 'VOLUME_SPIKE',
      direction: priceChange >= 0 ? 'buy' : 'sell',
      strength: Math.min(1, latestVolume / avgVolume / 3),
      description: `Volume spike ${((latestVolume / avgVolume - 1) * 100).toFixed(0)}% above average`,
      indicator: 'Volume'
    });
  }

  return { signals, indicators };
}

function generateMockCandles(symbol, count = 100) {
  const candles = [];
  let price = 100 + Math.random() * 400;
  const now = Date.now();

  for (let i = count; i >= 0; i--) {
    const open = price;
    const change = (Math.random() - 0.48) * price * 0.015;
    const close = Math.max(0.01, open + change);
    const high = Math.max(open, close) * (1 + Math.random() * 0.008);
    const low = Math.min(open, close) * (1 - Math.random() * 0.008);
    const volume = Math.floor(Math.random() * 5000000) + 500000;
    candles.push({ timestamp: now - i * 3600000, open, high, low, close, volume });
    price = close;
  }

  return candles;
}

// GET /api/signals
router.get('/', authMiddleware, (req, res, next) => {
  try {
    const db = getDb();
    const { limit = 20, offset = 0, symbol, direction } = req.query;

    let userSignals = db.get('signals').filter({ user_id: req.user.userId }).value();

    if (symbol) {
      userSignals = userSignals.filter(s => s.symbol === symbol.toUpperCase());
    }

    if (direction && ['buy', 'sell'].includes(direction.toLowerCase())) {
      userSignals = userSignals.filter(s => s.direction === direction.toLowerCase());
    }

    // Sort by created_at DESC
    userSignals.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const total = userSignals.length;
    const paginated = userSignals.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.json({
      signals: paginated.map(s => ({
        ...s,
        indicators: s.indicators && typeof s.indicators === 'string' ? JSON.parse(s.indicators) : s.indicators
      })),
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/signals/:symbol
router.get('/:symbol', authMiddleware, (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { timeframe = '1h', save = 'false' } = req.query;
    const normalizedSymbol = symbol.toUpperCase();

    const candles = generateMockCandles(normalizedSymbol, 100);
    const { signals, indicators } = generateSignals(normalizedSymbol, candles);

    const now = new Date().toISOString();

    if (save === 'true' && signals.length > 0) {
      const db = getDb();
      for (const signal of signals) {
        db.get('signals').push({
          id: uuidv4(),
          user_id: req.user.userId,
          symbol: normalizedSymbol,
          signal_type: signal.type,
          direction: signal.direction,
          strength: parseFloat(signal.strength.toFixed(4)),
          price_at_signal: indicators.currentPrice,
          timeframe,
          indicators: JSON.stringify(indicators),
          created_at: now,
          is_active: true
        }).write();
      }
    }

    const buySignals = signals.filter(s => s.direction === 'buy').length;
    const sellSignals = signals.filter(s => s.direction === 'sell').length;
    let sentiment = 'neutral';
    if (buySignals > sellSignals) sentiment = 'bullish';
    else if (sellSignals > buySignals) sentiment = 'bearish';

    res.json({
      symbol: normalizedSymbol,
      timeframe,
      currentPrice: indicators.currentPrice,
      sentiment,
      signalCount: signals.length,
      signals,
      indicators,
      generatedAt: now
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
