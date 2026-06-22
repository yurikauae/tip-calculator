/**
 * Signal generator - combines all indicators into a trading signal.
 * This is for educational and informational purposes only.
 * Past performance does not guarantee future results.
 */

const {
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateATR,
  findSupportResistance,
  detectMarketStructure,
  calculateTrendStrength,
} = require('./indicators');

const SIGNALS = {
  STRONG_BUY: 'Strong Buy',
  BUY: 'Buy',
  HOLD: 'Hold',
  SELL: 'Sell',
  STRONG_SELL: 'Strong Sell',
  WAIT: 'Wait',
};

/**
 * Extract the last value from an indicator result array.
 */
function last(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[arr.length - 1].value;
}

/**
 * Find the most recent swing low in the last `lookback` candles (for buy invalidation).
 */
function findRecentSwingLow(lows, lookback = 20) {
  if (!lows || lows.length < 3) return null;
  const slice = lows.slice(-lookback);
  let swingLow = null;
  for (let i = 1; i < slice.length - 1; i++) {
    if (slice[i] < slice[i - 1] && slice[i] < slice[i + 1]) {
      swingLow = slice[i];
    }
  }
  // If no pivot found, use the minimum of the slice
  return swingLow !== null ? swingLow : Math.min(...slice);
}

/**
 * Find the most recent swing high in the last `lookback` candles (for sell invalidation).
 */
function findRecentSwingHigh(highs, lookback = 20) {
  if (!highs || highs.length < 3) return null;
  const slice = highs.slice(-lookback);
  let swingHigh = null;
  for (let i = 1; i < slice.length - 1; i++) {
    if (slice[i] > slice[i - 1] && slice[i] > slice[i + 1]) {
      swingHigh = slice[i];
    }
  }
  return swingHigh !== null ? swingHigh : Math.max(...slice);
}

/**
 * Compute rolling standard deviation of close-to-close returns for volatility.
 */
function computeVolatility(closes, period = 20) {
  if (!closes || closes.length < period + 1) return null;
  const returns = [];
  for (let i = closes.length - period; i < closes.length; i++) {
    returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  }
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
  return Math.sqrt(variance);
}

/**
 * Generate a trading signal from OHLCV candle data.
 *
 * Confidence scoring (100 pts max):
 *   RSI divergence/condition  = 25 pts
 *   MACD crossover/histogram  = 25 pts
 *   EMA alignment             = 20 pts
 *   S/R bounce                = 20 pts
 *   Trend strength            = 10 pts
 *
 * Signal rules:
 *   Strong Buy  > 80
 *   Buy         60-80
 *   Hold        40-60
 *   Sell        20-40
 *   Strong Sell < 20  (bearish dominant)
 *   Wait        mixed/neutral
 *
 * @param {string} symbol
 * @param {Array} candles - [{open, high, low, close, volume, timestamp}]
 * @param {string} timeframe
 * @returns {Object} signal object
 */
