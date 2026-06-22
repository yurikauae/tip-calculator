const test = require('node:test');
const assert = require('node:assert/strict');
const { generateSignal } = require('../src/engine/signalGenerator');

function candles(count = 260) {
  return Array.from({ length: count }, (_, index) => {
    const close = 100 + index * 0.1 + Math.sin(index / 5);
    return {
      timestamp: Date.now() - (count - index) * 3600000,
      open: close - 0.2,
      high: close + 0.5,
      low: close - 0.5,
      close,
      volume: 1000 + index,
    };
  });
}

test('signal output contains explainability and risk controls', () => {
  const result = generateSignal('TEST', candles(), '1h');
  assert.match(result.signal, /Strong Buy|Buy|Hold|Sell|Strong Sell|Wait/);
  assert.equal(typeof result.confidence, 'number');
  assert.equal(typeof result.reason, 'string');
  assert.ok(result.reason.length > 30);
  assert.ok(Object.hasOwn(result.indicators, 'ema9'));
  assert.ok(Object.hasOwn(result.indicators, 'ema200'));
  assert.ok(Object.hasOwn(result.indicators, 'atr'));
  assert.match(result.suggestedRisk, /0.5%|1%|2%/);
});
