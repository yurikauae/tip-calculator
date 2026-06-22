import axios from 'axios'

// â”€â”€ Axios Instance â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const PRODUCTION_API_URL = 'https://tip-calculator-production.up.railway.app'
const API_ORIGIN = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? PRODUCTION_API_URL : '')
const API_BASE = API_ORIGIN ? `${API_ORIGIN}/api` : '/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('market-signal-token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.response?.data?.error ||
      (Array.isArray(error.response?.data?.details) ? error.response.data.details.join(' ') : null) ||
      error.message ||
      'An unexpected error occurred'
    if (error.response?.status === 401) {
      localStorage.removeItem('market-signal-token')
      localStorage.removeItem('market-signal-user')
      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }
    return Promise.reject(new Error(message))
  }
)

export const login = (email, password) => api.post('/auth/login', { email, password })
export const register = (email, username, password) =>
  api.post('/auth/register', { email, username, password })
export const getCurrentUser = () => api.get('/auth/me')

// â”€â”€ Health â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const healthCheck = () => api.get('/health')

// â”€â”€ Market Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getQuote = (symbol) =>
  api.get(`/market/quote/${symbol.toUpperCase()}`)

export const getBatchQuotes = (symbols) =>
  api.post('/market/quotes/batch', { symbols: symbols.map((s) => s.toUpperCase()) })

export const getHistoricalData = (symbol, period = '1y', interval = '1d') =>
  api.get(`/market/history/${symbol.toUpperCase()}`, {
    params: { period, interval },
  })

export const getMarketOverview = () => api.get('/market/overview')

export const searchSymbol = (query) =>
  api.get('/market/search', { params: { q: query } })

export const getTrendingSymbols = () => api.get('/market/trending')

export const getSectorPerformance = () => api.get('/market/sectors')

export const getMarketIndices = () => api.get('/market/indices')

// â”€â”€ Signals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getSignal = (symbol, timeframe = '1d') =>
  api.get(`/signals/${symbol.toUpperCase()}`, { params: { timeframe } })

export const getBatchSignals = (symbols, timeframe = '1d') =>
  api.post('/signals/batch', {
    symbols: symbols.map((s) => s.toUpperCase()),
    timeframe,
  })

export const getSignalHistory = (symbol, limit = 30) =>
  api.get(`/signals/${symbol.toUpperCase()}/history`, { params: { limit } })

export const getTopSignals = (signalType = null, limit = 20) =>
  api.get('/signals/top', { params: { signal_type: signalType, limit } })

export const getSignalSummary = (symbol) =>
  api.get(`/signals/${symbol.toUpperCase()}/summary`)

// â”€â”€ Technical Analysis â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getTechnicalIndicators = (symbol, indicators = [], timeframe = '1d') =>
  api.get(`/analysis/technical/${symbol.toUpperCase()}`, {
    params: { indicators: indicators.join(','), timeframe },
  })

export const getRSI = (symbol, period = 14, timeframe = '1d') =>
  api.get(`/analysis/rsi/${symbol.toUpperCase()}`, {
    params: { period, timeframe },
  })

export const getMACD = (symbol, timeframe = '1d') =>
  api.get(`/analysis/macd/${symbol.toUpperCase()}`, { params: { timeframe } })

export const getBollingerBands = (symbol, period = 20, timeframe = '1d') =>
  api.get(`/analysis/bollinger/${symbol.toUpperCase()}`, {
    params: { period, timeframe },
  })

export const getMovingAverages = (symbol, timeframe = '1d') =>
  api.get(`/analysis/ma/${symbol.toUpperCase()}`, { params: { timeframe } })

export const getSupportResistance = (symbol, timeframe = '1d') =>
  api.get(`/analysis/support-resistance/${symbol.toUpperCase()}`, {
    params: { timeframe },
  })

export const getVolumeAnalysis = (symbol, timeframe = '1d') =>
  api.get(`/analysis/volume/${symbol.toUpperCase()}`, { params: { timeframe } })