function generateSignal(symbol, candles, timeframe = '1h') {
  if (!candles || candles.length < 50) {
    return {
      signal: SIGNALS.WAIT,
      confidence: 0,
      entryZone: null,
      stopLoss: null,
      trailingStop: null,
      takeProfits: [],
      riskReward: { r1: null, r2: null, r3: null },
      sharpelike: null,
      reason: 'Insufficient data to generate a reliable signal. At least 50 candles are required.',
      invalidatedAt: null,
      suggestedRisk: '1%',
      style: 'N/A',
      timeframe,
      indicators: {},
    };
  }

  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const volumes = candles.map(c => c.volume || 0);
  const currentPrice = closes[closes.length - 1];

  // --- Compute indicators ---
  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);
  const ema200 = calculateEMA(closes, 200);
  const rsiData = calculateRSI(closes, 14);
  const macdData = calculateMACD(closes);
  const bbData = calculateBollingerBands(closes, 20, 2);
  const atrData = calculateATR(highs, lows, closes, 14);
  const srLevels = findSupportResistance(closes, 20);
  const structure = detectMarketStructure(closes);
  const trendStrength = calculateTrendStrength(closes, highs, lows);

  const ema20Val = last(ema20);
  const ema50Val = last(ema50);
  const ema200Val = last(ema200);
  const rsiVal = last(rsiData);
  const macdVal = last(macdData.macd);
  const macdSignalVal = last(macdData.signal);
  const macdHistVal = last(macdData.histogram);
  const bbUpper = last(bbData.upper);
  const bbMiddle = last(bbData.middle);
  const bbLower = last(bbData.lower);
  const atrVal = last(atrData);
  const atr = atrVal || currentPrice * 0.005;

  // Previous histogram value to detect crossover direction
  const prevMacdHist =
    macdData.histogram.length >= 2
      ? macdData.histogram[macdData.histogram.length - 2].value
      : null;

  // --- WEIGHTED CONFIDENCE SCORING ---
  // We track bullish points and bearish points per category,
  // then decide direction by which side dominates.

  // Category max weights: RSI=25, MACD=25, EMA=20, SR=20, Trend=10

  let rsiPoints = 0;   // positive = bullish, negative = bearish (-25 to +25)
  let macdPoints = 0;  // (-25 to +25)
  let emaPoints = 0;   // (-20 to +20)
  let srPoints = 0;    // (-20 to +20)
  let trendPoints = 0; // (-10 to +10)

  const reasonParts = { bullish: [], bearish: [] };

  // --- RSI (25 pts) ---
  if (rsiVal !== null) {
    if (rsiVal < 30) {
      rsiPoints = 25;
      reasonParts.bullish.push(`RSI is oversold at ${rsiVal.toFixed(1)} (strongly bullish divergence zone)`);
    } else if (rsiVal < 45) {
      rsiPoints = 13;
      reasonParts.bullish.push(`RSI at ${rsiVal.toFixed(1)} is in the bullish zone with upside room`);
    } else if (rsiVal > 70) {
      rsiPoints = -25;
      reasonParts.bearish.push(`RSI is overbought at ${rsiVal.toFixed(1)} (strongly bearish divergence zone)`);
    } else if (rsiVal > 55) {
      rsiPoints = -13;
      reasonParts.bearish.push(`RSI at ${rsiVal.toFixed(1)} is in the bearish zone with limited upside`);
    }
    // 45-55: neutral, 0 pts
  }

  // --- MACD (25 pts) ---
  if (macdVal !== null && macdSignalVal !== null) {
    const bullishCross = macdVal > macdSignalVal;
    const histExpanding = macdHistVal !== null && prevMacdHist !== null && Math.abs(macdHistVal) > Math.abs(prevMacdHist);
    const histPositive = macdHistVal !== null && macdHistVal > 0;

    if (bullishCross && histPositive && histExpanding) {
      macdPoints = 25;
      reasonParts.bullish.push(
        `MACD line (${macdVal.toFixed(5)}) is above signal (${macdSignalVal.toFixed(5)}) with expanding positive histogram`
      );
    } else if (bullishCross && histPositive) {
      macdPoints = 18;
      reasonParts.bullish.push(
        `MACD line (${macdVal.toFixed(5)}) is above signal (${macdSignalVal.toFixed(5)}) with positive histogram`
      );
    } else if (bullishCross) {
      macdPoints = 10;
      reasonParts.bullish.push(`MACD line (${macdVal.toFixed(5)}) crossed above signal (${macdSignalVal.toFixed(5)})`);
    } else if (!bullishCross && !histPositive && histExpanding) {
      macdPoints = -25;
      reasonParts.bearish.push(
        `MACD line (${macdVal.toFixed(5)}) is below signal (${macdSignalVal.toFixed(5)}) with expanding negative histogram`
      );
    } else if (!bullishCross && !histPositive) {
      macdPoints = -18;
      reasonParts.bearish.push(
        `MACD line (${macdVal.toFixed(5)}) is below signal (${macdSignalVal.toFixed(5)}) with negative histogram`
      );
    } else {
      macdPoints = -10;
      reasonParts.bearish.push(`MACD line (${macdVal.toFixed(5)}) crossed below signal (${macdSignalVal.toFixed(5)})`);
    }
  }

  // --- EMA Alignment (20 pts) ---
  if (ema20Val && ema50Val && ema200Val) {
    // Perfect bull: price > ema20 > ema50 > ema200
    if (currentPrice > ema20Val && ema20Val > ema50Val && ema50Val > ema200Val) {
      emaPoints = 20;
      reasonParts.bullish.push(
        `Full bullish EMA alignment: price (${currentPrice.toFixed(5)}) > EMA20 (${ema20Val.toFixed(5)}) > EMA50 (${ema50Val.toFixed(5)}) > EMA200 (${ema200Val.toFixed(5)})`
      );
    } else if (currentPrice < ema20Val && ema20Val < ema50Val && ema50Val < ema200Val) {
      emaPoints = -20;
      reasonParts.bearish.push(
        `Full bearish EMA alignment: price (${currentPrice.toFixed(5)}) < EMA20 (${ema20Val.toFixed(5)}) < EMA50 (${ema50Val.toFixed(5)}) < EMA200 (${ema200Val.toFixed(5)})`
      );
    } else if (currentPrice > ema20Val && ema20Val > ema50Val) {
      emaPoints = 12;
      reasonParts.bullish.push(
        `Partial bull EMA alignment: price > EMA20 (${ema20Val.toFixed(5)}) > EMA50 (${ema50Val.toFixed(5)}), EMA200 at ${ema200Val.toFixed(5)}`
      );
    } else if (currentPrice < ema20Val && ema20Val < ema50Val) {
      emaPoints = -12;
      reasonParts.bearish.push(
        `Partial bear EMA alignment: price < EMA20 (${ema20Val.toFixed(5)}) < EMA50 (${ema50Val.toFixed(5)}), EMA200 at ${ema200Val.toFixed(5)}`
      );
    } else if (currentPrice > ema50Val && ema50Val > ema200Val) {
      emaPoints = 8;
      reasonParts.bullish.push(
        `Price above EMA50 (${ema50Val.toFixed(5)}) and EMA200 (${ema200Val.toFixed(5)}) — medium-term bullish`
      );
    } else if (currentPrice < ema50Val && ema50Val < ema200Val) {
      emaPoints = -8;
      reasonParts.bearish.push(
        `Price below EMA50 (${ema50Val.toFixed(5)}) and EMA200 (${ema200Val.toFixed(5)}) — medium-term bearish`
      );
    }
  } else if (ema20Val && ema50Val) {
    if (currentPrice > ema20Val && ema20Val > ema50Val) {
      emaPoints = 15;
      reasonParts.bullish.push(
        `Price > EMA20 (${ema20Val.toFixed(5)}) > EMA50 (${ema50Val.toFixed(5)}) — bullish short-term alignment`
      );
    } else if (currentPrice < ema20Val && ema20Val < ema50Val) {
      emaPoints = -15;
      reasonParts.bearish.push(
        `Price < EMA20 (${ema20Val.toFixed(5)}) < EMA50 (${ema50Val.toFixed(5)}) — bearish short-term alignment`
      );
    }
  }

  // --- S/R Bounce (20 pts) ---
  const nearestSupport = srLevels.support.length > 0 ? srLevels.support[0] : null;
  const nearestResistance = srLevels.resistance.length > 0 ? srLevels.resistance[0] : null;
  const nearSupportThresh = 0.005; // 0.5%
  const nearResistanceThresh = 0.005;

  if (nearestSupport) {
    const dist = Math.abs(currentPrice - nearestSupport.level) / currentPrice;
    if (dist < nearSupportThresh) {
      const pts = Math.min(20, 10 + nearestSupport.touchCount * 3);
      srPoints = pts;
      reasonParts.bullish.push(
        `Price near key support level ${nearestSupport.level.toFixed(5)} (tested ${nearestSupport.touchCount}x)`
      );
    }
  }

  if (nearestResistance && srPoints === 0) {
    const dist = Math.abs(currentPrice - nearestResistance.level) / currentPrice;
    if (dist < nearResistanceThresh) {
      const pts = Math.min(20, 10 + nearestResistance.touchCount * 3);
      srPoints = -pts;
      reasonParts.bearish.push(
        `Price near key resistance level ${nearestResistance.level.toFixed(5)} (tested ${nearestResistance.touchCount}x)`
      );
    }
  }

  // --- Trend Strength (10 pts) ---
  if (trendStrength >= 70) {
    // Direction is determined by EMA/structure
    const bullishTrend = structure.trend === 'uptrend' || emaPoints > 0;
    if (bullishTrend) {
      trendPoints = 10;
      reasonParts.bullish.push(`Strong trend with score ${trendStrength}/100 supporting the bullish direction`);
    } else {
      trendPoints = -10;
      reasonParts.bearish.push(`Strong trend with score ${trendStrength}/100 supporting the bearish direction`);
    }
  } else if (trendStrength >= 40) {
    const bullishTrend = structure.trend === 'uptrend' || emaPoints > 0;
    trendPoints = bullishTrend ? 5 : -5;
  }
  // < 40: sideways/weak, 0 pts

  // --- Total score: sum of all weighted components ---
  const rawScore = rsiPoints + macdPoints + emaPoints + srPoints + trendPoints;
  // rawScore range: -100 to +100

  // Confidence is the absolute percentage of max (100 pts)
  const confidence = Math.min(100, Math.abs(rawScore));

  // Determine direction
  const isBullishBias = rawScore > 0;

  // Map to signal based on confidence and direction
  let signal;
  if (confidence > 80) {
    signal = isBullishBias ? SIGNALS.STRONG_BUY : SIGNALS.STRONG_SELL;
  } else if (confidence >= 60) {
    signal = isBullishBias ? SIGNALS.BUY : SIGNALS.SELL;
  } else if (confidence >= 40) {
    signal = SIGNALS.HOLD;
  } else if (confidence >= 20) {
    signal = isBullishBias ? SIGNALS.HOLD : SIGNALS.HOLD;
    // Weak conviction - hold regardless
  } else {
    // Very low confidence - mixed signals
    signal = SIGNALS.WAIT;
  }

  // Refine: if components are split (some strongly bullish, some strongly bearish), use WAIT
  const bullishComponentCount = [rsiPoints > 0, macdPoints > 0, emaPoints > 0, srPoints > 0, trendPoints > 0].filter(Boolean).length;
  const bearishComponentCount = [rsiPoints < 0, macdPoints < 0, emaPoints < 0, srPoints < 0, trendPoints < 0].filter(Boolean).length;
  const mixedSignals = bullishComponentCount >= 2 && bearishComponentCount >= 2 && confidence < 60;
  if (mixedSignals) signal = SIGNALS.WAIT;

  const isBuy = signal === SIGNALS.STRONG_BUY || signal === SIGNALS.BUY;
  const isSell = signal === SIGNALS.STRONG_SELL || signal === SIGNALS.SELL;

  // --- ATR-based price levels ---
  let entryZone, stopLoss, trailingStop, takeProfits, style;

  if (isBuy) {
    entryZone = {
      low: +(currentPrice - atr * 0.3).toFixed(5),
      high: +(currentPrice + atr * 0.3).toFixed(5),
    };
    stopLoss = +(currentPrice - atr * 1.5).toFixed(5);
    trailingStop = +(currentPrice - atr * 1.5).toFixed(5); // starts same as stop, trails up
    takeProfits = [
      +(currentPrice + atr * 1.5).toFixed(5),
      +(currentPrice + atr * 2.5).toFixed(5),
      +(currentPrice + atr * 4.0).toFixed(5),
    ];
    style = trendStrength > 60 ? 'Trend Follow' : 'Swing';
  } else if (isSell) {
    entryZone = {
      low: +(currentPrice - atr * 0.3).toFixed(5),
      high: +(currentPrice + atr * 0.3).toFixed(5),
    };
    stopLoss = +(currentPrice + atr * 1.5).toFixed(5);
    trailingStop = +(currentPrice + atr * 1.5).toFixed(5);
    takeProfits = [
      +(currentPrice - atr * 1.5).toFixed(5),
      +(currentPrice - atr * 2.5).toFixed(5),
      +(currentPrice - atr * 4.0).toFixed(5),
    ];
    style = trendStrength > 60 ? 'Trend Follow' : 'Swing';
  } else {
    entryZone = null;
    stopLoss = null;
    trailingStop = null;
    takeProfits = [];
    style = 'N/A';
  }

  // --- Risk/Reward per TP level ---
  let riskReward = { r1: null, r2: null, r3: null };
  if (stopLoss !== null && takeProfits.length === 3) {
    const risk = Math.abs(currentPrice - stopLoss);
    if (risk > 0) {
      riskReward = {
        r1: +(Math.abs(takeProfits[0] - currentPrice) / risk).toFixed(2),
        r2: +(Math.abs(takeProfits[1] - currentPrice) / risk).toFixed(2),
        r3: +(Math.abs(takeProfits[2] - currentPrice) / risk).toFixed(2),
      };
    }
  }

  // --- Invalidation level: swing low for buys, swing high for sells ---
  let invalidatedAt = null;
  if (isBuy) {
    const swingLow = findRecentSwingLow(lows, 20);
    if (swingLow !== null) {
      invalidatedAt = +(swingLow - atr * 0.3).toFixed(5);
    }
  } else if (isSell) {
    const swingHigh = findRecentSwingHigh(highs, 20);
    if (swingHigh !== null) {
      invalidatedAt = +(swingHigh + atr * 0.3).toFixed(5);
    }
  }

  // --- Sharpe-like ratio: expectedReturn / volatility ---
  let sharpelike = null;
  const volatility = computeVolatility(closes, 20);
  if (volatility && volatility > 0 && takeProfits.length > 0) {
    // Expected return = distance to TP2 as fraction of current price
    const expectedReturn = Math.abs(takeProfits[1] - currentPrice) / currentPrice;
    sharpelike = +(expectedReturn / volatility).toFixed(2);
  }

  // --- Reason string (detailed) ---
  let reason;
  if (signal === SIGNALS.WAIT || (!isBuy && !isSell && signal !== SIGNALS.HOLD)) {
    reason =
      `No clear directional bias at this time. Indicators are mixed (${bullishComponentCount} bullish vs ${bearishComponentCount} bearish components). ` +
      `RSI: ${rsiVal !== null ? rsiVal.toFixed(1) : 'N/A'}. ` +
      `MACD: ${macdVal !== null ? macdVal.toFixed(5) : 'N/A'} vs signal ${macdSignalVal !== null ? macdSignalVal.toFixed(5) : 'N/A'}. ` +
      `Trend: ${structure.trend} (strength ${trendStrength}/100). ` +
      `Waiting for a clearer setup before considering a position.`;
  } else {
    const dir = isBuy ? 'BUY' : isSell ? 'SELL' : 'HOLD';
    const activeReasons = isBuy ? reasonParts.bullish : isSell ? reasonParts.bearish : [];
    const sr = isBuy ? nearestSupport : nearestResistance;
    const srText = sr
      ? ` Nearest ${isBuy ? 'support' : 'resistance'} at ${sr.level.toFixed(5)} (${sr.touchCount} touches).`
      : '';

    reason =
      `${dir} signal with ${confidence}% confidence. ` +
      (activeReasons.length > 0 ? activeReasons.join('; ') + '. ' : '') +
      `RSI: ${rsiVal !== null ? rsiVal.toFixed(1) : 'N/A'}` +
      (rsiVal !== null && rsiVal < 30 ? ' (oversold)' : rsiVal !== null && rsiVal > 70 ? ' (overbought)' : '') +
      `. MACD line: ${macdVal !== null ? macdVal.toFixed(5) : 'N/A'}, signal: ${macdSignalVal !== null ? macdSignalVal.toFixed(5) : 'N/A'}, histogram: ${macdHistVal !== null ? macdHistVal.toFixed(5) : 'N/A'}.` +
      `${srText} Trend: ${structure.trend} (strength ${trendStrength}/100). ATR: ${atr.toFixed(5)}.` +
      ` This analysis is probabilistic and does not guarantee any outcome. Always manage your risk.`;
  }

  // --- Suggested risk ---
  const suggestedRisk = confidence >= 70 ? '2%' : confidence >= 50 ? '1%' : '0.5%';

  return {
    signal,
    confidence,
    entryZone,
    stopLoss,
    trailingStop,
    takeProfits,
    riskReward,
    sharpelike,
    reason,
    invalidatedAt,
    suggestedRisk,
    style,
    timeframe,
    indicators: {
      ema20: ema20Val !== null ? +ema20Val.toFixed(5) : null,
      ema50: ema50Val !== null ? +ema50Val.toFixed(5) : null,
      ema200: ema200Val !== null ? +ema200Val.toFixed(5) : null,
      rsi: rsiVal !== null ? +rsiVal.toFixed(2) : null,
      macd: macdVal !== null ? +macdVal.toFixed(5) : null,
      macdSignal: macdSignalVal !== null ? +macdSignalVal.toFixed(5) : null,
      macdHistogram: macdHistVal !== null ? +macdHistVal.toFixed(5) : null,
      bbUpper: bbUpper !== null ? +bbUpper.toFixed(5) : null,
      bbMiddle: bbMiddle !== null ? +bbMiddle.toFixed(5) : null,
      bbLower: bbLower !== null ? +bbLower.toFixed(5) : null,
      atr: atrVal !== null ? +atrVal.toFixed(5) : null,
      trendStrength,
      trend: structure.trend,
      support: srLevels.support,
      resistance: srLevels.resistance,
      rawScore,
      scoreBreakdown: { rsiPoints, macdPoints, emaPoints, srPoints, trendPoints },
    },
  };
}

module.exports = { generateSignal, SIGNALS };
