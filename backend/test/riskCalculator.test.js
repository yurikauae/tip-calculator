const test = require('node:test');
const assert = require('node:assert/strict');
const {
  calculatePositionSize,
  calculateRiskReward,
  calculateMaxDailyLoss,
} = require('../src/engine/riskCalculator');

test('position sizing caps loss at the selected account risk', () => {
  const result = calculatePositionSize(10000, 1, 100, 98);
  assert.equal(result.dollarRisk, 100);
  assert.equal(result.units, 50);
});

test('risk reward reports a two-to-one setup', () => {
  const result = calculateRiskReward(100, 98, 104);
  assert.equal(result.r1.ratio, 2);
  assert.equal(result.r1.isViable, true);
});

test('daily loss guard stops trading at five percent', () => {
  const result = calculateMaxDailyLoss(10000, [{ pnl: -250 }, { pnl: -250 }]);
  assert.equal(result.shouldStopTrading, true);
  assert.equal(result.dailyLossPercent, 5);
});
