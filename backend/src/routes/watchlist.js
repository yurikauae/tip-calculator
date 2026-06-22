const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/data', authMiddleware, (req, res) => {
  const symbols = Array.isArray(req.body.symbols) ? req.body.symbols.slice(0, 50) : [];
  const items = symbols.map((symbol) => ({
    symbol: String(symbol).toUpperCase(),
    price: null,
    change_pct: 0,
    signal: 'NEUTRAL',
    source: 'demo',
  }));
  res.json({ items, source: 'demo', warning: 'Watchlist prices require a configured market-data provider.' });
});

// GET /api/watchlist
router.get('/', authMiddleware, (req, res, next) => {
  try {
    const db = getDb();
    const watchlists = db.get('watchlists').filter({ user_id: req.user.userId }).value();

    // Sort by created_at ASC
    watchlists.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    const enriched = watchlists.map(wl => {
      const wlAssets = db.get('assets').filter({ watchlist_id: wl.id }).value();
      wlAssets.sort((a, b) => new Date(a.added_at) - new Date(b.added_at));
      return { ...wl, assets: wlAssets };
    });

    res.json({ watchlists: enriched });
  } catch (err) {
    next(err);
  }
});

// GET /api/watchlist/:id
router.get('/:id', authMiddleware, (req, res, next) => {
  try {
    const db = getDb();
    const watchlist = db.get('watchlists').find({ id: req.params.id, user_id: req.user.userId }).value();

    if (!watchlist) {
      return res.status(404).json({ error: 'Watchlist not found' });
    }

    const wlAssets = db.get('assets').filter({ watchlist_id: watchlist.id }).value();
    wlAssets.sort((a, b) => new Date(a.added_at) - new Date(b.added_at));
    res.json({ watchlist: { ...watchlist, assets: wlAssets } });
  } catch (err) {
    next(err);
  }
});

// POST /api/watchlist
router.post('/', authMiddleware, (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Watchlist name is required' });
    }

    const db = getDb();
    const id = uuidv4();
    const now = new Date().toISOString();

    const newWatchlist = {
      id,
      user_id: req.user.userId,
      name: name.trim(),
      description: description || null,
      created_at: now,
      updated_at: now
    };

    db.get('watchlists').push(newWatchlist).write();

    res.status(201).json({ watchlist: { ...newWatchlist, assets: [] } });
  } catch (err) {
    next(err);
  }
});

// PUT /api/watchlist/:id
router.put('/:id', authMiddleware, (req, res, next) => {
  try {
    const db = getDb();
    const watchlist = db.get('watchlists').find({ id: req.params.id, user_id: req.user.userId }).value();

    if (!watchlist) {
      return res.status(404).json({ error: 'Watchlist not found' });
    }

    const { name, description } = req.body;
    const now = new Date().toISOString();

    const updates = {
      name: name !== undefined ? name.trim() : watchlist.name,
      description: description !== undefined ? description : watchlist.description,
      updated_at: now
    };

    db.get('watchlists').find({ id: watchlist.id }).assign(updates).write();

    const updated = db.get('watchlists').find({ id: watchlist.id }).value();
    const wlAssets = db.get('assets').filter({ watchlist_id: watchlist.id }).value();
    res.json({ watchlist: { ...updated, assets: wlAssets } });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/watchlist/:id
router.delete('/:id', authMiddleware, (req, res, next) => {
  try {
    const db = getDb();
    const watchlist = db.get('watchlists').find({ id: req.params.id, user_id: req.user.userId }).value();

    if (!watchlist) {
      return res.status(404).json({ error: 'Watchlist not found' });
    }

    db.get('watchlists').remove({ id: watchlist.id }).write();
    db.get('assets').remove({ watchlist_id: watchlist.id }).write();

    res.json({ message: 'Watchlist deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// POST /api/watchlist/:id/assets - Add asset to watchlist
router.post('/:id/assets', authMiddleware, (req, res, next) => {
  try {
    const { symbol, name, asset_type, exchange } = req.body;

    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    const db = getDb();
    const watchlist = db.get('watchlists').find({ id: req.params.id, user_id: req.user.userId }).value();

    if (!watchlist) {
      return res.status(404).json({ error: 'Watchlist not found' });
    }

    const normalizedSymbol = symbol.toUpperCase().trim();
    const existing = db.get('assets').find({ watchlist_id: watchlist.id, symbol: normalizedSymbol }).value();

    if (existing) {
      return res.status(409).json({ error: 'Asset already in watchlist' });
    }

    const assetId = uuidv4();
    const now = new Date().toISOString();

    const newAsset = {
      id: assetId,
      watchlist_id: watchlist.id,
      user_id: req.user.userId,
      symbol: normalizedSymbol,
      name: name || null,
      asset_type: asset_type || 'stock',
      exchange: exchange || null,
      added_at: now
    };

    db.get('assets').push(newAsset).write();

    res.status(201).json({ asset: newAsset });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/watchlist/:id/assets/:symbol - Remove asset from watchlist
router.delete('/:id/assets/:symbol', authMiddleware, (req, res, next) => {
  try {
    const db = getDb();
    const watchlist = db.get('watchlists').find({ id: req.params.id, user_id: req.user.userId }).value();

    if (!watchlist) {
      return res.status(404).json({ error: 'Watchlist not found' });
    }

    const normalizedSymbol = req.params.symbol.toUpperCase();
    const asset = db.get('assets').find({ watchlist_id: watchlist.id, symbol: normalizedSymbol }).value();

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found in watchlist' });
    }

    db.get('assets').remove({ watchlist_id: watchlist.id, symbol: normalizedSymbol }).write();

    res.json({ message: 'Asset removed from watchlist' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
