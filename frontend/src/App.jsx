import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import useStore from './store/useStore'

// Lazy-loaded pages
const Dashboard = React.lazy(() => import('./pages/Dashboard'))
const Watchlist = React.lazy(() => import('./pages/Watchlist'))
const Screener = React.lazy(() => import('./pages/Screener'))
const Signals = React.lazy(() => import('./pages/Signals'))
const Chart = React.lazy(() => import('./pages/Chart'))
const PaperTrading = React.lazy(() => import('./pages/PaperTrading'))
const Portfolio = React.lazy(() => import('./pages/Portfolio'))
const Backtest = React.lazy(() => import('./pages/Backtest'))
const Alerts = React.lazy(() => import('./pages/Alerts'))
const News = React.lazy(() => import('./pages/News'))
const Settings = React.lazy(() => import('./pages/Settings'))
const About = React.lazy(() => import('./pages/About'))
const Login = React.lazy(() => import('./pages/Login'))
const RiskCalculator = React.lazy(() => import('./pages/RiskCalculator'))
const TradeJournal = React.lazy(() => import('./pages/TradeJournal'))
const StrategyTester = React.lazy(() => import('./pages/StrategyTester'))
const Disclaimer = React.lazy(() => import('./pages/Disclaimer'))
const AssetDetail = React.lazy(() => import('./pages/AssetDetail'))
const Education = React.lazy(() => import('./pages/Education'))

const PageFallback = () => (
  <div className="flex items-center justify-center h-full min-h-[60vh]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-signal-green border-t-transparent rounded-full animate-spin" />
      <p className="text-text-secondary text-sm">Loading page...</p>
    </div>
  </div>
)

export default function App() {
  const authToken = useStore((state) => state.authToken)

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            authToken ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <React.Suspense fallback={<PageFallback />}>
                <Login />
              </React.Suspense>
            )
          }
        />
        <Route
          path="/disclaimer"
          element={
            <React.Suspense fallback={<PageFallback />}>
              <Disclaimer />
            </React.Suspense>
          }
        />
        <Route path="/" element={authToken ? <Layout /> : <Navigate to="/login" replace />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route
            path="dashboard"
            element={
              <React.Suspense fallback={<PageFallback />}>
                <Dashboard />
              </React.Suspense>
            }
          />
          <Route
            path="watchlist"
            element={
              <React.Suspense fallback={<PageFallback />}>
                <Watchlist />
              </React.Suspense>
            }
          />
          <Route
            path="screener"
            element={
              <React.Suspense fallback={<PageFallback />}>
                <Screener />
              </React.Suspense>
            }
          />
          <Route
            path="signals"
            element={
              <React.Suspense fallback={<PageFallback />}>
                <Signals />
              </React.Suspense>
            }
          />
          <Route
            path="chart/:symbol?"
            element={
              <React.Suspense fallback={<PageFallback />}>
                <Chart />
              </React.Suspense>
            }
          />
          <Route
            path="paper-trading"
            element={
              <React.Suspense fallback={<PageFallback />}>
                <PaperTrading />
              </React.Suspense>
            }
          />
          <Route
            path="portfolio"
            element={
              <React.Suspense fallback={<PageFallback />}>
                <Portfolio />
              </React.Suspense>
            }
          />
          <Route
            path="backtest"
            element={
              <React.Suspense fallback={<PageFallback />}>
                <Backtest />
              </React.Suspense>
            }
          />
          <Route
            path="alerts"
            element={
              <React.Suspense fallback={<PageFallback />}>
                <Alerts />
              </React.Suspense>
            }
          />
          <Route
            path="news"
            element={
              <React.Suspense fallback={<PageFallback />}>
                <News />
              </React.Suspense>
            }
          />
          <Route
            path="settings"
            element={
              <React.Suspense fallback={<PageFallback />}>
                <Settings />
              </React.Suspense>
            }
          />
          <Route
            path="about"
            element={
              <React.Suspense fallback={<PageFallback />}>
                <About />
              </React.Suspense>
            }
          />
          <Route path="asset/:symbol" element={<React.Suspense fallback={<PageFallback />}><AssetDetail /></React.Suspense>} />
          <Route path="signals/:symbol" element={<React.Suspense fallback={<PageFallback />}><AssetDetail /></React.Suspense>} />
          <Route path="risk-calculator" element={<React.Suspense fallback={<PageFallback />}><RiskCalculator /></React.Suspense>} />
          <Route path="trade-journal" element={<React.Suspense fallback={<PageFallback />}><TradeJournal /></React.Suspense>} />
          <Route path="strategy-tester" element={<React.Suspense fallback={<PageFallback />}><StrategyTester /></React.Suspense>} />
          <Route path="education" element={<React.Suspense fallback={<PageFallback />}><Education /></React.Suspense>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
