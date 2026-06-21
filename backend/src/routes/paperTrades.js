const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');
const authMiddleware = require('../middleware/auth');
const { validatePaperTrade } = require('../middleware/validate');

const router = express.Router();

function calculatePnL(trade, exitPrice) {
  const qty = trade.quantity;
  const entry = trade.entry_price;
  const fees = trade.fees || 0;

  let pnl;
  if (trade.direction === 'long') {
    pnl = (exitPrice - entry) * qty - fees;
  } else {
    pnl = (entry - exitPrice) * qty - fees;
  }

  const pnlPercent = (pnl / (entry * qty)) * 100;
  return { pnl: parseFloat(pnl.toFixed(4)), pnlPercent: parseFloat(pnlPercent.toFixed(4)) };
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

    // Sort by opened_at DESC
    trades.sort((a, b) => new Date(b.opened_at) - new Date(a.opened_at));

    const total = trades.length;
    const paginated = trades.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    // Portfolio stats
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

    const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0).length;
    const losingTrades = closedTrades.filter(t => (t.pnl || 0) <= 0).length;
    const winRate = closedTrades.length > 0 ? (winningTrades / closedTrades.length) * 100 : 0;

    const avgWin = winningTrades > 0
      ? closedTrades.filter(t => (t.pnl || 0) > 0).reduce((sum, t) => sum + t.pnl, 0) / winningTrades
      : 0;
    const avgLoss = losingTrades > 0
      ? closedTrades.filter(t => (t.pnl || 0) <= 0).reduce((sum, t) => sum + t.pnl, 0) / losingTrades
      : 0;

    res.json({
      summary: {
        totalTrades: allTrades.length,
        openPositions: openTrades.length,
        closedTrades: closedTrades.length,
        totalPnL: parseFloat(totalPnL.toFixed(4)),
        winRate: parseFloat(winRate.toFixed(2)),
        winningTrades,
        losingTrades,
        avgWin: parseFloat(avgWin.toFixed(4)),
        avgLoss: parseFloat(avgLoss.toFixed(4))
      }
    });
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
router.post('/', authMiddleware, validatePaperTrade, (req, res, next) => {
  try {
    const { symbol, direction, quantity, entry_price, stop_loss, take_profit, notes, strategy_id, trade_type, fees } = req.body;
    const db = getDb();
    const id = uuidv4();
    const now = new Date().toISOString();

    const newTrade = {
      id,
      user_id: req.user.userId,
      symbol: symbol.toUpperCase().trim(),
      trade_type: trade_type || 'market',
      direction: direction.toLowerCase(),
      quantity: parseFloat(quantity),
      entry_price: parseFloat(entry_price),
      exit_price: null,
      stop_loss: stop_loss ? parseFloat(stop_loss) : null,
      take_profit: take_profit ? parseFloat(take_profit) : null,
      fees: fees ? parseFloat(fees) : 0,
      notes: notes || null,
      strategy_id: strategy_id || null,
      status: 'open',
      pnl: null,
      pnl_percent: null,
      opened_at: now,
      closed_at: null
    };

    db.get('paper_trades').push(newTrade).write();

    res.status(201).json({ trade: newTrade });
  } catch (err) {
    next(err);
  }
});

// PUT /api/paper-trades/:id - Update or close a trade
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

    const { exit_price, stop_loss, take_profit, notes, status } = req.body;
    const now = new Date().toISOString();

    let pnl = trade.pnl;
    let pnlPercent = trade.pnl_percent;
    let closedAt = trade.closed_at;
    let finalStatus = status || trade.status;

    if (exit_price !== undefined && (status === 'closed' || !status)) {
      const result = calculatePnL(trade, parseFloat(exit_price));
      pnl = result.pnl;
      pnlPercent = result.pnlPercent;
      closedAt = now;
      finalStatus = 'closed';
    } else if (status === 'cancelled') {
      finalStatus = 'cancelled';
      closedAt = now;
    }

    const updates = {
      exit_price: exit_price !== undefined ? parseFloat(exit_price) : trade.exit_price,
      stop_loss: stop_loss !== undefined ? parseFloat(stop_loss) : trade.stop_loss,
      take_profit: take_profit !== undefined ? parseFloat(take_profit) : trade.take_profit,
      notes: notes !== undefined ? notes : trade.notes,
      status: finalStatus,
      closed_at: closedAt,
      pnl,
      pnl_percent: pnlPercent
    };

    db.get('paper_trades').find({ id: trade.id }).assign(updates).write();

    const updated = db.get('paper_trades').find({ id: trade.id }).value();
    res.json({ trade: updated });
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
