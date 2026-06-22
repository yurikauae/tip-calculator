const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');
const authMiddleware = require('../middleware/auth');
const { getAssetInfo } = require('../data/assetInfo');
const { calculateMaxDailyLoss } = require('../engine/riskCalculator');

const router = express.Router();

const COMMISSION_RATE = 0.001; // 0.1% of position value
const STARTING_BALANCE = 10000;

// Generate a mock current price based on entry price with small random drift
function getMockCurrentPrice(symbol, entryPrice) {
  // Deterministic-ish drift using symbol hash + time bucket so repeated calls are stable within same minute
  const seed = symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const timeBucket = Math.floor(Date.now() / 60000);
  const pseudo = Math.sin(seed * timeBucket) * 0.5 + 0.5; // 0..1
  const driftPct = (pseudo - 0.5) * 0.004; // ±0.2%
  return parseFloat((entryPrice * (1 + driftPct)).toFixed(5));
}

// Apply 1–3 pip slippage in the direction that is worse for the trader
function applySlippage(price, tradeType, asset) {
  const pipSize = asset ? asset.pipSize : 0.0001;
  const spread = asset ? asset.typicalSpread : 1;
  // Slippage is 1–3 pips drawn from the spread range, minimum 1 pip
  const slippagePips = Math.max(1, Math.min(3, spread));
  const slippageAmount = slippagePips * pipSize;
  // BUY fills higher (worse for buyer), SELL fills lower (worse for seller)
  if (tradeType === 'BUY') {
    return parseFloat((price + slippageAmount).toFixed(5));
  } else {
    return parseFloat((price - slippageAmount).toFixed(5));
  }
}

function calculatePriceRisk(asset, entryPrice, stopPrice, lots) {
  const distanceInPips = Math.abs(entryPrice - stopPrice) / asset.pipSize;
  return distanceInPips * asset.pipValue * lots;
}

function calculatePnL(trade, exitPrice) {
  const qty = trade.quantity; // lots
  const entry = trade.entry_price;
  const asset = getAssetInfo(trade.symbol);

  const distanceInPips = Math.abs(exitPrice - entry) / (asset?.pipSize || 1);
  const grossPnl = distanceInPips * (asset?.pipValue || 1) * qty;
  let pnl = trade.tradeType === 'BUY'
    ? (exitPrice >= entry ? grossPnl : -grossPnl)
    : (exitPrice <= entry ? grossPnl : -grossPnl);

  // Subtract both sides commission (open + close)
  const positionValue = entry * qty;
  const closeCommission = positionValue * COMMISSION_RATE;
  pnl -= closeCommission;

  const pnlPercent = (pnl / (entry * qty)) * 100;
  return {
    pnl: parseFloat(pnl.toFixed(4)),
    pnlPercent: parseFloat(pnlPercent.toFixed(4)),
    closeCommission: parseFloat(closeCommission.toFixed(4))
  };
}

function getAccountBalance(db, userId) {
  const settings = db.get('user_settings').find({ user_id: userId }).value();
  if (settings && settings.paper_balance !== undefined) {
    return settings.paper_balance;
  }
  return STARTING_BALANCE;
}

function setAccountBalance(db, userId, balance) {
  const now = new Date().toISOString();
  db.get('user_settings').find({ user_id: userId }).assign({
    paper_balance: parseFloat(balance.toFixed(4)),
    updated_at: now
  }).write();
}

