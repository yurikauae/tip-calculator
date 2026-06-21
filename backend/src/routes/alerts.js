const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');
const authMiddleware = require('../middleware/auth');
const { validateAlert } = require('../middleware/validate');

const router = express.Router();

// GET /api/alerts
router.get('/', authMiddleware, (req, res, next) => {
  try {
    const db = getDb();
    const { symbol, is_active, limit = 50, offset = 0 } = req.query;

    let alerts = db.get('alerts').filter({ user_id: req.user.userId }).value();

    if (symbol) {
      alerts = alerts.filter(a => a.symbol === symbol.toUpperCase());
    }

    if (is_active !== undefined) {
      const activeVal = is_active === 'true';
      alerts = alerts.filter(a => a.is_active === activeVal);
    }

    // Sort by created_at DESC
    alerts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const total = alerts.length;
    const paginated = alerts.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.json({
      alerts: paginated,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/alerts/:id
router.get('/:id', authMiddleware, (req, res, next) => {
  try {
    const db = getDb();
    const alert = db.get('alerts').find({ id: req.params.id, user_id: req.user.userId }).value();

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json({ alert });
  } catch (err) {
    next(err);
  }
});

// POST /api/alerts
router.post('/', authMiddleware, validateAlert, (req, res, next) => {
  try {
    const { symbol, alert_type, condition, target_value, message } = req.body;
    const db = getDb();
    const id = uuidv4();
    const now = new Date().toISOString();

    const newAlert = {
      id,
      user_id: req.user.userId,
      symbol: symbol.toUpperCase().trim(),
      alert_type,
      condition,
      target_value: parseFloat(target_value),
      message: message || null,
      is_active: true,
      is_triggered: false,
      triggered_at: null,
      created_at: now,
      updated_at: now
    };

    db.get('alerts').push(newAlert).write();

    res.status(201).json({ alert: newAlert });
  } catch (err) {
    next(err);
  }
});

// PUT /api/alerts/:id
router.put('/:id', authMiddleware, (req, res, next) => {
  try {
    const db = getDb();
    const alert = db.get('alerts').find({ id: req.params.id, user_id: req.user.userId }).value();

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    const { alert_type, condition, target_value, message, is_active } = req.body;
    const now = new Date().toISOString();

    if (condition !== undefined && !['above', 'below', 'crosses_above', 'crosses_below'].includes(condition)) {
      return res.status(400).json({ error: 'Invalid condition value' });
    }

    const updates = {
      alert_type: alert_type !== undefined ? alert_type : alert.alert_type,
      condition: condition !== undefined ? condition : alert.condition,
      target_value: target_value !== undefined ? parseFloat(target_value) : alert.target_value,
      message: message !== undefined ? message : alert.message,
      is_active: is_active !== undefined ? Boolean(is_active) : alert.is_active,
      updated_at: now
    };

    db.get('alerts').find({ id: alert.id }).assign(updates).write();

    const updated = db.get('alerts').find({ id: alert.id }).value();
    res.json({ alert: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/alerts/:id
router.delete('/:id', authMiddleware, (req, res, next) => {
  try {
    const db = getDb();
    const alert = db.get('alerts').find({ id: req.params.id, user_id: req.user.userId }).value();

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    db.get('alerts').remove({ id: alert.id }).write();
    res.json({ message: 'Alert deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// POST /api/alerts/:id/dismiss - Mark alert as triggered/dismissed
router.post('/:id/dismiss', authMiddleware, (req, res, next) => {
  try {
    const db = getDb();
    const alert = db.get('alerts').find({ id: req.params.id, user_id: req.user.userId }).value();

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    const now = new Date().toISOString();
    db.get('alerts').find({ id: alert.id }).assign({
      is_active: false,
      is_triggered: true,
      triggered_at: now,
      updated_at: now
    }).write();

    const updated = db.get('alerts').find({ id: alert.id }).value();
    res.json({ alert: updated });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
