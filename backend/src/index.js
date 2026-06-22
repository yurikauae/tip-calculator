require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { initDatabase } = require('./db/database');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const marketRoutes = require('./routes/market');
const signalsRoutes = require('./routes/signals');
const watchlistRoutes = require('./routes/watchlist');
const journalRoutes = require('./routes/journal');
const paperTradesRoutes = require('./routes/paperTrades');
const alertsRoutes = require('./routes/alerts');
const settingsRoutes = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:3000']

const corsOptions = {
  origin(origin, callback) {
    if (!origin || process.env.NODE_ENV !== 'production' || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin is not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again later.' }
});

app.use(globalLimiter);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'Market Signal Intelligence API' });
});
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'Market Signal Intelligence API' });
});
app.get('/api/capabilities', (req, res) => {
  const liveMarketData = Boolean(process.env.TWELVE_DATA_API_KEY);
  res.json({
    paperTradingOnly: true,
    liveMarketData,
    marketDataProvider: liveMarketData ? 'Twelve Data' : 'Synthetic demo feed',
    persistence: process.env.DATA_DIR ? 'persistent-volume' : 'local-file',
    executionEnabled: false,
    disclaimer: 'Educational analysis only. Not financial advice. No profit is guaranteed.',
  });
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/signals', signalsRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/paper-trades', paperTradesRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/settings', settingsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

// Initialize database and start server
initDatabase();
app.listen(PORT, () => {
  logger.info(`Market Signal Intelligence API running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

module.exports = app;
