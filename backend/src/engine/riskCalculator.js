/**
 * Risk management calculators.
 * These are mathematical tools only - not financial advice.
 */

/**
 * Known correlation pairs between symbols (absolute correlation coefficient).
 */
const CORRELATION_PAIRS = {
  'EURUSD-GBPUSD': 0.85,
  'GBPUSD-EURUSD': 0.85,
  'EURUSD-USDCHF': -0.92,
  'USDCHF-EURUSD': -0.92,
  'AUDUSD-NZDUSD': 0.88,
  'NZDUSD-AUDUSD': 0.88,
  'BTCUSD-ETHUSD': 0.92,
  'ETHUSD-BTCUSD': 0.92,
  'BTCUSD-LTCUSD': 0.78,
  'LTCUSD-BTCUSD': 0.78,
  'XAUUSD-XAGUSD': 0.80,
  'XAGUSD-XAUUSD': 0.80,
  'USDJPY-USDCHF': 0.75,
  'USDCHF-USDJPY': 0.75,
  'EURUSD-AUDUSD': 0.70,
  'AUDUSD-EURUSD': 0.70,
};

/**
 * Maximum position limits per instrument (in units).
 */
const MAX_POSITION_LIMITS = {
  DEFAULT: 10000000,
  FOREX: 10000000,
  CRYPTO: 100,
  BTCUSD: 10,
  ETHUSD: 100,
  LTCUSD: 500,
  XAUUSD: 500,
  XAGUSD: 5000,
  US30: 100,
  SPX500: 100,
  NAS100: 50,
};

/**
 * Calculate the appropriate position size given account risk parameters.
 *
 * @param {number} accountBalance - Total account equity in account currency
 * @param {number} riskPercent - Percentage of account to risk (e.g. 1 for 1%)
 * @param {number} entryPrice - Planned entry price
 * @param {number} stopLoss - Stop loss price
 * @returns {Object} { units, lots, dollarRisk, percentRisk }
 */
function calculatePositionSize(accountBalance, riskPercent, entryPrice, stopLoss) {
  if (!accountBalance || accountBalance <= 0) throw new Error('accountBalance must be positive');
  if (!riskPercent || riskPercent <= 0 || riskPercent > 100) throw new Error('riskPercent must be between 0 and 100');
  if (!entryPrice || entryPrice <= 0) throw new Error('entryPrice must be positive');
  if (!stopLoss || stopLoss <= 0) throw new Error('stopLoss must be positive');
  if (entryPrice === stopLoss) throw new Error('entryPrice and stopLoss cannot be equal');

  const dollarRisk = (accountBalance * riskPercent) / 100;
  const priceDiff = Math.abs(entryPrice - stopLoss);
  const units = dollarRisk / priceDiff;

  // Standard lot = 100,000 units (forex convention)
  const lots = +(units / 100000).toFixed(2);

  return {
    units: Math.round(units),
    lots,
    dollarRisk: +dollarRisk.toFixed(2),
    percentRisk: +riskPercent.toFixed(2),
  };
}

/**
 * Calculate the risk/reward ratio for multiple take-profit levels.
 *
 * @param {number} entry - Entry price
 * @param {number} stopLoss - Stop loss price
 * @param {Array<number>} tpLevels - Array of take profit prices [tp1, tp2, tp3]
 * @returns {Object} { r1, r2, r3 } - R multiples for each TP level
 */
function calculateRiskReward(entry, stopLoss, tpLevels) {
  if (entry == null || stopLoss == null) throw new Error('entry and stopLoss are required');
  if (entry === stopLoss) throw new Error('entry and stopLoss cannot be equal');

  const risk = Math.abs(entry - stopLoss);

  const calcR = (tp) => {
    if (tp == null) return null;
    const reward = Math.abs(tp - entry);
    const ratio = +(reward / risk).toFixed(2);
    return {
      takeProfit: tp,
      ratio,
      riskAmount: +risk.toFixed(5),
      rewardAmount: +reward.toFixed(5),
      isViable: ratio >= 1.5,
    };
  };

  if (!Array.isArray(tpLevels)) {
    // Backwards-compatible: accept a single takeProfit number
    const single = calcR(tpLevels);
    return { r1: single, r2: null, r3: null };
  }

  return {
    r1: calcR(tpLevels[0] != null ? tpLevels[0] : null),
    r2: calcR(tpLevels[1] != null ? tpLevels[1] : null),
    r3: calcR(tpLevels[2] != null ? tpLevels[2] : null),
  };
}