// â”€â”€ Screener â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const runScreener = (filters = {}) =>
  api.post('/screener/run', filters)

export const getScreenerPresets = () => api.get('/screener/presets')

export const saveScreenerPreset = (name, filters) =>
  api.post('/screener/presets', { name, filters })

export const deleteScreenerPreset = (presetId) =>
  api.delete(`/screener/presets/${presetId}`)

// â”€â”€ Watchlist â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getWatchlistData = (symbols) =>
  api.post('/watchlist/data', { symbols: symbols.map((s) => s.toUpperCase()) })

// â”€â”€ News & Sentiment â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getNews = (symbol = null, limit = 20) =>
  api.get('/news', { params: { symbol: symbol?.toUpperCase(), limit } })

export const getMarketNews = (limit = 30) =>
  api.get('/news/market', { params: { limit } })

export const getSentiment = (symbol) =>
  api.get(`/news/sentiment/${symbol.toUpperCase()}`)

export const getSentimentBatch = (symbols) =>
  api.post('/news/sentiment/batch', { symbols: symbols.map((s) => s.toUpperCase()) })

// â”€â”€ Paper Trading â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const createPaperOrder = (order) =>
  api.post('/paper/orders', order)

export const getPaperPositions = (accountId) =>
  api.get(`/paper/positions/${accountId}`)

export const closePaperPosition = (accountId, symbol) =>
  api.delete(`/paper/positions/${accountId}/${symbol}`)

export const getPaperTradeHistory = (accountId, limit = 50) =>
  api.get(`/paper/history/${accountId}`, { params: { limit } })

export const getPaperPerformance = (accountId) =>
  api.get(`/paper/performance/${accountId}`)

export const resetPaperAccount = (accountId) =>
  api.post(`/paper/reset/${accountId}`)

// â”€â”€ Backtest â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const runBacktest = (params) =>
  api.post('/backtest/run', params)

export const getBacktestResult = (backtestId) =>
  api.get(`/backtest/results/${backtestId}`)

export const getBacktestHistory = (limit = 10) =>
  api.get('/backtest/history', { params: { limit } })

export const getBacktestStrategies = () => api.get('/backtest/strategies')

// â”€â”€ Portfolio â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getPortfolioSummary = () => api.get('/portfolio/summary')

export const getPortfolioPerformance = (period = '1m') =>
  api.get('/portfolio/performance', { params: { period } })

export const getPortfolioAllocations = () => api.get('/portfolio/allocations')

export const getPortfolioRisk = () => api.get('/portfolio/risk')

// â”€â”€ Alerts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getUserAlerts = () => api.get('/alerts')

export const createAlert = (alertData) => api.post('/alerts', alertData)

export const updateAlert = (alertId, updates) =>
  api.patch(`/alerts/${alertId}`, updates)

export const deleteAlert = (alertId) => api.delete(`/alerts/${alertId}`)

export const checkAlerts = (symbols) =>
  api.post('/alerts/check', { symbols: symbols.map((s) => s.toUpperCase()) })

// â”€â”€ Options â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getOptionsChain = (symbol, expiration = null) =>
  api.get(`/options/chain/${symbol.toUpperCase()}`, {
    params: expiration ? { expiration } : {},
  })

export const getOptionsFlow = (symbol) =>
  api.get(`/options/flow/${symbol.toUpperCase()}`)

export const getImpliedVolatility = (symbol) =>
  api.get(`/options/iv/${symbol.toUpperCase()}`)

// â”€â”€ Earnings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getEarningsCalendar = (startDate = null, endDate = null) =>
  api.get('/earnings/calendar', { params: { start: startDate, end: endDate } })

export const getEarningsHistory = (symbol) =>
  api.get(`/earnings/history/${symbol.toUpperCase()}`)

// â”€â”€ Utilities â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const formatSymbol = (s) => s?.toUpperCase().trim() || ''

export default api
