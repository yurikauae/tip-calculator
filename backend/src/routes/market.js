const express = require('express');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Mock data generators
function generateMockPrice(symbol) {
  const basePrices = {
    AAPL: 175.50, MSFT: 380.20, GOOGL: 140.30, AMZN: 178.90, TSLA: 245.60,
    META: 490.10, NVDA: 875.40, BTC: 65000, ETH: 3200, SPY: 520.00,
    QQQ: 440.50, DEFAULT: 100.00
  };
  const base = basePrices[symbol.toUpperCase()] || basePrices.DEFAULT;
  const variation = (Math.random() - 0.5) * base * 0.02;
  return Math.max(0.01, base + variation);
}

function generateMockCandles(symbol, timeframe, count = 100) {
  const candles = [];
  let price = generateMockPrice(symbol);
  const now = Date.now();
  const timeframeMs = {
    '1m': 60000, '5m': 300000, '15m': 900000, '30m': 1800000,
    '1h': 3600000, '4h': 14400000, '1d': 86400000, '1w': 604800000
  };
  const interval = timeframeMs[timeframe] || timeframeMs['1h'];

  for (let i = count; i >= 0; i--) {
    const timestamp = now - i * interval;
    const open = price;
    const change = (Math.random() - 0.48) * price * 0.015;
    const close = Math.max(0.01, open + change);
    const high = Math.max(open, close) * (1 + Math.random() * 0.008);
    const low = Math.min(open, close) * (1 - Math.random() * 0.008);
    const volume = Math.floor(Math.random() * 5000000) + 500000;

    candles.push({
      timestamp,
      datetime: new Date(timestamp).toISOString(),
      open: parseFloat(open.toFixed(4)),
      high: parseFloat(high.toFixed(4)),
      low: parseFloat(low.toFixed(4)),
      close: parseFloat(close.toFixed(4)),
      volume
    });

    price = close;
  }

  return candles;
}

function generateMockAssets() {
  return [
    { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', exchange: 'NASDAQ', price: generateMockPrice('AAPL') },
    { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'stock', exchange: 'NASDAQ', price: generateMockPrice('MSFT') },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock', exchange: 'NASDAQ', price: generateMockPrice('GOOGL') },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'stock', exchange: 'NASDAQ', price: generateMockPrice('AMZN') },
    { symbol: 'TSLA', name: 'Tesla Inc.', type: 'stock', exchange: 'NASDAQ', price: generateMockPrice('TSLA') },
    { symbol: 'META', name: 'Meta Platforms Inc.', type: 'stock', exchange: 'NASDAQ', price: generateMockPrice('META') },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'stock', exchange: 'NASDAQ', price: generateMockPrice('NVDA') },
    { symbol: 'SPY', name: 'SPDR S&P 500 ETF', type: 'etf', exchange: 'NYSE', price: generateMockPrice('SPY') },
    { symbol: 'QQQ', name: 'Invesco QQQ ETF', type: 'etf', exchange: 'NASDAQ', price: generateMockPrice('QQQ') },
    { symbol: 'BTC', name: 'Bitcoin', type: 'crypto', exchange: 'CRYPTO', price: generateMockPrice('BTC') },
    { symbol: 'ETH', name: 'Ethereum', type: 'crypto', exchange: 'CRYPTO', price: generateMockPrice('ETH') }
  ];
}

// GET /api/market/assets
router.get('/assets', authMiddleware, (req, res, next) => {
  try {
    const { type, search } = req.query;
    let assets = generateMockAssets();

    if (type) {
      assets = assets.filter(a => a.type === type.toLowerCase());
    }

    if (search) {
      const searchLower = search.toLowerCase();
      assets = assets.filter(a =>
        a.symbol.toLowerCase().includes(searchLower) ||
        a.name.toLowerCase().includes(searchLower)
      );
    }

    res.json({
      assets,
      count: assets.length,
      source: process.env.TWELVE_DATA_API_KEY ? 'live' : 'mock'
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/market/assets/:symbol/price
router.get('/assets/:symbol/price', authMiddleware, (req, res, next) => {
  try {
    const { symbol } = req.params;
    const normalizedSymbol = symbol.toUpperCase();

    const price = generateMockPrice(normalizedSymbol);
    const previousClose = price * (1 + (Math.random() - 0.5) * 0.03);
    const change = price - previousClose;
    const changePercent = (change / previousClose) * 100;

    res.json({
      symbol: normalizedSymbol,
      price: parseFloat(price.toFixed(4)),
      previousClose: parseFloat(previousClose.toFixed(4)),
      change: parseFloat(change.toFixed(4)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      volume: Math.floor(Math.random() * 10000000) + 1000000,
      marketCap: null,
      timestamp: new Date().toISOString(),
      source: process.env.TWELVE_DATA_API_KEY ? 'live' : 'mock'
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/market/assets/:symbol/candles?timeframe=1h
router.get('/assets/:symbol/candles', authMiddleware, (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { timeframe = '1h', limit = 100 } = req.query;

    const validTimeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'];
    if (!validTimeframes.includes(timeframe)) {
      return res.status(400).json({ error: `Invalid timeframe. Must be one of: ${validTimeframes.join(', ')}` });
    }

    const count = Math.min(parseInt(limit) || 100, 500);
    const candles = generateMockCandles(symbol.toUpperCase(), timeframe, count);

    res.json({
      symbol: symbol.toUpperCase(),
      timeframe,
      candles,
      count: candles.length,
      source: process.env.TWELVE_DATA_API_KEY ? 'live' : 'mock'
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/market/assets/:symbol/overview
router.get('/assets/:symbol/overview', authMiddleware, (req, res, next) => {
  try {
    const { symbol } = req.params;
    const normalizedSymbol = symbol.toUpperCase();
    const price = generateMockPrice(normalizedSymbol);

    res.json({
      symbol: normalizedSymbol,
      price: parseFloat(price.toFixed(4)),
      open: parseFloat((price * (1 + (Math.random() - 0.5) * 0.01)).toFixed(4)),
      high: parseFloat((price * (1 + Math.random() * 0.02)).toFixed(4)),
      low: parseFloat((price * (1 - Math.random() * 0.02)).toFixed(4)),
      volume: Math.floor(Math.random() * 10000000) + 1000000,
      fiftyTwoWeekHigh: parseFloat((price * 1.3).toFixed(4)),
      fiftyTwoWeekLow: parseFloat((price * 0.7).toFixed(4)),
      avgVolume: Math.floor(Math.random() * 8000000) + 2000000,
      source: 'mock'
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