/**
 * Assess whether a proposed trade size puts too much capital at risk,
 * taking into account existing open positions.
 *
 * @param {number} positionSize - Dollar value of the new position
 * @param {number} accountBalance - Total account balance
 * @param {Array<{dollarValue: number}>} openPositions - Currently open positions
 * @returns {Object} { totalExposure, totalExposurePercent, warning, severity, isWithinGuidelines }
 */
function assessTradeRisk(positionSize, accountBalance, openPositions = []) {
  if (!positionSize || positionSize <= 0) throw new Error('positionSize must be positive');
  if (!accountBalance || accountBalance <= 0) throw new Error('accountBalance must be positive');

  const existingExposure = openPositions.reduce((sum, p) => sum + (p.dollarValue || 0), 0);
  const totalExposure = existingExposure + positionSize;
  const totalExposurePercent = (totalExposure / accountBalance) * 100;
  const newPositionPercent = (positionSize / accountBalance) * 100;

  let warning = null;
  let severity = 'none';

  if (totalExposurePercent > 10) {
    severity = 'critical';
    warning =
      `WARNING: Total account exposure would reach ${totalExposurePercent.toFixed(1)}% which exceeds the 10% guideline. ` +
      `New position alone is ${newPositionPercent.toFixed(1)}% of account. Reduce position size or close existing positions first.`;
  } else if (newPositionPercent > 5) {
    severity = 'high';
    warning =
      `CAUTION: This position represents ${newPositionPercent.toFixed(1)}% of your account. ` +
      'This exceeds the commonly recommended maximum of 2% per trade. Consider reducing position size.';
  } else if (newPositionPercent > 2) {
    severity = 'moderate';
    warning =
      `NOTE: This position represents ${newPositionPercent.toFixed(1)}% of your account, which is above ` +
      'the typical 1-2% guideline for conservative risk management.';
  }

  return {
    positionPercent: +newPositionPercent.toFixed(2),
    totalExposure: +totalExposure.toFixed(2),
    totalExposurePercent: +totalExposurePercent.toFixed(2),
    warning,
    severity,
    isWithinGuidelines: totalExposurePercent <= 10 && newPositionPercent <= 2,
  };
}

/**
 * Calculate the maximum dollar loss allowed per day.
 *
 * @param {number} accountBalance - Starting account balance for the day
 * @param {number} maxLossPercent - Maximum daily loss as a percentage (default 3)
 * @returns {Object} { maxDollarLoss, maxLossPercent, remainingCapacity, shouldStopTrading }
 */
function calculateMaxDailyLoss(accountBalance, maxLossPercent = 3) {
  if (!accountBalance || accountBalance <= 0) throw new Error('accountBalance must be positive');
  if (maxLossPercent <= 0 || maxLossPercent > 100) throw new Error('maxLossPercent must be between 0 and 100');

  const maxDollarLoss = (accountBalance * maxLossPercent) / 100;

  return {
    maxDollarLoss: +maxDollarLoss.toFixed(2),
    maxLossPercent: +maxLossPercent.toFixed(2),
    accountBalance: +accountBalance.toFixed(2),
    remainingCapacity: +maxDollarLoss.toFixed(2),
    shouldStopTrading: false,
    recommendation: `Maximum daily loss is $${maxDollarLoss.toFixed(2)} (${maxLossPercent}% of $${accountBalance.toFixed(2)}). Stop trading if this threshold is reached.`,
  };
}

/**
 * Calculate the required margin for a position.
 *
 * @param {number} lotSize - Position size in lots
 * @param {number} leverage - Account leverage (e.g. 100 for 1:100)
 * @param {number} price - Current market price
 * @returns {Object} { requiredMargin, contractValue, leverage }
 */
