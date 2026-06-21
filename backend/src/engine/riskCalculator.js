/**
 * Risk management calculators.
 * These are mathematical tools only - not financial advice.
 */

/**
 * Calculate the appropriate position size given account risk parameters.
 *
 * @param {number} accountBalance - Total account equity in account currency
 * @param {number} riskPercent - Percentage of account to risk (e.g. 1 for 1%)
 * @param {number} entryPrice - Planned entry price
 * @param {number} stopLoss - Stop loss price
 * @returns {Object} { positionSize, riskAmount, pipsAtRisk, lotSize }
 */
function calculatePositionSize(accountBalance, riskPercent, entryPrice, stopLoss) {
  if (!accountBalance || accountBalance <= 0) throw new Error('accountBalance must be positive');
  if (!riskPercent || riskPercent <= 0 || riskPercent > 100) throw new Error('riskPercent must be between 0 and 100');
  if (!entryPrice || entryPrice <= 0) throw new Error('entryPrice must be positive');
  if (!stopLoss || stopLoss <= 0) throw new Error('stopLoss must be positive');
  if (entryPrice === stopLoss) throw new Error('entryPrice and stopLoss cannot be equal');

  const riskAmount = (accountBalance * riskPercent) / 100;
  const priceDiff = Math.abs(entryPrice - stopLoss);
  const positionSize = riskAmount / priceDiff;

  // Approximate lot size for forex (standard lot = 100,000 units)
  const lotSize = +(positionSize / 100000).toFixed(2);

  return {
    positionSize: +positionSize.toFixed(2),
    riskAmount: +riskAmount.toFixed(2),
    priceDiff: +priceDiff.toFixed(5),
    lotSize,
    units: Math.round(positionSize),
  };
}

/**
 * Calculate the risk/reward ratio for a trade.
 *
 * @param {number} entry - Entry price
 * @param {number} stopLoss - Stop loss price
 * @param {number} takeProfit - Take profit price
 * @returns {Object} { ratio, riskPips, rewardPips, isViable }
 */
function calculateRiskReward(entry, stopLoss, takeProfit) {
  if (!entry || !stopLoss || !takeProfit) throw new Error('entry, stopLoss, and takeProfit are required');

  const risk = Math.abs(entry - stopLoss);
  const reward = Math.abs(takeProfit - entry);

  if (risk === 0) throw new Error('Risk (entry to stopLoss distance) cannot be zero');

  const ratio = +(reward / risk).toFixed(2);

  // A trade is generally considered viable at >= 1.5 R:R
  const isViable = ratio >= 1.5;

  return {
    ratio,
    riskAmount: +risk.toFixed(5),
    rewardAmount: +reward.toFixed(5),
    isViable,
    note: isViable
      ? `${ratio}:1 R:R is acceptable for most trading strategies.`
      : `${ratio}:1 R:R is below the recommended minimum of 1.5:1. Consider adjusting your levels.`,
  };
}

/**
 * Assess whether a proposed trade size puts too much capital at risk.
 *
 * @param {number} positionSize - Size of the position in account currency units
 * @param {number} accountBalance - Total account balance
 * @returns {Object} { riskPercent, warning, severity }
 */
function assessTradeRisk(positionSize, accountBalance) {
  if (!positionSize || positionSize <= 0) throw new Error('positionSize must be positive');
  if (!accountBalance || accountBalance <= 0) throw new Error('accountBalance must be positive');

  const riskPercent = (positionSize / accountBalance) * 100;
  let warning = null;
  let severity = 'none';

  if (riskPercent > 10) {
    severity = 'critical';
    warning =
      `WARNING: This position represents ${riskPercent.toFixed(1)}% of your account, which is extremely high. ` +
      'Most professional risk managers recommend never risking more than 2% per trade. ' +
      'A single losing trade at this size could severely damage your account.';
  } else if (riskPercent > 5) {
    severity = 'high';
    warning =
      `CAUTION: This position represents ${riskPercent.toFixed(1)}% of your account. ` +
      'This exceeds the commonly recommended maximum of 2% per trade. ' +
      'Consider reducing your position size.';
  } else if (riskPercent > 2) {
    severity = 'moderate';
    warning =
      `NOTE: This position represents ${riskPercent.toFixed(1)}% of your account, which is above the ' +
      'typical 1-2% guideline for conservative risk management.`;
  } else {
    severity = 'none';
    warning = null;
  }

  return {
    riskPercent: +riskPercent.toFixed(2),
    warning,
    severity,
    isWithinGuidelines: riskPercent <= 2,
  };
}

/**
 * Calculate the maximum daily loss based on a series of trades.
 *
 * @param {number} accountBalance - Starting account balance for the day
 * @param {Array} trades - Array of { pnl: number } objects
 * @returns {Object} { totalLoss, totalGain, netPnl, maxDrawdown, dailyLossPercent, shouldStopTrading }
 */
function calculateMaxDailyLoss(accountBalance, trades = []) {
  if (!accountBalance || accountBalance <= 0) throw new Error('accountBalance must be positive');

  let runningBalance = accountBalance;
  let peakBalance = accountBalance;
  let maxDrawdown = 0;

  let totalLoss = 0;
  let totalGain = 0;

  for (const trade of trades) {
    const pnl = trade.pnl || 0;
    runningBalance += pnl;

    if (pnl < 0) totalLoss += Math.abs(pnl);
    else totalGain += pnl;

    if (runningBalance > peakBalance) peakBalance = runningBalance;
    const drawdown = peakBalance - runningBalance;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }

  const netPnl = runningBalance - accountBalance;
  const dailyLossPercent = (totalLoss / accountBalance) * 100;

  // Most prop firms and risk guidelines suggest stopping at 5% daily drawdown
  const shouldStopTrading = dailyLossPercent >= 5 || (netPnl < 0 && Math.abs(netPnl) / accountBalance >= 0.05);

  return {
    totalLoss: +totalLoss.toFixed(2),
    totalGain: +totalGain.toFixed(2),
    netPnl: +netPnl.toFixed(2),
    maxDrawdown: +maxDrawdown.toFixed(2),
    maxDrawdownPercent: +((maxDrawdown / accountBalance) * 100).toFixed(2),
    dailyLossPercent: +dailyLossPercent.toFixed(2),
    currentBalance: +runningBalance.toFixed(2),
    shouldStopTrading,
    recommendation: shouldStopTrading
      ? 'Daily loss limit reached. Consider stopping trading for the remainder of the day to protect your account.'
      : `You have used ${dailyLossPercent.toFixed(1)}% of your daily loss allowance. Remaining capacity: ${(5 - dailyLossPercent).toFixed(1)}%.`,
  };
}

module.exports = {
  calculatePositionSize,
  calculateRiskReward,
  assessTradeRisk,
  calculateMaxDailyLoss,
};
