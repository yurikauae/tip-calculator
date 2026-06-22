/**
 * Mock OHLCV candle data for 20 trading symbols.
 * Generated via seeded random walk from realistic base prices.
 * Each symbol has 500 candles at 1h timeframe, anchored to current date.
 *
 * This data is synthetic and for development/demonstration only.
 */

/**
 * Seeded pseudo-random number generator (mulberry32).
 * @param {number} seed
 * @returns {function(): number} - returns float in [0, 1)
 */
function createRng(seed) {
  let s = seed >>> 0;
  return function () {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Determine decimal precision based on price magnitude.
 * @param {number} price
 * @returns {number}
 */
function getPrecision(price) {
  if (price < 1) return 5;
  if (price < 10) return 4;
  if (price < 100) return 3;
  if (price < 1000) return 2;
  return 1;
}

/**
 * Generate 500 realistic OHLCV 1h candles using a biased random walk.
 * The most recent candle timestamp is anchored to the current date so
 * data always appears fresh relative to today.
 *
 * @param {number} basePrice - Starting price
 * @param {number} volatility - Typical candle range as fraction of price (e.g. 0.002)
 * @param {number} seed - RNG seed for reproducibility
 * @param {number} drift - Slight directional bias (-1 to 1)
 * @returns {Array} candles [{timestamp, open, high, low, close, volume}]
 */
function generateCandles(basePrice, volatility, seed, drift = 0) {
  const rng = createRng(seed);
  const NUM_CANDLES = 500;
  const hourMs = 3600000;

  // Anchor the most recent candle to "now" (truncated to the current hour).
  const now = Date.now();
  const latestHour = now - (now % hourMs);
  const startTime = latestHour - (NUM_CANDLES - 1) * hourMs;

  const candles = [];
  let price = basePrice;
  const precision = getPrecision(basePrice);

  for (let i = 0; i < NUM_CANDLES; i++) {
    // Box-Muller transform for normally distributed moves
    const u1 = Math.max(rng(), 1e-10);
    const u2 = rng();
    const normal = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

    const move = price * volatility * normal + price * volatility * 0.05 * drift;
    const open = price;
    price = Math.max(price + move, basePrice * 0.3); // floor at 30% of base price

    const range = price * volatility * (0.5 + rng() * 1.5);
    const high = Math.max(open, price) + range * rng() * 0.5;
    const low = Math.min(open, price) - range * rng() * 0.5;
    const close = price;

    // Volume: higher on big moves (correlates with price volatility)
    const baseVol = 1000 + rng() * 9000;
    const volMultiplier = 1 + Math.abs(normal) * 2;
    const volume = Math.round(baseVol * volMultiplier);

    candles.push({
      timestamp: new Date(startTime + i * hourMs).toISOString(),
      open: +open.toFixed(precision),
      high: +high.toFixed(precision),
      low: +Math.max(low, open * 0.7).toFixed(precision),
      close: +close.toFixed(precision),
      volume,
    });
  }

  return candles;
}

/**
 * Aggregate 1h base candles into a higher timeframe.
 * @param {Array} hourlyCandles
 * @param {number} factor - number of 1h candles per target candle
 * @returns {Array}
 */
function aggregateCandles(hourlyCandles, factor) {
  if (factor <= 1) return hourlyCandles;
  const result = [];
  for (let i = 0; i + factor <= hourlyCandles.length; i += factor) {
    const slice = hourlyCandles.slice(i, i + factor);
    const open = slice[0].open;
    const close = slice[slice.length - 1].close;
    const high = Math.max(...slice.map(c => c.high));
    const low = Math.min(...slice.map(c => c.low));
    const volume = slice.reduce((sum, c) => sum + c.volume, 0);
    result.push({ timestamp: slice[0].timestamp, open, high, low, close, volume });
  }
  return result;
}

/**
 * Timeframe to 1h candle aggregation factor.
 */
const TIMEFRAME_FACTORS = {
  '1m': 1,   // 1m not aggregatable from 1h; return 1h as fallback
  '5m': 1,   // same
  '15m': 1,  // same
  '1h': 1,
  '4h': 4,
  '1D': 24,
  '1d': 24,
};

/**
 * Symbol configurations: [basePrice, volatility, seed, drift]
 * Drift: positive = slight upward bias, negative = downward bias
 * Base prices reflect approximate market levels as of mid-2024.
 */
const SYMBOL_CONFIG = {
  // Forex
  EURUSD:  [1.0850,  0.0015, 101,  0.1],
  GBPUSD:  [1.2700,  0.0018, 102, -0.1],
  USDJPY:  [149.50,  0.0012, 103,  0.2],
  AUDUSD:  [0.6550,  0.0017, 104, -0.05],
  USDCAD:  [1.3600,  0.0013, 105,  0.05],

  // Crypto
  BTCUSD:  [67000,   0.018,  201,  0.3],
  ETHUSD:  [3500,    0.02,   202,  0.25],
  BNBUSD:  [580,     0.022,  203,  0.1],
  SOLUSD:  [170,     0.025,  204,  0.4],
  XRPUSD:  [0.5800,  0.023,  205,  0.15],

  // Indices
  SPX500:  [5200,    0.009,  301,  0.15],
  NAS100:  [18200,   0.011,  302,  0.2],
  DOW30:   [39500,   0.008,  303,  0.1],
  FTSE100: [8200,    0.007,  304, -0.05],
  DAX40:   [18400,   0.009,  305,  0.1],

  // Commodities
  XAUUSD:  [2330,    0.007,  401,  0.1],
  XAGUSD:  [28.5,    0.012,  402,  0.05],
  USOIL:   [79.0,    0.015,  403, -0.1],
  UKOIL:   [83.5,    0.014,  404, -0.08],
  NATGAS:  [2.65,    0.025,  405, -0.2],
};

/**
 * Pre-generated 1h candle data for all symbols (deterministic per seed).
 */
const mockCandles = {};

for (const [symbol, [basePrice, volatility, seed, drift]] of Object.entries(SYMBOL_CONFIG)) {
  mockCandles[symbol] = generateCandles(basePrice, volatility, seed, drift);
}

/**
 * Get candles for a specific symbol with optional timeframe aggregation.
 *
 * Supported timeframes: 1m, 5m, 15m (treated as 1h since base is 1h),
 * 1h (default), 4h, 1D/1d.
 *
 * @param {string} symbol
 * @param {string} [timeframe='1h']
 * @param {number} [count=100] - Number of most recent candles to return
 * @returns {Array|null}
 */
function getMockCandles(symbol, timeframe = '1h', count = 100) {
  const upper = symbol.toUpperCase();
  const base = mockCandles[upper];
  if (!base) return null;

  const factor = TIMEFRAME_FACTORS[timeframe] || 1;
  const aggregated = aggregateCandles(base, factor);

  const safeCount = Math.min(count, aggregated.length);
  return aggregated.slice(-safeCount);
}

/**
 * Get the most recent closing price for a symbol.
 * @param {string} symbol
 * @returns {number|null}
 */
function getCurrentPrice(symbol) {
  const candles = getMockCandles(symbol, '1h', 1);
  if (!candles || candles.length === 0) return null;
  return candles[candles.length - 1].close;
}

/**
 * Get a list of all available symbols.
 * @returns {string[]}
 */
function getAvailableSymbols() {
  return Object.keys(mockCandles);
}

// Legacy alias kept for backwards compatibility
function getCandles(symbol, limit = 200) {
  return getMockCandles(symbol, '1h', limit);
}

module.exports = {
  mockCandles,
  getMockCandles,
  getCandles,
  getCurrentPrice,
  getAvailableSymbols,
  SYMBOL_CONFIG,
};