function calculateMargin(lotSize, leverage, price) {
  if (!lotSize || lotSize <= 0) throw new Error('lotSize must be positive');
  if (!leverage || leverage <= 0) throw new Error('leverage must be positive');
  if (!price || price <= 0) throw new Error('price must be positive');

  const contractValue = lotSize * 100000 * price;
  const requiredMargin = contractValue / leverage;

  return {
    requiredMargin: +requiredMargin.toFixed(2),
    contractValue: +contractValue.toFixed(2),
    leverage,
    lotSize,
    price,
  };
}

/**
 * Calculate the overnight swap (rollover) cost for holding a position.
 *
 * @param {'buy'|'sell'} direction - Trade direction
 * @param {number} lotSize - Position size in lots
 * @param {number} swapRate - Swap rate per lot per night (can be negative)
 * @returns {Object} { swapCost, direction, lotSize, swapRate }
 */
function calculateSwap(direction, lotSize, swapRate) {
  if (!direction || !['buy', 'sell'].includes(direction.toLowerCase())) {
    throw new Error("direction must be 'buy' or 'sell'");
  }
  if (!lotSize || lotSize <= 0) throw new Error('lotSize must be positive');
  if (swapRate == null) throw new Error('swapRate is required');

  const swapCost = lotSize * swapRate;

  return {
    swapCost: +swapCost.toFixed(4),
    direction: direction.toLowerCase(),
    lotSize,
    swapRate,
    isCredit: swapCost > 0,
    isDebit: swapCost < 0,
    description: swapCost >= 0
      ? `You will receive $${Math.abs(swapCost).toFixed(4)} for holding this position overnight.`
      : `You will pay $${Math.abs(swapCost).toFixed(4)} for holding this position overnight.`,
  };
}

/**
 * Calculate the expected value (EV) per trade.
 *
 * @param {number} winRate - Win rate as a decimal (e.g. 0.55 for 55%)
 * @param {number} avgWin - Average winning trade size in account currency
 * @param {number} avgLoss - Average losing trade size in account currency (positive number)
 * @returns {Object} { expectedValue, isPositiveEV, profitFactor }
 */
function calculateExpectedValue(winRate, avgWin, avgLoss) {
  if (winRate == null || winRate < 0 || winRate > 1) throw new Error('winRate must be between 0 and 1');
  if (!avgWin || avgWin <= 0) throw new Error('avgWin must be positive');
  if (!avgLoss || avgLoss <= 0) throw new Error('avgLoss must be positive');

  const lossRate = 1 - winRate;
  const expectedValue = (winRate * avgWin) - (lossRate * avgLoss);
  const profitFactor = (winRate * avgWin) / (lossRate * avgLoss);

  return {
    expectedValue: +expectedValue.toFixed(4),
    isPositiveEV: expectedValue > 0,
    profitFactor: +profitFactor.toFixed(4),
    winRate: +winRate.toFixed(4),
    lossRate: +lossRate.toFixed(4),
    avgWin: +avgWin.toFixed(2),
    avgLoss: +avgLoss.toFixed(2),
    description: expectedValue > 0
      ? `Positive EV of $${expectedValue.toFixed(4)} per trade. This strategy has an edge.`
      : `Negative EV of $${Math.abs(expectedValue).toFixed(4)} per trade. This strategy will lose money over time.`,
  };
}

/**
 * Calculate the Sharpe Ratio for a series of returns.
 *
 * @param {Array<number>} returns - Array of periodic returns (e.g. daily P&L values)
 * @param {number} riskFreeRate - Annual risk-free rate as decimal (default 0.02 = 2%)
 * @returns {Object} { sharpeRatio, meanReturn, stdDev, interpretation }
 */
