/**
 * Technical indicators - pure functions, no side effects.
 * All price arrays are assumed to be chronological (oldest first).
 */

/**
 * Exponential Moving Average
 */
function calculateEMA(prices, period) {
  if (!prices || prices.length < period) return [];
  const k = 2 / (period + 1);
  const result = [];
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result.push({ index: period - 1, value: ema });
  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
    result.push({ index: i, value: ema });
  }
  return result;
}

/**
 * Relative Strength Index
 */
function calculateRSI(prices, period = 14) {
  if (!prices || prices.length < period + 1) return [];
  const result = [];
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;
  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  result.push({ index: period, value: 100 - 100 / (1 + rs) });

  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    const gain = diff >= 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result.push({ index: i, value: 100 - 100 / (1 + rs) });
  }

  return result;
}

/**
 * Moving Average Convergence Divergence
 */
function calculateMACD(prices, fast = 12, slow = 26, signal = 9) {
  if (!prices || prices.length < slow + signal) return { macd: [], signal: [], histogram: [] };

  const fastEMA = calculateEMA(prices, fast);
  const slowEMA = calculateEMA(prices, slow);

  const macdLine = [];
  for (let i = 0; i < slowEMA.length; i++) {
    const slowEntry = slowEMA[i];
    const fastEntry = fastEMA.find(e => e.index === slowEntry.index);
    if (fastEntry) {
      macdLine.push({ index: slowEntry.index, value: fastEntry.value - slowEntry.value });
    }
  }

  const macdValues = macdLine.map(e => e.value);
  const signalEMA = calculateEMA(macdValues, signal);

  const histogram = signalEMA.map((s, i) => ({
    index: macdLine[s.index] ? macdLine[s.index].index : macdLine[i].index,
    value: macdLine[i] ? macdLine[i].value - s.value : 0,
  }));

  return { macd: macdLine, signal: signalEMA, histogram };
}

/**
 * Bollinger Bands
 */
function calculateBollingerBands(prices, period = 20, stdDev = 2) {
  if (!prices || prices.length < period) return { upper: [], middle: [], lower: [] };

  const upper = [];
  const middle = [];
  const lower = [];

  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    const sma = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((a, b) => a + Math.pow(b - sma, 2), 0) / period;
    const sd = Math.sqrt(variance);
    middle.push({ index: i, value: sma });
    upper.push({ index: i, value: sma + stdDev * sd });
    lower.push({ index: i, value: sma - stdDev * sd });
  }

  return { upper, middle, lower };
}

/**
 * Average True Range
 */
function calculateATR(highs, lows, closes, period = 14) {
  if (!highs || highs.length < period + 1) return [];

  const trueRanges = [];
  for (let i = 1; i < highs.length; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    trueRanges.push(tr);
  }

  const result = [];
  let atr = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result.push({ index: period, value: atr });

  for (let i = period; i < trueRanges.length; i++) {
    atr = (atr * (period - 1) + trueRanges[i]) / period;
    result.push({ index: i + 1, value: atr });
  }

  return result;
}

/**
 * Support and Resistance levels based on pivot points in the lookback window.
 */
function findSupportResistance(prices, lookback = 20) {
  if (!prices || prices.length < lookback * 2) return { support: [], resistance: [] };

  const support = [];
  const resistance = [];

  for (let i = lookback; i < prices.length - lookback; i++) {
    const slice = prices.slice(i - lookback, i + lookback + 1);
    const min = Math.min(...slice);
    const max = Math.max(...slice);

    if (prices[i] === min) {
      // Check if this level is close to existing support (within 0.2%)
      const existing = support.find(s => Math.abs(s - prices[i]) / prices[i] < 0.002);
      if (!existing) support.push(prices[i]);
    }
    if (prices[i] === max) {
      const existing = resistance.find(r => Math.abs(r - prices[i]) / prices[i] < 0.002);
      if (!existing) resistance.push(prices[i]);
    }
  }

  // Return the 3 most recent / significant levels
  return {
    support: support.slice(-3).sort((a, b) => b - a),
    resistance: resistance.slice(-3).sort((a, b) => a - b),
  };
}

/**
 * Detect market structure (trend direction, higher highs, lower lows).
 */
function detectMarketStructure(prices) {
  if (!prices || prices.length < 20) {
    return { trend: 'sideways', higherHighs: false, lowerLows: false };
  }

  const recentPrices = prices.slice(-20);
  const pivotHighs = [];
  const pivotLows = [];

  for (let i = 2; i < recentPrices.length - 2; i++) {
    if (
      recentPrices[i] > recentPrices[i - 1] &&
      recentPrices[i] > recentPrices[i - 2] &&
      recentPrices[i] > recentPrices[i + 1] &&
      recentPrices[i] > recentPrices[i + 2]
    ) {
      pivotHighs.push(recentPrices[i]);
    }
    if (
      recentPrices[i] < recentPrices[i - 1] &&
      recentPrices[i] < recentPrices[i - 2] &&
      recentPrices[i] < recentPrices[i + 1] &&
      recentPrices[i] < recentPrices[i + 2]
    ) {
      pivotLows.push(recentPrices[i]);
    }
  }

  let higherHighs = false;
  let lowerLows = false;

  if (pivotHighs.length >= 2) {
    higherHighs = pivotHighs[pivotHighs.length - 1] > pivotHighs[pivotHighs.length - 2];
  }
  if (pivotLows.length >= 2) {
    lowerLows = pivotLows[pivotLows.length - 1] < pivotLows[pivotLows.length - 2];
  }

  let trend = 'sideways';
  if (higherHighs && !lowerLows) trend = 'uptrend';
  else if (lowerLows && !higherHighs) trend = 'downtrend';
  else if (higherHighs && lowerLows) trend = 'expanding';
  else if (!higherHighs && !lowerLows && pivotHighs.length >= 2 && pivotLows.length >= 2) {
    trend = 'contracting';
  }

  return { trend, higherHighs, lowerLows };
}

/**
 * Trend strength 0-100 using ADX-like calculation.
 */
function calculateTrendStrength(prices) {
  if (!prices || prices.length < 20) return 50;

  const period = 14;
  const slice = prices.slice(-period * 2);

  // Directional movement approximation using price only
  let positiveDM = 0;
  let negativeDM = 0;
  let trSum = 0;

  for (let i = 1; i < slice.length; i++) {
    const diff = slice[i] - slice[i - 1];
    if (diff > 0) positiveDM += diff;
    else negativeDM += Math.abs(diff);
    trSum += Math.abs(diff);
  }

  if (trSum === 0) return 50;

  const diPlus = (positiveDM / trSum) * 100;
  const diMinus = (negativeDM / trSum) * 100;
  const diDiff = Math.abs(diPlus - diMinus);
  const diSum = diPlus + diMinus;

  const adx = diSum === 0 ? 0 : (diDiff / diSum) * 100;
  return Math.min(100, Math.round(adx * 2));
}

module.exports = {
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateATR,
  findSupportResistance,
  detectMarketStructure,
  calculateTrendStrength,
};
