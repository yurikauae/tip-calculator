const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');
const { validateRegister, validateLogin } = require('../middleware/validate');
const authMiddleware = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// POST /api/auth/register
router.post('/register', validateRegister, async (req, res, next) => {
  try {
    const { email, username, password } = req.body;
    const db = getDb();

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim();

    // Check if email already exists
    const existingEmail = db.get('users').find({ email: normalizedEmail }).value();
    if (existingEmail) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Check if username already exists
    const existingUsername = db.get('users').find({ username: normalizedUsername }).value();
    if (existingUsername) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(password, 12);
    const now = new Date().toISOString();

    db.get('users').push({
      id: userId,
      email: normalizedEmail,
      username: normalizedUsername,
      password_hash: passwordHash,
      is_active: true,
      last_login: null,
      created_at: now,
      updated_at: now
    }).write();

    // Create default settings for user
    db.get('user_settings').push({
      id: uuidv4(),
      user_id: userId,
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
      layout_config: null,
      created_at: now,
      updated_at: now
    }).write();

    // Create default watchlist
    db.get('watchlists').push({
      id: uuidv4(),
      user_id: userId,
      name: 'My Watchlist',
      description: 'Default watchlist',
      created_at: now,
      updated_at: now
    }).write();

    const token = jwt.sign(
      { userId, email: normalizedEmail, username: normalizedUsername },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    logger.info(`New user registered: ${normalizedEmail}`);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: userId,
        email: normalizedEmail,
        username: normalizedUsername,
        createdAt: now
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', validateLogin, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const db = getDb();

    const normalizedEmail = email.trim().toLowerCase();

    const user = db.get('users').find({ email: normalizedEmail }).value();

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.is_active === false) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login
    const now = new Date().toISOString();
    db.get('users').find({ id: user.id }).assign({ last_login: now }).write();

    const token = jwt.sign(
      { userId: user.id, email: user.email, username: user.username },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    logger.info(`User logged in: ${normalizedEmail}`);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        lastLogin: now
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res, next) => {
  try {
    const db = getDb();
    const user = db.get('users').find({ id: req.user.userId }).value();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        created_at: user.created_at,
        last_login: user.last_login
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/refresh
router.post('/refresh', authMiddleware, (req, res) => {
  const token = jwt.sign(
    { userId: req.user.userId, email: req.user.email, username: req.user.username },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '7d' }
  );

  res.json({ token });
});

module.exports = router;
