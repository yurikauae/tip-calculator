const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../../data/db.json');

let db;

function initDatabase() {
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const adapter = new FileSync(DB_PATH);
  db = low(adapter);

  db.defaults({
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
  }).write();

  console.log('Database initialized at', DB_PATH);
}

function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
  return db;
}

module.exports = { getDb, initDatabase };
