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
 * Generate a trading signal from OHLCV candle data.
 *
 * @param {string} symbol - e.g. "EURUSD"
 * @param {Array} candles - array of {open, high, low, close, volume, timestamp}
 * @param {string} timeframe - e.g. "1h", "4h", "1d"
 * @returns {Object} signal object
 */
function generateSignal(symbol, candles, timeframe = '1h') {
  if (!candles || candles.length < 50) {
    return {
      signal: SIGNALS.WAIT,
      confidence: 0,
      entryZone: null,
      stopLoss: null,
      takeProfits: [],
      riskReward: null,
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
  const trendStrength = calculateTrendStrength(closes);

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

  // --- Scoring system ---
  // Each bullish condition adds +1, each bearish adds -1
  let score = 0;
  const bullishReasons = [];
  const bearishReasons = [];

  // EMA alignment
  if (ema20Val && ema50Val && ema20Val > ema50Val) {
    score += 1;
    bullishReasons.push('EMA 20 is above EMA 50 (short-term momentum is bullish)');
  } else if (ema20Val && ema50Val && ema20Val < ema50Val) {
    score -= 1;
    bearishReasons.push('EMA 20 is below EMA 50 (short-term momentum is bearish)');
  }

  if (ema50Val && ema200Val && ema50Val > ema200Val) {
    score += 1;
    bullishReasons.push('EMA 50 is above EMA 200 (long-term trend appears bullish)');
  } else if (ema50Val && ema200Val && ema50Val < ema200Val) {
    score -= 1;
    bearishReasons.push('EMA 50 is below EMA 200 (long-term trend appears bearish)');
  }

  if (ema50Val && currentPrice > ema50Val) {
    score += 1;
    bullishReasons.push('price is above EMA 50');
  } else if (ema50Val && currentPrice < ema50Val) {
    score -= 1;
    bearishReasons.push('price is below EMA 50');
  }

  if (ema200Val && currentPrice > ema200Val) {
    score += 1;
    bullishReasons.push('price is above EMA 200 (above major long-term average)');
  } else if (ema200Val && currentPrice < ema200Val) {
    score -= 1;
    bearishReasons.push('price is below EMA 200 (below major long-term average)');
  }

  // RSI
  if (rsiVal !== null) {
    if (rsiVal < 30) {
      score += 2;
      bullishReasons.push(`RSI is oversold at ${rsiVal.toFixed(1)} (potential reversal zone)`);
    } else if (rsiVal < 45) {
      score += 1;
      bullishReasons.push(`RSI at ${rsiVal.toFixed(1)} suggests room to move higher`);
    } else if (rsiVal > 70) {
      score -= 2;
      bearishReasons.push(`RSI is overbought at ${rsiVal.toFixed(1)} (potential reversal zone)`);
    } else if (rsiVal > 55) {
      score -= 1;
      bearishReasons.push(`RSI at ${rsiVal.toFixed(1)} suggests limited upside momentum`);
    }
  }

  // MACD
  if (macdVal !== null && macdSignalVal !== null) {
    if (macdVal > macdSignalVal) {
      score += 1;
      bullishReasons.push('MACD line is above the signal line (bullish crossover condition)');
    } else {
      score -= 1;
      bearishReasons.push('MACD line is below the signal line (bearish crossover condition)');
    }
    if (macdHistVal !== null && macdHistVal > 0) {
      score += 1;
      bullishReasons.push('MACD histogram is positive and expanding');
    } else if (macdHistVal !== null && macdHistVal < 0) {
      score -= 1;
      bearishReasons.push('MACD histogram is negative (selling pressure)');
    }
  }

  // Bollinger Bands
  if (bbLower && bbUpper && bbMiddle) {
    if (currentPrice <= bbLower) {
      score += 2;
      bullishReasons.push('price has touched or broken the lower Bollinger Band (statistically oversold)');
    } else if (currentPrice < bbMiddle) {
      score += 1;
      bullishReasons.push('price is in the lower half of the Bollinger Band');
    } else if (currentPrice >= bbUpper) {
      score -= 2;
      bearishReasons.push('price has touched or broken the upper Bollinger Band (statistically overbought)');
    } else if (currentPrice > bbMiddle) {
      score -= 1;
      bearishReasons.push('price is in the upper half of the Bollinger Band');
    }
  }

  // Market structure
  if (structure.trend === 'uptrend') {
    score += 2;
    bullishReasons.push('market structure shows an uptrend with higher highs and higher lows');
  } else if (structure.trend === 'downtrend') {
    score -= 2;
    bearishReasons.push('market structure shows a downtrend with lower highs and lower lows');
  }

  // Support / Resistance proximity
  const nearSupport = srLevels.support.some(
    s => Math.abs(currentPrice - s) / currentPrice < 0.005
  );
  const nearResistance = srLevels.resistance.some(
    r => Math.abs(currentPrice - r) / currentPrice < 0.005
  );

  if (nearSupport) {
    score += 1;
    bullishReasons.push('price is near a key support level');
  }
  if (nearResistance) {
    score -= 1;
    bearishReasons.push('price is near a key resistance level');
  }

  // --- Map score to signal ---
  // Max possible score: 14 (all bullish). Min: -14.
  let signal;
  if (score >= 8) signal = SIGNALS.STRONG_BUY;
  else if (score >= 4) signal = SIGNALS.BUY;
  else if (score >= 1) signal = SIGNALS.HOLD;
  else if (score <= -8) signal = SIGNALS.STRONG_SELL;
  else if (score <= -4) signal = SIGNALS.SELL;
  else if (score <= -1) signal = SIGNALS.HOLD;
  else signal = SIGNALS.WAIT;

  // Low trend strength overrides to WAIT
  if (trendStrength < 20 && (signal === SIGNALS.BUY || signal === SIGNALS.SELL)) {
    signal = SIGNALS.WAIT;
  }

  // --- Confidence: how many of the 14 indicators align ---
  const totalChecks = 14;
  const isBullish = score > 0;
  const alignedCount = isBullish ? bullishReasons.length : bearishReasons.length;
  const confidence = Math.round((alignedCount / totalChecks) * 100);

  // --- ATR-based price levels ---
  const atr = atrVal || currentPrice * 0.005;
  let entryZone, stopLoss, takeProfits, style;

  const isBuy = signal === SIGNALS.STRONG_BUY || signal === SIGNALS.BUY;
  const isSell = signal === SIGNALS.STRONG_SELL || signal === SIGNALS.SELL;

  if (isBuy) {
    entryZone = { low: +(currentPrice - atr * 0.3).toFixed(5), high: +(currentPrice + atr * 0.2).toFixed(5) };
    stopLoss = +(currentPrice - atr * 1.5).toFixed(5);
    takeProfits = [
      +(currentPrice + atr * 1.5).toFixed(5),
      +(currentPrice + atr * 2.5).toFixed(5),
      +(currentPrice + atr * 4.0).toFixed(5),
    ];
    style = trendStrength > 60 ? 'Trend Follow' : 'Swing';
  } else if (isSell) {
    entryZone = { low: +(currentPrice - atr * 0.2).toFixed(5), high: +(currentPrice + atr * 0.3).toFixed(5) };
    stopLoss = +(currentPrice + atr * 1.5).toFixed(5);
    takeProfits = [
      +(currentPrice - atr * 1.5).toFixed(5),
      +(currentPrice - atr * 2.5).toFixed(5),
      +(currentPrice - atr * 4.0).toFixed(5),
    ];
    style = trendStrength > 60 ? 'Trend Follow' : 'Swing';
  } else {
    entryZone = null;
    stopLoss = null;
    takeProfits = [];
    style = 'N/A';
  }

  // --- Risk/Reward ---
  let riskReward = null;
  if (stopLoss && takeProfits.length > 0) {
    const risk = Math.abs(currentPrice - stopLoss);
    const reward = Math.abs(takeProfits[1] - currentPrice);
    riskReward = risk > 0 ? +(reward / risk).toFixed(2) : null;
  }

  // --- Invalidation level ---
  let invalidatedAt = null;
  if (isBuy && srLevels.support.length > 0) {
    invalidatedAt = +(srLevels.support[0] - atr * 0.5).toFixed(5);
  } else if (isSell && srLevels.resistance.length > 0) {
    invalidatedAt = +(srLevels.resistance[0] + atr * 0.5).toFixed(5);
  }

  // --- Reason string ---
  const isBuySignal = isBuy;
  const direction = isBuySignal ? 'bullish' : isSell ? 'bearish' : 'neutral';
  const primaryReasons = isBuySignal
    ? bullishReasons.slice(0, 3)
    : isSell
    ? bearishReasons.slice(0, 3)
    : [];

  let reason = '';
  if (signal === SIGNALS.WAIT || (!isBuy && !isSell)) {
    reason =
      'No clear directional bias is apparent at this time. Indicators are mixed or the trend strength is low. ' +
      'It may be worth waiting for a clearer setup before considering a position.';
  } else {
    const signalLabel = isBuySignal ? 'BUY' : 'SELL';
    reason =
      `A potential ${signalLabel} opportunity may be forming. ` +
      (primaryReasons.length > 0
        ? `This is suggested because ${primaryReasons.join(', and ')}. `
        : '') +
      `The current trend is identified as ${structure.trend} with a trend strength score of ${trendStrength}/100. ` +
      `This analysis is probabilistic in nature and does not guarantee any particular outcome. ` +
      `Always manage your risk carefully.`;
  }

  // --- Suggested risk ---
  const suggestedRisk = confidence >= 70 ? '2%' : confidence >= 50 ? '1%' : '0.5%';

  return {
    signal,
    confidence,
    entryZone,
    stopLoss,
    takeProfits,
    riskReward,
    reason,
    invalidatedAt,
    suggestedRisk,
    style,
    timeframe,
    indicators: {
      ema20: ema20Val ? +ema20Val.toFixed(5) : null,
      ema50: ema50Val ? +ema50Val.toFixed(5) : null,
      ema200: ema200Val ? +ema200Val.toFixed(5) : null,
      rsi: rsiVal ? +rsiVal.toFixed(2) : null,
      macd: macdVal ? +macdVal.toFixed(5) : null,
      macdSignal: macdSignalVal ? +macdSignalVal.toFixed(5) : null,
      macdHistogram: macdHistVal ? +macdHistVal.toFixed(5) : null,
      bbUpper: bbUpper ? +bbUpper.toFixed(5) : null,
      bbMiddle: bbMiddle ? +bbMiddle.toFixed(5) : null,
      bbLower: bbLower ? +bbLower.toFixed(5) : null,
      atr: atrVal ? +atrVal.toFixed(5) : null,
      trendStrength,
      trend: structure.trend,
      support: srLevels.support,
      resistance: srLevels.resistance,
    },
  };
}

module.exports = { generateSignal, SIGNALS };
