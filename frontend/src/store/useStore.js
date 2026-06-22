import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'

const DEFAULT_WATCHLIST = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'GOOGL', 'SPY', 'QQQ']

const DEFAULT_PAPER_ACCOUNT = {
  balance: 100000,
  initialBalance: 100000,
  positions: [],
  orders: [],
  tradeHistory: [],
  createdAt: new Date().toISOString(),
}

const DEFAULT_SETTINGS = {
  defaultTimeframe: '1d',
  defaultInterval: '1h',
  showDisclaimerBanner: true,
  notifications: true,
  soundAlerts: false,
  autoRefresh: true,
  refreshInterval: 60,
  theme: 'dark',
  currency: 'USD',
  riskTolerance: 'moderate',
}

const useStore = create(
  devtools(
    persist(
      (set, get) => ({
        authToken: localStorage.getItem('market-signal-token'),
        currentUser: (() => {
          try {
            return JSON.parse(localStorage.getItem('market-signal-user')) || null
          } catch {
            return null
          }
        })(),
        setSession: (token, user) => {
          localStorage.setItem('market-signal-token', token)
          localStorage.setItem('market-signal-user', JSON.stringify(user))
          set({ authToken: token, currentUser: user })
        },
        clearSession: () => {
          localStorage.removeItem('market-signal-token')
          localStorage.removeItem('market-signal-user')
          set({ authToken: null, currentUser: null })
        },

        // â”€â”€ Watchlist â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        watchlist: DEFAULT_WATCHLIST,

        addToWatchlist: (symbol) =>
          set((state) => {
            const upper = symbol.toUpperCase().trim()
            if (!upper || state.watchlist.includes(upper)) return state
            return { watchlist: [...state.watchlist, upper] }
          }),

        removeFromWatchlist: (symbol) =>
          set((state) => ({
            watchlist: state.watchlist.filter((s) => s !== symbol),
          })),

        reorderWatchlist: (newOrder) => set({ watchlist: newOrder }),

        clearWatchlist: () => set({ watchlist: [] }),

        // â”€â”€ Selected Symbol / Timeframe â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        selectedSymbol: 'AAPL',
        timeframe: '1y',
        interval: '1d',

        setSelectedSymbol: (symbol) =>
          set({ selectedSymbol: symbol.toUpperCase().trim() }),

        setTimeframe: (timeframe) => set({ timeframe }),

        setInterval: (interval) => set({ interval }),

        // â”€â”€ Paper Trading Account â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        paperAccount: DEFAULT_PAPER_ACCOUNT,
        paperMode: false,

        setPaperMode: (enabled) => set({ paperMode: enabled }),

        resetPaperAccount: () =>
          set({
            paperAccount: {
              ...DEFAULT_PAPER_ACCOUNT,
              createdAt: new Date().toISOString(),
            },
          }),

        updatePaperBalance: (newBalance) =>
          set((state) => ({
            paperAccount: { ...state.paperAccount, balance: newBalance },
          })),

        addPaperPosition: (position) =>
          set((state) => ({
            paperAccount: {
              ...state.paperAccount,
              positions: [...state.paperAccount.positions, position],
            },
          })),

        removePaperPosition: (symbol) =>
          set((state) => ({
            paperAccount: {
              ...state.paperAccount,
              positions: state.paperAccount.positions.filter(
                (p) => p.symbol !== symbol
              ),
            },
          })),

        addPaperTrade: (trade) =>
          set((state) => ({
            paperAccount: {
              ...state.paperAccount,
              tradeHistory: [trade, ...state.paperAccount.tradeHistory],
            },
          })),

        updatePaperPosition: (symbol, updates) =>
          set((state) => ({
            paperAccount: {
              ...state.paperAccount,
              positions: state.paperAccount.positions.map((p) =>
                p.symbol === symbol ? { ...p, ...updates } : p
              ),
            },
          })),

        // â”€â”€ Price Alerts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        alerts: [],
        unreadAlertCount: 0,

        addAlert: (alert) =>
          set((state) => ({
            alerts: [
              {
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
                triggered: false,
                ...alert,
              },
              ...state.alerts,
            ],
          })),

        removeAlert: (id) =>
          set((state) => ({
            alerts: state.alerts.filter((a) => a.id !== id),
          })),

        toggleAlert: (id) =>
          set((state) => ({
            alerts: state.alerts.map((a) =>
              a.id === id ? { ...a, active: !a.active } : a
            ),
          })),

        markAlertTriggered: (id) =>
          set((state) => ({
            alerts: state.alerts.map((a) =>
              a.id === id
                ? { ...a, triggered: true, triggeredAt: new Date().toISOString() }
                : a
            ),
            unreadAlertCount: state.unreadAlertCount + 1,
          })),

        clearUnreadAlerts: () => set({ unreadAlertCount: 0 }),

        // â”€â”€ Notifications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        notifications: [],

        addNotification: (notification) =>
          set((state) => ({
            notifications: [
              {
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                read: false,
                ...notification,
              },
              ...state.notifications.slice(0, 49),
            ],
          })),

        markNotificationRead: (id) =>
          set((state) => ({
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, read: true } : n
            ),
          })),

        markAllNotificationsRead: () =>
          set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, read: true })),
          })),

        clearNotifications: () => set({ notifications: [] }),

        // â”€â”€ Settings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        settings: DEFAULT_SETTINGS,

        updateSettings: (updates) =>
          set((state) => ({
            settings: { ...state.settings, ...updates },
          })),

        resetSettings: () => set({ settings: DEFAULT_SETTINGS }),

        // â”€â”€ UI State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        sidebarCollapsed: false,

        toggleSidebar: () =>
          set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

        setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

        // â”€â”€ Screener Filters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        screenerFilters: {
          minPrice: '',
          maxPrice: '',
          minVolume: '',
          sector: '',
          signalType: '',
          minConfidence: 0,
        },

        setScreenerFilters: (filters) =>
          set((state) => ({
            screenerFilters: { ...state.screenerFilters, ...filters },
          })),

        resetScreenerFilters: () =>
          set({
            screenerFilters: {
              minPrice: '',
              maxPrice: '',
              minVolume: '',
              sector: '',
              signalType: '',
              minConfidence: 0,
            },
          }),

        // â”€â”€ Cached Market Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        marketData: {},
        lastFetched: {},

        setMarketData: (symbol, data) =>
          set((state) => ({
            marketData: { ...state.marketData, [symbol]: data },
            lastFetched: { ...state.lastFetched, [symbol]: Date.now() },
          })),

        isDataStale: (symbol, maxAgeMs = 60000) => {
          const lastFetch = get().lastFetched[symbol]
          if (!lastFetch) return true
          return Date.now() - lastFetch > maxAgeMs
        },
      }),
      {
        name: 'trading-dashboard-store',
        partialize: (state) => ({
          watchlist: state.watchlist,
          paperAccount: state.paperAccount,
          paperMode: state.paperMode,
          alerts: state.alerts,
          settings: state.settings,
          selectedSymbol: state.selectedSymbol,
          timeframe: state.timeframe,
          interval: state.interval,
          sidebarCollapsed: state.sidebarCollapsed,
          screenerFilters: state.screenerFilters,
        }),
      }
    ),
    { name: 'TradingDashboard' }
  )
)

export default useStore