function calculateSharpeRatio(returns, riskFreeRate = 0.02) {
  if (!Array.isArray(returns) || returns.length < 2) {
    throw new Error('returns must be an array with at least 2 values');
  }

  const n = returns.length;
  const mean = returns.reduce((sum, r) => sum + r, 0) / n;

  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (n - 1);
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) throw new Error('Standard deviation is zero — all returns are identical');

  // Annualise assuming daily returns (252 trading days)
  const periodsPerYear = 252;
  const dailyRiskFreeRate = riskFreeRate / periodsPerYear;
  const excessReturn = mean - dailyRiskFreeRate;
  const sharpeRatio = (excessReturn / stdDev) * Math.sqrt(periodsPerYear);

  let interpretation;
  if (sharpeRatio >= 2) interpretation = 'Excellent risk-adjusted returns.';
  else if (sharpeRatio >= 1) interpretation = 'Good risk-adjusted returns.';
  else if (sharpeRatio >= 0) interpretation = 'Acceptable but below benchmark — consider improving strategy.';
  else interpretation = 'Negative Sharpe Ratio — strategy is underperforming the risk-free rate.';

  return {
    sharpeRatio: +sharpeRatio.toFixed(4),
    meanReturn: +mean.toFixed(6),
    stdDev: +stdDev.toFixed(6),
    sampleSize: n,
    interpretation,
  };
}

/**
 * Return a warning if two symbols are known to be highly correlated.
 *
 * @param {Array<string>} symbols - Array of symbol strings (e.g. ['EURUSD', 'GBPUSD'])
 * @returns {Array<Object>} Array of warning objects { pair, correlation, warning }
 */
function getCorrelationWarning(symbols) {
  if (!Array.isArray(symbols) || symbols.length < 2) {
    throw new Error('symbols must be an array with at least 2 symbols');
  }

  const warnings = [];
  const upperSymbols = symbols.map((s) => s.toUpperCase());

  for (let i = 0; i < upperSymbols.length; i++) {
    for (let j = i + 1; j < upperSymbols.length; j++) {
      const key = `${upperSymbols[i]}-${upperSymbols[j]}`;
      const reverseKey = `${upperSymbols[j]}-${upperSymbols[i]}`;
      const correlation = CORRELATION_PAIRS[key] || CORRELATION_PAIRS[reverseKey];

      if (correlation != null) {
        const absCorr = Math.abs(correlation);
        if (absCorr >= 0.70) {
          const direction = correlation > 0 ? 'positively' : 'negatively';
          warnings.push({
            pair: [upperSymbols[i], upperSymbols[j]],
            correlation,
            severity: absCorr >= 0.90 ? 'high' : absCorr >= 0.80 ? 'moderate' : 'low',
            warning:
              `${upperSymbols[i]} and ${upperSymbols[j]} are ${direction} correlated at ${(absCorr * 100).toFixed(0)}%. ` +
              'Trading both simultaneously increases your effective risk exposure.',
          });
        }
      }
    }
  }

  return warnings;
}

/**
 * Validate that a position size does not exceed maximum limits for the instrument.
 *
 * @param {number} units - Position size in units
 * @param {string} symbol - Instrument symbol (e.g. 'EURUSD', 'BTCUSD')
 * @returns {Object} { isValid, units, maxUnits, symbol, warning }
 */
function validatePositionSize(units, symbol) {
  if (!units || units <= 0) throw new Error('units must be positive');
  if (!symbol) throw new Error('symbol is required');

  const upperSymbol = symbol.toUpperCase();
  const maxUnits = MAX_POSITION_LIMITS[upperSymbol] || MAX_POSITION_LIMITS.DEFAULT;
  const isValid = units <= maxUnits;

  return {
    isValid,
    units,
    maxUnits,
    symbol: upperSymbol,
    warning: isValid
      ? null
      : `Position of ${units.toLocaleString()} units for ${upperSymbol} exceeds the maximum allowed limit of ${maxUnits.toLocaleString()} units. Reduce position size.`,
  };
}

module.exports = {
  calculatePositionSize,
  calculateRiskReward,
  assessTradeRisk,
  calculateMaxDailyLoss,
  calculateMargin,
  calculateSwap,
  calculateExpectedValue,
  calculateSharpeRatio,
  getCorrelationWarning,
  validatePositionSize,
};
