const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const VALID_THEMES = ['dark', 'light', 'system'];
const VALID_TIMEFRAMES = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'];
const VALID_CHART_TYPES = ['candlestick', 'line', 'bar', 'area'];
const VALID_RISK_TOLERANCES = ['low', 'medium', 'high'];

const DEFAULT_SETTINGS = {
  theme: 'dark',
  default_timeframe: '1h',
  default_chart_type: 'candlestick',
  currency: 'USD',
  timezone: 'UTC',
  notifications_enabled: true,
  email_alerts: false,
  risk_tolerance: 'medium',
  default_paper_capital: 10000,
  indicators_config: null,
  layout_config: null
};

// GET /api/settings
router.get('/', authMiddleware, (req, res, next) => {
  try {
    const db = getDb();
    let settings = db.get('user_settings').find({ user_id: req.user.userId }).value();

    if (!settings) {
      // Create default settings if not exist
      const now = new Date().toISOString();
      settings = {
        id: uuidv4(),
        user_id: req.user.userId,
        ...DEFAULT_SETTINGS,
        created_at: now,
        updated_at: now
      };
      db.get('user_settings').push(settings).write();
    }

    res.json({ settings });
  } catch (err) {
    next(err);
  }
});

// PUT /api/settings
router.put('/', authMiddleware, (req, res, next) => {
  try {
    const db = getDb();
    let settings = db.get('user_settings').find({ user_id: req.user.userId }).value();

    if (!settings) {
      return res.status(404).json({ error: 'Settings not found' });
    }

    const {
      theme, default_timeframe, default_chart_type, currency, timezone,
      notifications_enabled, email_alerts, risk_tolerance,
      default_paper_capital, indicators_config, layout_config
    } = req.body;

    const errors = [];

    if (theme !== undefined && !VALID_THEMES.includes(theme)) {
      errors.push(`Theme must be one of: ${VALID_THEMES.join(', ')}`);
    }
    if (default_timeframe !== undefined && !VALID_TIMEFRAMES.includes(default_timeframe)) {
      errors.push(`Timeframe must be one of: ${VALID_TIMEFRAMES.join(', ')}`);
    }
    if (default_chart_type !== undefined && !VALID_CHART_TYPES.includes(default_chart_type)) {
      errors.push(`Chart type must be one of: ${VALID_CHART_TYPES.join(', ')}`);
    }
    if (risk_tolerance !== undefined && !VALID_RISK_TOLERANCES.includes(risk_tolerance)) {
      errors.push(`Risk tolerance must be one of: ${VALID_RISK_TOLERANCES.join(', ')}`);
    }
    if (default_paper_capital !== undefined && (isNaN(default_paper_capital) || Number(default_paper_capital) <= 0)) {
      errors.push('Default paper capital must be a positive number');
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    const now = new Date().toISOString();

    const updates = {
      theme: theme !== undefined ? theme : settings.theme,
      default_timeframe: default_timeframe !== undefined ? default_timeframe : settings.default_timeframe,
      default_chart_type: default_chart_type !== undefined ? default_chart_type : settings.default_chart_type,
      currency: currency !== undefined ? currency : settings.currency,
      timezone: timezone !== undefined ? timezone : settings.timezone,
      notifications_enabled: notifications_enabled !== undefined ? Boolean(notifications_enabled) : settings.notifications_enabled,
      email_alerts: email_alerts !== undefined ? Boolean(email_alerts) : settings.email_alerts,
      risk_tolerance: risk_tolerance !== undefined ? risk_tolerance : settings.risk_tolerance,
      default_paper_capital: default_paper_capital !== undefined ? parseFloat(default_paper_capital) : settings.default_paper_capital,
      indicators_config: indicators_config !== undefined ? indicators_config : settings.indicators_config,
      layout_config: layout_config !== undefined ? layout_config : settings.layout_config,
      updated_at: now
    };

    db.get('user_settings').find({ user_id: req.user.userId }).assign(updates).write();

    const updated = db.get('user_settings').find({ user_id: req.user.userId }).value();
    res.json({ settings: updated });
  } catch (err) {
    next(err);
  }
});

// PUT /api/settings/reset
router.put('/reset', authMiddleware, (req, res, next) => {
  try {
    const db = getDb();
    const now = new Date().toISOString();

    db.get('user_settings').find({ user_id: req.user.userId }).assign({
      ...DEFAULT_SETTINGS,
      updated_at: now
    }).write();

    const updated = db.get('user_settings').find({ user_id: req.user.userId }).value();
    res.json({ message: 'Settings reset to defaults', settings: updated });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