// GET /api/paper-trades
router.get('/', authMiddleware, (req, res, next) => {
  try {
    const db = getDb();
    const { status, symbol, limit = 20, offset = 0 } = req.query;

    let trades = db.get('paper_trades').filter({ user_id: req.user.userId }).value();

    if (status && ['open', 'closed', 'cancelled'].includes(status.toLowerCase())) {
      trades = trades.filter(t => t.status === status.toLowerCase());
    }

    if (symbol) {
      trades = trades.filter(t => t.symbol === symbol.toUpperCase());
    }

    trades.sort((a, b) => new Date(b.opened_at) - new Date(a.opened_at));

    const total = trades.length;
    const paginated = trades.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    const allTrades = db.get('paper_trades').filter({ user_id: req.user.userId }).value();
    const openTrades = allTrades.filter(t => t.status === 'open');
    const closedTrades = allTrades.filter(t => t.status === 'closed');

    const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0).length;
    const winRate = closedTrades.length > 0 ? (winningTrades / closedTrades.length) * 100 : 0;

    res.json({
      trades: paginated,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      stats: {
        openPositions: openTrades.length,
        closedTrades: closedTrades.length,
        totalPnL: parseFloat(totalPnL.toFixed(4)),
        winRate: parseFloat(winRate.toFixed(2)),
        winningTrades,
        losingTrades: closedTrades.length - winningTrades
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/paper-trades/summary
router.get('/summary', authMiddleware, (req, res, next) => {
  try {
    const db = getDb();
    const allTrades = db.get('paper_trades').filter({ user_id: req.user.userId }).value();

    const openTrades = allTrades.filter(t => t.status === 'open');
    const closedTrades = allTrades.filter(t => t.status === 'closed');

    const totalPnl = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const totalCommissions = allTrades.reduce((sum, t) => sum + (t.commission || 0) + (t.closeCommission || 0), 0);

    const winners = closedTrades.filter(t => (t.pnl || 0) > 0);
    const losers = closedTrades.filter(t => (t.pnl || 0) < 0);

    const winRate = closedTrades.length > 0 ? (winners.length / closedTrades.length) * 100 : 0;
    const avgWin = winners.length > 0 ? winners.reduce((s, t) => s + t.pnl, 0) / winners.length : 0;
    const avgLoss = losers.length > 0 ? losers.reduce((s, t) => s + t.pnl, 0) / losers.length : 0;

    const bestTrade = closedTrades.length > 0
      ? closedTrades.reduce((best, t) => (t.pnl || 0) > (best.pnl || 0) ? t : best, closedTrades[0])
      : null;
    const worstTrade = closedTrades.length > 0
      ? closedTrades.reduce((worst, t) => (t.pnl || 0) < (worst.pnl || 0) ? t : worst, closedTrades[0])
      : null;

    const currentBalance = getAccountBalance(db, req.user.userId);

    res.json({
      totalPnl: parseFloat(totalPnl.toFixed(4)),
      winRate: parseFloat(winRate.toFixed(2)),
      avgWin: parseFloat(avgWin.toFixed(4)),
      avgLoss: parseFloat(avgLoss.toFixed(4)),
      totalTrades: allTrades.length,
      openPositions: openTrades.length,
      totalCommissions: parseFloat(totalCommissions.toFixed(4)),
      bestTrade: bestTrade ? { id: bestTrade.id, symbol: bestTrade.symbol, pnl: bestTrade.pnl } : null,
      worstTrade: worstTrade ? { id: worstTrade.id, symbol: worstTrade.symbol, pnl: worstTrade.pnl } : null,
      currentBalance,
      startingBalance: STARTING_BALANCE
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/paper-trades/positions/live
router.get('/positions/live', authMiddleware, (req, res, next) => {
  try {
    const db = getDb();
    const openTrades = db.get('paper_trades')
      .filter({ user_id: req.user.userId })
      .value()
      .filter(t => t.status === 'open');

    const positions = openTrades.map(trade => {
      const mockPrice = getMockCurrentPrice(trade.symbol, trade.entry_price);
      const { pnl: estimatedPnl, pnlPercent } = calculatePnL(trade, mockPrice);
      return {
        ...trade,
        currentPrice: mockPrice,
        estimatedCurrentPnl: estimatedPnl,
        estimatedPnlPercent: pnlPercent
      };
    });

    res.json({ positions });
  } catch (err) {
    next(err);
  }
});

// GET /api/paper-trades/:id
router.get('/:id', authMiddleware, (req, res, next) => {
  try {
    const db = getDb();
    const trade = db.get('paper_trades').find({ id: req.params.id, user_id: req.user.userId }).value();

    if (!trade) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    res.json({ trade });
  } catch (err) {
    next(err);
  }
});

// POST /api/paper-trades - Open a new paper trade
router.post('/', authMiddleware, (req, res, next) => {
  try {
    const { symbol, tradeType, quantity, entry_price, stop_loss, take_profit, notes, strategy_id } = req.body;

    if (!symbol || !tradeType || !quantity || !entry_price || !stop_loss) {
      return res.status(400).json({ error: 'symbol, tradeType, quantity, entry_price, and stop_loss are required' });
    }

    const normalizedSymbol = symbol.toUpperCase().trim();
    const normalizedType = tradeType.toUpperCase();

    // Validate symbol exists
    const asset = getAssetInfo(normalizedSymbol);
    if (!asset) {
      return res.status(400).json({ error: `Unknown symbol: ${normalizedSymbol}. Check /api/market/symbols for valid symbols.` });
    }

    // Validate tradeType
    if (!['BUY', 'SELL'].includes(normalizedType)) {
      return res.status(400).json({ error: 'tradeType must be BUY or SELL' });
    }

    // Validate lot size (0.01 to 100)
    const lotSize = parseFloat(quantity);
    if (isNaN(lotSize) || lotSize < 0.01 || lotSize > 100) {
      return res.status(400).json({ error: 'quantity (lot size) must be between 0.01 and 100' });
    }

    const rawEntryPrice = parseFloat(entry_price);
    if (isNaN(rawEntryPrice) || rawEntryPrice <= 0) {
      return res.status(400).json({ error: 'entry_price must be a positive number' });
    }
    const stopLoss = parseFloat(stop_loss);
    if (isNaN(stopLoss) || stopLoss <= 0) {
      return res.status(400).json({ error: 'stop_loss must be a positive number' });
    }
    if (normalizedType === 'BUY' && stopLoss >= rawEntryPrice) {
      return res.status(400).json({ error: 'BUY stop_loss must be below entry_price' });
    }
    if (normalizedType === 'SELL' && stopLoss <= rawEntryPrice) {
      return res.status(400).json({ error: 'SELL stop_loss must be above entry_price' });
    }

    // Apply 1–3 pip slippage
    const filledPrice = applySlippage(rawEntryPrice, normalizedType, asset);

    // Deduct commission (0.1% of position value at open)
    const positionValue = filledPrice * lotSize;
    const commission = parseFloat((positionValue * COMMISSION_RATE).toFixed(4));

    const db = getDb();

    // Deduct commission from account balance
    const currentBalance = getAccountBalance(db, req.user.userId);
    const plannedRisk = calculatePriceRisk(asset, filledPrice, stopLoss, lotSize);
    const plannedRiskPercent = (plannedRisk / currentBalance) * 100;
    if (plannedRiskPercent > 2) {
      return res.status(422).json({
        error: 'Trade rejected by risk policy',
        details: [`Planned stop loss equals ${plannedRiskPercent.toFixed(2)}% of equity; the maximum is 2%.`],
      });
    }

    const today = new Date().toISOString().slice(0, 10);
    const todaysClosedTrades = db.get('paper_trades')
      .filter({ user_id: req.user.userId })
      .value()
      .filter(trade => trade.status === 'closed' && String(trade.closed_at || '').startsWith(today));
    const dailyRisk = calculateMaxDailyLoss(currentBalance, todaysClosedTrades);
    if (dailyRisk.shouldStopTrading) {
      return res.status(422).json({ error: 'Daily loss limit reached', details: [dailyRisk.recommendation] });
    }

    if (currentBalance < commission) {
      return res.status(400).json({ error: 'Insufficient balance to cover commission' });
    }
    setAccountBalance(db, req.user.userId, currentBalance - commission);

    const id = uuidv4();
    const now = new Date().toISOString();

    const newTrade = {
      id,
      user_id: req.user.userId,
      symbol: normalizedSymbol,
      tradeType: normalizedType,
      direction: normalizedType === 'BUY' ? 'long' : 'short', // backward-compat alias
      quantity: lotSize,
      entry_price: filledPrice,
      requested_price: rawEntryPrice,
      exit_price: null,
      stop_loss: stopLoss,
      take_profit: take_profit ? parseFloat(take_profit) : null,
      commission,
      closeCommission: null,
      notes: notes || null,
      strategy_id: strategy_id || null,
      status: 'open',
      closeReason: null,
      pnl: null,
      pnl_percent: null,
      opened_at: now,
      closed_at: null
    };

    db.get('paper_trades').push(newTrade).write();

    res.status(201).json({
      trade: newTrade,
      risk: {
        amount: parseFloat(plannedRisk.toFixed(2)),
        percent: parseFloat(plannedRiskPercent.toFixed(2)),
        maxPerTradePercent: 2,
        maxDailyLossPercent: 5,
      },
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/paper-trades/:id/close - Close a trade
router.put('/:id/close', authMiddleware, (req, res, next) => {
  try {
    const db = getDb();
    const trade = db.get('paper_trades').find({ id: req.params.id, user_id: req.user.userId }).value();

    if (!trade) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    if (trade.status !== 'open') {
      return res.status(400).json({ error: 'Cannot close a trade that is not open' });
    }

    const { exit_price, closeReason } = req.body;

    if (!exit_price) {
      return res.status(400).json({ error: 'exit_price is required' });
    }

    const exitPrice = parseFloat(exit_price);
    if (isNaN(exitPrice) || exitPrice <= 0) {
      return res.status(400).json({ error: 'exit_price must be a positive number' });
    }

    // Determine close reason
    const validReasons = ['manual', 'sl_hit', 'tp_hit'];
    let resolvedReason = closeReason || 'manual';
    if (!validReasons.includes(resolvedReason)) {
      resolvedReason = 'manual';
    }

    const { pnl, pnlPercent, closeCommission } = calculatePnL(trade, exitPrice);
    const now = new Date().toISOString();

    // Update account balance with P&L (commission already deducted on open and close)
    const currentBalance = getAccountBalance(db, req.user.userId);
    setAccountBalance(db, req.user.userId, currentBalance + pnl);

    const updates = {
      exit_price: exitPrice,
      status: 'closed',
      closeReason: resolvedReason,
      closeCommission,
      pnl,
      pnl_percent: pnlPercent,
      closed_at: now
    };

    db.get('paper_trades').find({ id: trade.id }).assign(updates).write();

    const updated = db.get('paper_trades').find({ id: trade.id }).value();
    res.json({ trade: updated });
  } catch (err) {
    next(err);
  }
});

// PUT /api/paper-trades/:id - General update (stop loss, take profit, notes)
router.put('/:id', authMiddleware, (req, res, next) => {
  try {
    const db = getDb();
    const trade = db.get('paper_trades').find({ id: req.params.id, user_id: req.user.userId }).value();

    if (!trade) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    if (trade.status !== 'open') {
      return res.status(400).json({ error: 'Cannot modify a closed or cancelled trade' });
    }

    const { stop_loss, take_profit, notes } = req.body;
    const now = new Date().toISOString();

    const updates = {};
    if (stop_loss !== undefined) updates.stop_loss = parseFloat(stop_loss);
    if (take_profit !== undefined) updates.take_profit = parseFloat(take_profit);
    if (notes !== undefined) updates.notes = notes;
    updates.updated_at = now;

    db.get('paper_trades').find({ id: trade.id }).assign(updates).write();

    const updated = db.get('paper_trades').find({ id: trade.id }).value();
    res.json({ trade: updated });
  } catch (err) {
    next(err);
  }
});

// POST /api/paper-trades/reset - Reset paper trading account
router.post('/reset', authMiddleware, (req, res, next) => {
  try {
    const db = getDb();
    const now = new Date().toISOString();

    // Close all open positions for this user
    const openTrades = db.get('paper_trades')
      .filter({ user_id: req.user.userId })
      .value()
      .filter(t => t.status === 'open');

    openTrades.forEach(trade => {
      db.get('paper_trades').find({ id: trade.id }).assign({
        status: 'cancelled',
        closeReason: 'account_reset',
        closed_at: now
      }).write();
    });

    // Reset balance to $10,000
    setAccountBalance(db, req.user.userId, STARTING_BALANCE);

    res.json({
      message: 'Paper trading account reset successfully',
      balance: STARTING_BALANCE,
      closedPositions: openTrades.length
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/paper-trades/:id
router.delete('/:id', authMiddleware, (req, res, next) => {
  try {
    const db = getDb();
    const trade = db.get('paper_trades').find({ id: req.params.id, user_id: req.user.userId }).value();

    if (!trade) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    db.get('paper_trades').remove({ id: trade.id }).write();
    res.json({ message: 'Trade deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
