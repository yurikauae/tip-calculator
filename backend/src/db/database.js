const path = require('path');
const fs = require('fs');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const defaults = {
  users: [],
  watchlists: [],
  assets: [],
  signals: [],
  paper_trades: [],
  journal_entries: [],
  alerts: [],
  strategies: [],
  backtest_results: [],
  user_settings: [],
};

let db;

function initDatabase() {
  const dataDir = process.env.DATA_DIR || path.join(__dirname, '../../data');
  fs.mkdirSync(dataDir, { recursive: true });
  const databaseFile = process.env.DATABASE_FILE || path.join(dataDir, 'market-signal.json');
  db = low(new FileSync(databaseFile));
  db.defaults(defaults).write();
  console.log(`Persistent database initialized at ${databaseFile}`);
}

function getDb() {
  if (!db) {
    throw new Error('Database has not been initialized');
  }
  return db;
}

module.exports = { getDb, initDatabase };
