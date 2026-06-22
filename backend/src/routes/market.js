const express = require('express');
const authMiddleware = require('../middleware/auth');
const { getMockCandles, getCurrentPrice, getAvailableSymbols } = require('../data/mockData');
const { getAllAssets, getAssetInfo, getSymbolsByCategory, CATEGORIES } = require('../data/assetInfo');

const router = express.Router();

// Valid timeframes supported by getMockCandles
const VALID_TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1D', '1d'];

// GET /api/market/search?q=term
// Alias kept for the frontend search box.
router.get('/search', authMiddleware, (req, res) => {
  const term = String(req.query.q || '').trim().toLowerCase();
  const results = getAllAssets()
    .filter(info =>
      !term ||
      info.symbol.toLowerCase().includes(term) ||
      info.name.toLowerCase().includes(term)
    )
    .slice(0, 10)
    .map(info => ({
      symbol: info.symbol,
      name: info.name,
      category: info.category,
      exchange: info.category,
      price: getCurrentPrice(info.symbol),
      source: 'mock',
    }));
  res.json({ results, source: 'mock', warning: 'Synthetic demo prices only.' });
});

// ------------------------------------------------------------------ GET /assets
// Returns all 20 symbols from assetInfo with current price from mockData.
router.get('/assets', authMiddleware, (req, res, next) => {
  try {
    const assets = getAllAssets().map(info => {
      const price = getCurrentPrice(info.symbol);
      return {
        symbol: info.symbol,
        name: info.name,
        category: info.category,
        price: price !== null ? price : null,
      };
    });

    res.json({
      assets,
      count: assets.length,
      source: 'mock',
    });
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------------------ GET /assets/search?q=term
router.get('/assets/search', authMiddleware, (req, res, next) => {
  try {
    const { q = '' } = req.query;
    if (!q.trim()) {
      return res.status(400).json({ error: 'Query parameter "q" is required.' });
    }
    const term = q.toLowerCase();
    const results = getAllAssets()
      .filter(
        info =>
          info.symbol.toLowerCase().includes(term) ||
          info.name.toLowerCase().includes(term)
      )
      .map(info => ({
        symbol: info.symbol,
        name: info.name,
        category: info.category,
        price: getCurrentPrice(info.symbol),
      }));

    res.json({ results, count: results.length });
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------------------ GET /assets/categories/:category
router.get('/assets/categories/:category', authMiddleware, (req, res, next) => {
  try {
    const { category } = req.params;

    // Accept both raw category keys (FOREX) and display names (Forex)
    const normalizedInput = category.toLowerCase();
    const categoryMap = {};
    for (const [key, label] of Object.entries(CATEGORIES)) {
      categoryMap[key.toLowerCase()] = label;
      categoryMap[label.toLowerCase()] = label;
    }

    const resolvedCategory = categoryMap[normalizedInput];
    if (!resolvedCategory) {
      const validValues = [...new Set(Object.values(categoryMap))];
      return res.status(400).json({
        error: `Unknown category "${category}". Valid values: ${validValues.join(', ')}`,
      });
    }

    const assets = getAllAssets()
      .filter(info => info.category === resolvedCategory)
      .map(info => ({
        symbol: info.symbol,
        name: info.name,
        category: info.category,
        price: getCurrentPrice(info.symbol),
      }));

    res.json({ category: resolvedCategory, assets, count: assets.length });
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------------------ GET /assets/:symbol/price
router.get('/assets/:symbol/price', authMiddleware, (req, res, next) => {
  try {
    const { symbol } = req.params;
    const normalizedSymbol = symbol.toUpperCase();

    const candles = getMockCandles(normalizedSymbol, '1h', 2);
    if (!candles || candles.length === 0) {
      return res.status(404).json({ error: `Symbol "${normalizedSymbol}" not found.` });
    }

    const latest = candles[candles.length - 1];
    const previous = candles.length > 1 ? candles[candles.length - 2] : latest;

    const price = latest.close;
    const previousClose = previous.close;
    const change = price - previousClose;
    const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;

    // Fetch the full day of 1h candles for high/low
    const dayCandles = getMockCandles(normalizedSymbol, '1h', 24) || [];
    const high24h = dayCandles.length > 0 ? Math.max(...dayCandles.map(c => c.high)) : latest.high;
    const low24h = dayCandles.length > 0 ? Math.min(...dayCandles.map(c => c.low)) : latest.low;

    res.json({
      symbol: normalizedSymbol,
      price: +price.toFixed(6),
      previousClose: +previousClose.toFixed(6),
      change: +change.toFixed(6),
      changePercent: +changePercent.toFixed(4),
      high24h: +high24h.toFixed(6),
      low24h: +low24h.toFixed(6),
      timestamp: latest.timestamp,
      source: 'mock',
    });
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------------------ GET /assets/:symbol/candles
router.get('/assets/:symbol/candles', authMiddleware, (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { timeframe = '1h', count = '100' } = req.query;
    const normalizedSymbol = symbol.toUpperCase();

    if (!VALID_TIMEFRAMES.includes(timeframe)) {
      return res.status(400).json({
        error: `Invalid timeframe "${timeframe}". Must be one of: ${VALID_TIMEFRAMES.join(', ')}`,
      });
    }

    const parsedCount = Math.min(Math.max(parseInt(count, 10) || 100, 1), 500);
    const candles = getMockCandles(normalizedSymbol, timeframe, parsedCount);

    if (!candles) {
      return res.status(404).json({ error: `Symbol "${normalizedSymbol}" not found.` });
    }

    res.json({
      symbol: normalizedSymbol,
      timeframe,
      candles,
      count: candles.length,
      source: 'mock',
    });
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------------------ GET /assets/:symbol/overview
router.get('/assets/:symbol/overview', authMiddleware, (req, res, next) => {
  try {
    const { symbol } = req.params;
    const normalizedSymbol = symbol.toUpperCase();

    const info = getAssetInfo(normalizedSymbol);
    if (!info) {
      return res.status(404).json({ error: `Symbol "${normalizedSymbol}" not found.` });
    }

    const candles = getMockCandles(normalizedSymbol, '1h', 500) || [];
    const latest = candles[candles.length - 1];
    const yearCandles = candles; // all 500 are roughly 20 days of 1h data

    const high52w = yearCandles.length > 0 ? Math.max(...yearCandles.map(c => c.high)) : null;
    const low52w = yearCandles.length > 0 ? Math.min(...yearCandles.map(c => c.low)) : null;
    const avgVolume = yearCandles.length > 0
      ? Math.round(yearCandles.reduce((s, c) => s + c.volume, 0) / yearCandles.length)
      : null;

    res.json({
      symbol: normalizedSymbol,
      name: info.name,
      category: info.category,
      price: latest ? +latest.close.toFixed(6) : null,
      open: latest ? +latest.open.toFixed(6) : null,
      high: latest ? +latest.high.toFixed(6) : null,
      low: latest ? +latest.low.toFixed(6) : null,
      volume: latest ? latest.volume : null,
      high52w: high52w !== null ? +high52w.toFixed(6) : null,
      low52w: low52w !== null ? +low52w.toFixed(6) : null,
      avgVolume,
      pipValue: info.pipValue,
      pipSize: info.pipSize,
      typicalSpread: info.typicalSpread,
      maxLeverage: info.maxLeverage,
      sessionNote: info.sessionNote,
      source: 'mock',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
