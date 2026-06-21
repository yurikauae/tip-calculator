-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_login TEXT,
  is_active INTEGER NOT NULL DEFAULT 1
);

-- Watchlists table
CREATE TABLE IF NOT EXISTS watchlists (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Assets table (symbols tracked by users)
CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  watchlist_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  name TEXT,
  asset_type TEXT NOT NULL DEFAULT 'stock',
  exchange TEXT,
  added_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (watchlist_id) REFERENCES watchlists(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(watchlist_id, symbol)
);

-- Signals table
CREATE TABLE IF NOT EXISTS signals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  signal_type TEXT NOT NULL,
  direction TEXT NOT NULL,
  strength REAL,
  price_at_signal REAL,
  timeframe TEXT,
  indicators TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Paper trades table
CREATE TABLE IF NOT EXISTS paper_trades (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  trade_type TEXT NOT NULL,
  direction TEXT NOT NULL,
  quantity REAL NOT NULL,
  entry_price REAL NOT NULL,
  exit_price REAL,
  stop_loss REAL,
  take_profit REAL,
  status TEXT NOT NULL DEFAULT 'open',
  opened_at TEXT NOT NULL DEFAULT (datetime('now')),
  closed_at TEXT,
  pnl REAL,
  pnl_percent REAL,
  fees REAL DEFAULT 0,
  notes TEXT,
  strategy_id TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Journal entries table
CREATE TABLE IF NOT EXISTS journal_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  mood TEXT,
  market_conditions TEXT,
  symbols TEXT,
  trade_id TEXT,
  tags TEXT,
  attachments TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  condition TEXT NOT NULL,
  target_value REAL NOT NULL,
  current_value REAL,
  message TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  is_triggered INTEGER NOT NULL DEFAULT 0,
  triggered_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Strategies table
CREATE TABLE IF NOT EXISTS strategies (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  rules TEXT NOT NULL,
  indicators TEXT,
  timeframes TEXT,
  risk_per_trade REAL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Backtest results table
CREATE TABLE IF NOT EXISTS backtest_results (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  strategy_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  initial_capital REAL NOT NULL,
  final_capital REAL,
  total_trades INTEGER,
  winning_trades INTEGER,
  losing_trades INTEGER,
  win_rate REAL,
  avg_profit REAL,
  avg_loss REAL,
  max_drawdown REAL,
  sharpe_ratio REAL,
  profit_factor REAL,
  trades_data TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE CASCADE
);

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  theme TEXT NOT NULL DEFAULT 'dark',
  default_timeframe TEXT NOT NULL DEFAULT '1h',
  default_chart_type TEXT NOT NULL DEFAULT 'candlestick',
  currency TEXT NOT NULL DEFAULT 'USD',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  notifications_enabled INTEGER NOT NULL DEFAULT 1,
  email_alerts INTEGER NOT NULL DEFAULT 0,
  risk_tolerance TEXT NOT NULL DEFAULT 'medium',
  default_paper_capital REAL NOT NULL DEFAULT 10000,
  indicators_config TEXT,
  layout_config TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_symbol ON assets(symbol);
CREATE INDEX IF NOT EXISTS idx_signals_user_id ON signals(user_id);
CREATE INDEX IF NOT EXISTS idx_signals_symbol ON signals(symbol);
CREATE INDEX IF NOT EXISTS idx_paper_trades_user_id ON paper_trades(user_id);
CREATE INDEX IF NOT EXISTS idx_paper_trades_symbol ON paper_trades(symbol);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_symbol ON alerts(symbol);
