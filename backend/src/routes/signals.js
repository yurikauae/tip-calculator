const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');
const authMiddleware = require('../middleware/auth');
const { generateSignal } = require('../engine/signalGenerator');
const { getMockCandles, getAvailableSymbols } = require('../data/mockData');

const router = express.Router();

// ------------------------------------------------------------------ Signal cache
// Avoids regenerating signals on every request (60-second TTL).
let signalCache = null;
let signalCacheExpiry = 0;

/**
 * Build signals for all 20 symbols using real candle data from getMockCandles.
 * @param {string} [timeframe='1h']
 * @returns {Array} signals sorted by confidence descending
 */
function buildAllSignals(timeframe = '1h') {
  const symbols = getAvailableSymbols();
  const results = [];

  for (const symbol of symbols) {
    const candles = getMockCandles(symbol, timeframe, 200);
    if (!candles || candles.length < 50) continue;

    try {
      const result = generateSignal(symbol, candles, timeframe);
      results.push({
        symbol,
        ...result,
        generatedAt: new Date().toISOString(),
      });
    } catch (err) {
      // Skip symbols that fail gracefully
    }
  }

  // Sort by confidence descending
  results.sort((a, b) => b.confidence - a.confidence);
  return results;
}

/**
 * Return cached signals or rebuild if stale (60-second TTL).
 * @param {string} [timeframe='1h']
 * @returns {Array}
 */
function getCachedSignals(timeframe = '1h') {
  const now = Date.now();
  if (signalCache && now < signalCacheExpiry) {
    return signalCache;
  }
  signalCache = buildAllSignals(timeframe);
  signalCacheExpiry = now + 60 * 1000; // 60 seconds
  return signalCache;
}

// ------------------------------------------------------------------ GET /api/signals
// Returns signals for ALL 20 symbols, sorted by confidence desc.
router.get('/', authMiddleware, (req, res, next) => {
  try {
    const { timeframe = '1h', direction } = req.query;

    let signals = getCachedSignals(timeframe);

    if (direction && ['buy', 'sell'].includes(direction.toLowerCase())) {
      const dirFilter = direction.toLowerCase();
      // Map signal label to direction
      signals = signals.filter(s => {
        const sig = (s.signal || '').toLowerCase();
        if (dirFilter === 'buy') return sig.includes('buy');
        if (dirFilter === 'sell') return sig.includes('sell');
        return true;
      });
    }

    res.json({
      signals,
      total: signals.length,
      timeframe,
      generatedAt: new Date().toISOString(),
      source: 'mock',
    });
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------------------ GET /api/signals/top?limit=10
// Returns top N signals by confidence.
router.get('/top', authMiddleware, (req, res, next) => {
  try {
    const { limit = '10', timeframe = '1h' } = req.query;
    const n = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);

    const signals = getCachedSignals(timeframe).slice(0, n);

    res.json({
      signals,
      count: signals.length,
      timeframe,
      generatedAt: new Date().toISOString(),
      source: 'mock',
    });
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------------------ GET /api/signals/:symbol
// Generates a signal for a specific symbol using real candle data.
router.get('/:symbol', authMiddleware, (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { timeframe = '1h', save = 'false' } = req.query;
    const normalizedSymbol = symbol.toUpperCase();

    const candles = getMockCandles(normalizedSymbol, timeframe, 200);
    if (!candles) {
      return res.status(404).json({ error: `Symbol "${normalizedSymbol}" not found.` });
    }

    const result = generateSignal(normalizedSymbol, candles, timeframe);
    const now = new Date().toISOString();

    if (save === 'true' && result.signal && result.signal !== 'Wait') {
      const db = getDb();
      db.get('signals').push({
        id: uuidv4(),
        user_id: req.user.userId,
        symbol: normalizedSymbol,
        signal_type: result.signal,
        direction: (result.signal || '').toLowerCase().includes('buy') ? 'buy' : 'sell',
        confidence: result.confidence,
        price_at_signal: result.indicators ? result.indicators.currentPrice : null,
        timeframe,
        indicators: JSON.stringify(result.indicators || {}),
        created_at: now,
        is_active: true,
      }).write();
    }

    res.json({
      symbol: normalizedSymbol,
      timeframe,
      ...result,
      generatedAt: now,
      source: 'mock',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
