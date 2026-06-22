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
 * Relative Strength Index using Wilder's smoothing method.
 * First RSI value uses SMA of gains/losses; subsequent values use:
 *   avgGain = (prevAvgGain * 13 + currentGain) / 14
 */
function calculateRSI(prices, period = 14) {
  if (!prices || prices.length < period + 1) return [];
  const result = [];

  let avgGain = 0;
  let avgLoss = 0;

  // Seed with SMA of first `period` changes
  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) avgGain += diff;
    else avgLoss += Math.abs(diff);
  }
  avgGain /= period;
  avgLoss /= period;

  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  result.push({ index: period, value: 100 - 100 / (1 + rs) });

  // Wilder's smoothing for subsequent values
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
 * Properly aligns macdLine and signalLine before computing histogram.
 */
function calculateMACD(prices, fast = 12, slow = 26, signal = 9) {
  if (!prices || prices.length < slow + signal) {
    return { macd: [], signal: [], histogram: [] };
  }

  const fastEMA = calculateEMA(prices, fast);
  const slowEMA = calculateEMA(prices, slow);

  // Build macd line: only where both EMAs exist (indexed by candle index)
  const macdLine = [];
  const slowIndexSet = new Map(slowEMA.map(e => [e.index, e.value]));
  const fastIndexSet = new Map(fastEMA.map(e => [e.index, e.value]));

  for (const [idx, slowVal] of slowIndexSet) {
    const fastVal = fastIndexSet.get(idx);
    if (fastVal !== undefined) {
      macdLine.push({ index: idx, value: fastVal - slowVal });
    }
  }
  macdLine.sort((a, b) => a.index - b.index);

  if (macdLine.length < signal) {
    return { macd: macdLine, signal: [], histogram: [] };
  }

  // Compute signal EMA from macd values array
  const macdValues = macdLine.map(e => e.value);
  const signalEMAraw = calculateEMA(macdValues, signal);

  // signalEMAraw indices are relative to macdValues; map back to candle indices
  // signalEMAraw[i].index is index into macdValues array
  const signalLine = signalEMAraw.map(e => ({
    index: macdLine[e.index].index,
    value: e.value,
  }));

  // Align: histogram only where both macdLine and signalLine share the same candle index
  const signalMap = new Map(signalLine.map(e => [e.index, e.value]));
  const histogram = [];
  for (const m of macdLine) {
    const sVal = signalMap.get(m.index);
    if (sVal !== undefined) {
      histogram.push({ index: m.index, value: m.value - sVal });
    }
  }

  return { macd: macdLine, signal: signalLine, histogram };
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
 * Stochastic Oscillator (%K and %D lines).
 * @param {number[]} highs
 * @param {number[]} lows
 * @param {number[]} closes
 * @param {number} kPeriod - lookback for raw %K (default 14)
 * @param {number} dPeriod - smoothing period for %D (default 3)
 * @returns {{ k: Array<{index,value}>, d: Array<{index,value}> }}
 */
function stochasticOscillator(highs, lows, closes, kPeriod = 14, dPeriod = 3) {
  if (
    !highs || !lows || !closes ||
    highs.length < kPeriod ||
    highs.length !== lows.length ||
    highs.length !== closes.length
  ) {
    return { k: [], d: [] };
  }

  const kLine = [];
  for (let i = kPeriod - 1; i < closes.length; i++) {
    const periodHighs = highs.slice(i - kPeriod + 1, i + 1);
    const periodLows = lows.slice(i - kPeriod + 1, i + 1);
    const highestHigh = Math.max(...periodHighs);
    const lowestLow = Math.min(...periodLows);
    const range = highestHigh - lowestLow;
    const kVal = range === 0 ? 50 : ((closes[i] - lowestLow) / range) * 100;
    kLine.push({ index: i, value: kVal });
  }

  if (kLine.length < dPeriod) return { k: kLine, d: [] };

  // %D is SMA of %K over dPeriod
  const dLine = [];
  for (let i = dPeriod - 1; i < kLine.length; i++) {
    const slice = kLine.slice(i - dPeriod + 1, i + 1);
    const dVal = slice.reduce((a, b) => a + b.value, 0) / dPeriod;
    dLine.push({ index: kLine[i].index, value: dVal });
  }

  return { k: kLine, d: dLine };
}

/**
 * Volume Weighted Average Price (VWAP).
 * Calculates cumulative VWAP from the start of the provided data.
 * @param {number[]} highs
 * @param {number[]} lows
 * @param {number[]} closes
 * @param {number[]} volumes
 * @returns {Array<{index, value}>}
 */
function volumeWeightedAveragePrice(highs, lows, closes, volumes) {
  if (
    !highs || !lows || !closes || !volumes ||
    highs.length === 0 ||
    highs.length !== lows.length ||
    highs.length !== closes.length ||
    highs.length !== volumes.length
  ) {
    return [];
  }

  const result = [];
  let cumulativeTPV = 0; // typical price * volume
  let cumulativeVolume = 0;

  for (let i = 0; i < closes.length; i++) {
    const typicalPrice = (highs[i] + lows[i] + closes[i]) / 3;
    cumulativeTPV += typicalPrice * volumes[i];
    cumulativeVolume += volumes[i];
    const vwap = cumulativeVolume === 0 ? typicalPrice : cumulativeTPV / cumulativeVolume;
    result.push({ index: i, value: vwap });
  }

  return result;
}

/**
 * Ichimoku Cloud components.
 * @param {number[]} highs
 * @param {number[]} lows
 * @param {number[]} closes
 * @returns {{ tenkanSen, kijunSen, senkouSpanA, senkouSpanB, chikouSpan }}
 *   Each is an array of {index, value}.
 */
function calculateIchimoku(highs, lows, closes) {
  const tenkanPeriod = 9;
  const kijunPeriod = 26;
  const senkouBPeriod = 52;
  const displacement = 26;

  if (!highs || highs.length < senkouBPeriod) {
    return { tenkanSen: [], kijunSen: [], senkouSpanA: [], senkouSpanB: [], chikouSpan: [] };
  }

  function midpoint(arr, endIdx, period) {
    if (endIdx < period - 1) return null;
    const slice = arr.slice(endIdx - period + 1, endIdx + 1);
    return (Math.max(...slice) + Math.min(...slice)) / 2;
  }

  const tenkanSen = [];
  const kijunSen = [];
  const senkouSpanA = [];
  const senkouSpanB = [];
  const chikouSpan = [];

  for (let i = 0; i < closes.length; i++) {
    const tenkan = midpoint(highs.map((h, j) => Math.max(h, lows[j])), i, tenkanPeriod) !== null
      ? (Math.max(...highs.slice(Math.max(0, i - tenkanPeriod + 1), i + 1)) +
         Math.min(...lows.slice(Math.max(0, i - tenkanPeriod + 1), i + 1))) / 2
      : null;

    const kijun = i >= kijunPeriod - 1
      ? (Math.max(...highs.slice(i - kijunPeriod + 1, i + 1)) +
         Math.min(...lows.slice(i - kijunPeriod + 1, i + 1))) / 2
      : null;

    if (tenkan !== null && i >= tenkanPeriod - 1) {
      tenkanSen.push({ index: i, value: tenkan });
    }
    if (kijun !== null) {
      kijunSen.push({ index: i, value: kijun });
    }

    // Senkou Span A and B are displaced forward by 26 periods
    if (tenkan !== null && kijun !== null) {
      senkouSpanA.push({ index: i + displacement, value: (tenkan + kijun) / 2 });
    }
    if (i >= senkouBPeriod - 1) {
      const senkouB =
        (Math.max(...highs.slice(i - senkouBPeriod + 1, i + 1)) +
         Math.min(...lows.slice(i - senkouBPeriod + 1, i + 1))) / 2;
      senkouSpanB.push({ index: i + displacement, value: senkouB });
    }

    // Chikou Span: close displaced back 26 periods (plotted at i - 26)
    if (i >= displacement) {
      chikouSpan.push({ index: i - displacement, value: closes[i] });
    }
  }

  return { tenkanSen, kijunSen, senkouSpanA, senkouSpanB, chikouSpan };
}

/**
 * Support and Resistance levels.
 * Clusters pivot levels within 0.5%, counts touches, returns top 3 by touch count.
 * @param {number[]} prices
 * @param {number} lookback - pivot neighborhood half-width
 * @returns {{ support: Array<{level, touchCount}>, resistance: Array<{level, touchCount}> }}
 */
function findSupportResistance(prices, lookback = 20) {
  if (!prices || prices.length < lookback * 2) return { support: [], resistance: [] };

  const rawSupport = [];
  const rawResistance = [];

  for (let i = lookback; i < prices.length - lookback; i++) {
    const slice = prices.slice(i - lookback, i + lookback + 1);
    const min = Math.min(...slice);
    const max = Math.max(...slice);

    if (prices[i] === min) rawSupport.push(prices[i]);
    if (prices[i] === max) rawResistance.push(prices[i]);
  }

  function clusterLevels(levels) {
    if (levels.length === 0) return [];
    const clusters = [];
    for (const level of levels) {
      const existing = clusters.find(c => Math.abs(c.level - level) / c.level < 0.005);
      if (existing) {
        existing.sum += level;
        existing.count += 1;
        existing.level = existing.sum / existing.count; // running average
        existing.touchCount += 1;
      } else {
        clusters.push({ level, sum: level, count: 1, touchCount: 1 });
      }
    }
    // Sort by touchCount descending, return top 3
    return clusters
      .sort((a, b) => b.touchCount - a.touchCount)
      .slice(0, 3)
      .map(c => ({ level: +c.level.toFixed(5), touchCount: c.touchCount }));
  }

  return {
    support: clusterLevels(rawSupport),
    resistance: clusterLevels(rawResistance),
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
 * Trend strength 0-100 combining ADX-like DI calculation with EMA alignment score.
 * @param {number[]} prices
 * @param {number[]} [highs] - optional, for true ATR-based DI
 * @param {number[]} [lows]  - optional
 * @returns {number} 0-100
 */
function calculateTrendStrength(prices, highs, lows) {
  if (!prices || prices.length < 28) return 50;

  const period = 14;

  // --- ADX-like component using directional movement ---
  const useHL = highs && lows && highs.length === prices.length && lows.length === prices.length;
  let adxScore = 0;

  {
    const slice = prices.slice(-period * 2);
    const hSlice = useHL ? highs.slice(-period * 2) : null;
    const lSlice = useHL ? lows.slice(-period * 2) : null;

    let posDM = 0;
    let negDM = 0;
    let trSum = 0;

    for (let i = 1; i < slice.length; i++) {
      let upMove, downMove, tr;
      if (useHL) {
        upMove = hSlice[i] - hSlice[i - 1];
        downMove = lSlice[i - 1] - lSlice[i];
        tr = Math.max(
          hSlice[i] - lSlice[i],
          Math.abs(hSlice[i] - slice[i - 1]),
          Math.abs(lSlice[i] - slice[i - 1])
        );
      } else {
        upMove = Math.max(slice[i] - slice[i - 1], 0);
        downMove = Math.max(slice[i - 1] - slice[i], 0);
        tr = Math.abs(slice[i] - slice[i - 1]);
      }
      posDM += upMove > downMove && upMove > 0 ? upMove : 0;
      negDM += downMove > upMove && downMove > 0 ? downMove : 0;
      trSum += tr;
    }

    if (trSum > 0) {
      const diPlus = (posDM / trSum) * 100;
      const diMinus = (negDM / trSum) * 100;
      const diSum = diPlus + diMinus;
      adxScore = diSum === 0 ? 0 : (Math.abs(diPlus - diMinus) / diSum) * 100;
    }
  }

  // --- EMA alignment component ---
  let emaScore = 0;
  if (prices.length >= 200) {
    const ema20 = calculateEMA(prices, 20);
    const ema50 = calculateEMA(prices, 50);
    const ema200 = calculateEMA(prices, 200);
    const e20 = ema20.length > 0 ? ema20[ema20.length - 1].value : null;
    const e50 = ema50.length > 0 ? ema50[ema50.length - 1].value : null;
    const e200 = ema200.length > 0 ? ema200[ema200.length - 1].value : null;
    const cp = prices[prices.length - 1];

    if (e20 && e50 && e200) {
      if (cp > e20 && e20 > e50 && e50 > e200) emaScore = 100; // perfect bull alignment
      else if (cp < e20 && e20 < e50 && e50 < e200) emaScore = 100; // perfect bear alignment
      else if ((cp > e20 && e20 > e50) || (cp < e20 && e20 < e50)) emaScore = 60;
      else if (cp > e50 || cp < e50) emaScore = 30;
    }
  } else if (prices.length >= 50) {
    const ema20 = calculateEMA(prices, 20);
    const ema50 = calculateEMA(prices, 50);
    const e20 = ema20.length > 0 ? ema20[ema20.length - 1].value : null;
    const e50 = ema50.length > 0 ? ema50[ema50.length - 1].value : null;
    const cp = prices[prices.length - 1];
    if (e20 && e50) {
      if ((cp > e20 && e20 > e50) || (cp < e20 && e20 < e50)) emaScore = 80;
      else emaScore = 20;
    }
  }

  // Combine: 60% ADX, 40% EMA alignment
  const combined = adxScore * 0.6 + emaScore * 0.4;
  return Math.min(100, Math.round(combined));
}

module.exports = {
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateATR,
  stochasticOscillator,
  volumeWeightedAveragePrice,
  calculateIchimoku,
  findSupportResistance,
  detectMarketStructure,
  calculateTrendStrength,
};
