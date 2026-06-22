/**
 * Mock OHLCV candle data for 20 trading symbols.
 * Generated via seeded random walk from realistic base prices.
 * Each symbol has 200 candles at 1h timeframe.
 *
 * This data is synthetic and for development/demonstration only.
 */

/**
 * Seeded pseudo-random number generator (mulberry32).
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
 * Generate 200 realistic OHLCV candles using a biased random walk.
 *
 * @param {number} basePrice - Starting price
 * @param {number} volatility - Typical candle range as fraction of price (e.g. 0.002)
 * @param {number} seed - RNG seed for reproducibility
 * @param {number} drift - Slight directional bias (-1 to 1)
 * @returns {Array} candles
 */
function generateCandles(basePrice, volatility, seed, drift = 0) {
  const rng = createRng(seed);
  const candles = [];
  let price = basePrice;
  const startTime = new Date('2024-01-01T00:00:00Z').getTime();
  const hourMs = 3600000;

  for (let i = 0; i < 200; i++) {
    // Box-Muller transform for normally distributed moves
    const u1 = rng();
    const u2 = rng();
    const normal = Math.sqrt(-2 * Math.log(u1 + 0.0001)) * Math.cos(2 * Math.PI * u2);

    const move = price * volatility * normal + price * volatility * 0.05 * drift;
    const open = price;
    price = Math.max(price + move, price * 0.5); // floor at 50% of base

    const range = price * volatility * (0.5 + rng() * 1.5);
    const isUp = price >= open;

    const high = Math.max(open, price) + range * rng() * 0.5;
    const low = Math.min(open, price) - range * rng() * 0.5;
    const close = price;

    // Volume: higher on big moves
    const baseVol = 1000 + rng() * 9000;
    const volMultiplier = 1 + Math.abs(normal) * 2;
    const volume = Math.round(baseVol * volMultiplier);

    candles.push({
      timestamp: new Date(startTime + i * hourMs).toISOString(),
      open: +open.toFixed(basePrice < 10 ? 4 : basePrice < 100 ? 3 : 2),
      high: +high.toFixed(basePrice < 10 ? 4 : basePrice < 100 ? 3 : 2),
      low: +Math.max(low, open * 0.8).toFixed(basePrice < 10 ? 4 : basePrice < 100 ? 3 : 2),
      close: +close.toFixed(basePrice < 10 ? 4 : basePrice < 100 ? 3 : 2),
      volume,
    });
  }

  return candles;
}

/**
 * Symbol configurations: [basePrice, volatility, seed, drift]
 * Drift: positive = slight upward bias, negative = downward bias
 */
const SYMBOL_CONFIG = {
  // Forex
  EURUSD: [1.0850, 0.0015, 101, 0.1],
  GBPUSD: [1.2700, 0.0018, 102, -0.1],
  USDJPY: [149.50, 0.0012, 103, 0.2],
  AUDUSD: [0.6550, 0.0017, 104, -0.05],
  USDCAD: [1.3600, 0.0013, 105, 0.05],

  // Crypto
  BTCUSD: [43000, 0.018, 201, 0.3],
  ETHUSD: [2250, 0.02, 202, 0.25],
  BNBUSD: [310, 0.022, 203, 0.1],
  SOLUSD: [95, 0.025, 204, 0.4],
  XRPUSD: [0.5800, 0.023, 205, 0.15],

  // Indices
  SPX500: [4750, 0.009, 301, 0.15],
  NAS100: [16500, 0.011, 302, 0.2],
  DOW30: [37500, 0.008, 303, 0.1],
  FTSE100: [7650, 0.007, 304, -0.05],
  DAX40: [16800, 0.009, 305, 0.1],

  // Commodities
  XAUUSD: [2030, 0.007, 401, 0.1],
  XAGUSD: [23.5, 0.012, 402, 0.05],
  USOIL: [75.5, 0.015, 403, -0.1],
  UKOIL: [80.2, 0.014, 404, -0.08],
  NATGAS: [2.65, 0.025, 405, -0.2],
};

/**
 * Pre-generated candle data for all symbols.
 */
const mockCandles = {};

for (const [symbol, [basePrice, volatility, seed, drift]] of Object.entries(SYMBOL_CONFIG)) {
  mockCandles[symbol] = generateCandles(basePrice, volatility, seed, drift);
}

/**
 * Get candles for a specific symbol.
 * @param {string} symbol
 * @param {number} limit - Number of most recent candles to return (default 200)
 * @returns {Array|null}
 */
function getCandles(symbol, limit = 200) {
  const candles = mockCandles[symbol.toUpperCase()];
  if (!candles) return null;
  return candles.slice(-Math.min(limit, candles.length));
}

/**
 * Get a list of all available symbols.
 * @returns {string[]}
 */
function getAvailableSymbols() {
  return Object.keys(mockCandles);
}

module.exports = {
  mockCandles,
  getCandles,
  getAvailableSymbols,
  SYMBOL_CONFIG,
};
