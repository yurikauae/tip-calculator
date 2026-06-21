const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');
const authMiddleware = require('../middleware/auth');
const { validateJournalEntry } = require('../middleware/validate');

const router = express.Router();

// GET /api/journal
router.get('/', authMiddleware, (req, res, next) => {
  try {
    const db = getDb();
    const { limit = 20, offset = 0, symbol, search } = req.query;

    let entries = db.get('journal_entries').filter({ user_id: req.user.userId }).value();

    if (symbol) {
      const upperSymbol = symbol.toUpperCase();
      entries = entries.filter(e => {
        const syms = Array.isArray(e.symbols) ? e.symbols : (e.symbols ? JSON.parse(e.symbols) : []);
        return syms.includes(upperSymbol);
      });
    }

    if (search) {
      const searchLower = search.toLowerCase();
      entries = entries.filter(e =>
        (e.title && e.title.toLowerCase().includes(searchLower)) ||
        (e.content && e.content.toLowerCase().includes(searchLower))
      );
    }

    // Sort by created_at DESC
    entries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const total = entries.length;
    const paginated = entries.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.json({
      entries: paginated.map(e => ({
        ...e,
        tags: Array.isArray(e.tags) ? e.tags : (e.tags ? JSON.parse(e.tags) : []),
        symbols: Array.isArray(e.symbols) ? e.symbols : (e.symbols ? JSON.parse(e.symbols) : [])
      })),
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/journal/:id
router.get('/:id', authMiddleware, (req, res, next) => {
  try {
    const db = getDb();
    const entry = db.get('journal_entries').find({ id: req.params.id, user_id: req.user.userId }).value();

    if (!entry) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }

    res.json({
      entry: {
        ...entry,
        tags: Array.isArray(entry.tags) ? entry.tags : (entry.tags ? JSON.parse(entry.tags) : []),
        symbols: Array.isArray(entry.symbols) ? entry.symbols : (entry.symbols ? JSON.parse(entry.symbols) : [])
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/journal
router.post('/', authMiddleware, validateJournalEntry, (req, res, next) => {
  try {
    const { title, content, mood, market_conditions, symbols, trade_id, tags } = req.body;
    const db = getDb();
    const id = uuidv4();
    const now = new Date().toISOString();

    const newEntry = {
      id,
      user_id: req.user.userId,
      title: title.trim(),
      content: content.trim(),
      mood: mood || null,
      market_conditions: market_conditions || null,
      symbols: symbols || [],
      trade_id: trade_id || null,
      tags: tags || [],
      created_at: now,
      updated_at: now
    };

    db.get('journal_entries').push(newEntry).write();

    res.status(201).json({ entry: newEntry });
  } catch (err) {
    next(err);
  }
});

// PUT /api/journal/:id
router.put('/:id', authMiddleware, (req, res, next) => {
  try {
    const db = getDb();
    const entry = db.get('journal_entries').find({ id: req.params.id, user_id: req.user.userId }).value();

    if (!entry) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }

    const { title, content, mood, market_conditions, symbols, tags } = req.body;
    const now = new Date().toISOString();

    const updates = {
      title: title !== undefined ? title.trim() : entry.title,
      content: content !== undefined ? content.trim() : entry.content,
      mood: mood !== undefined ? mood : entry.mood,
      market_conditions: market_conditions !== undefined ? market_conditions : entry.market_conditions,
      symbols: symbols !== undefined ? symbols : entry.symbols,
      tags: tags !== undefined ? tags : entry.tags,
      updated_at: now
    };

    db.get('journal_entries').find({ id: entry.id }).assign(updates).write();

    const updated = db.get('journal_entries').find({ id: entry.id }).value();
    res.json({
      entry: {
        ...updated,
        tags: Array.isArray(updated.tags) ? updated.tags : (updated.tags ? JSON.parse(updated.tags) : []),
        symbols: Array.isArray(updated.symbols) ? updated.symbols : (updated.symbols ? JSON.parse(updated.symbols) : [])
      }
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/journal/:id
router.delete('/:id', authMiddleware, (req, res, next) => {
  try {
    const db = getDb();
    const entry = db.get('journal_entries').find({ id: req.params.id, user_id: req.user.userId }).value();

    if (!entry) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }

    db.get('journal_entries').remove({ id: entry.id }).write();
    res.json({ message: 'Journal entry deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
