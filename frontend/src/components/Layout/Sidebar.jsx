import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Star,
  ScanSearch,
  Zap,
  BarChart2,
  FlaskConical,
  Briefcase,
  TestTube,
  Bell,
  Newspaper,
  Settings,
  Info,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Calculator,
  BookOpen,
  NotebookPen,
} from 'lucide-react'
import useStore from '../../store/useStore'

const NAV_ITEMS = [
  {
    group: 'Main',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/watchlist', label: 'Watchlist', icon: Star },
      { path: '/screener', label: 'Screener', icon: ScanSearch },
    ],
  },
  {
    group: 'Analysis',
    items: [
      { path: '/signals', label: 'Signals', icon: Zap },
      { path: '/chart', label: 'Chart', icon: BarChart2 },
      { path: '/news', label: 'News', icon: Newspaper },
    ],
  },
  {
    group: 'Trading',
    items: [
      { path: '/paper-trading', label: 'Paper Trading', icon: FlaskConical },
      { path: '/portfolio', label: 'Portfolio', icon: Briefcase },
      { path: '/backtest', label: 'Backtest', icon: TestTube },
      { path: '/risk-calculator', label: 'Risk Calculator', icon: Calculator },
      { path: '/trade-journal', label: 'Trade Journal', icon: NotebookPen },
    ],
  },
  {
    group: 'System',
    items: [
      { path: '/alerts', label: 'Alerts', icon: Bell },
      { path: '/settings', label: 'Settings', icon: Settings },
      { path: '/about', label: 'About', icon: Info },
      { path: '/education', label: 'Education', icon: BookOpen },
    ],
  },
]

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, unreadAlertCount, paperMode } = useStore()
  const navigate = useNavigate()

  return (
    <aside
      className={`
        flex flex-col h-full bg-bg-card border-r border-border
        transition-all duration-200 ease-in-out flex-shrink-0
        ${sidebarCollapsed ? 'w-16' : 'w-56'}
      `}
    >
      {/* Logo */}
      <div
        className={`
          flex items-center h-14 px-3 border-b border-border flex-shrink-0
          ${sidebarCollapsed ? 'justify-center' : 'gap-2.5'}
        `}
      >
        <div
          className="w-8 h-8 rounded-lg bg-signal-green/10 border border-signal-green/30
                      flex items-center justify-center flex-shrink-0 cursor-pointer"
          onClick={() => navigate('/dashboard')}
        >
          <TrendingUp className="w-4 h-4 text-signal-green" />
        </div>
        {!sidebarCollapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-text-primary leading-none truncate">
              Market Signal
            </span>
            <span className="text-xs text-text-muted leading-none mt-0.5">
              {paperMode ? (
                <span className="text-signal-yellow">Paper Mode</span>
              ) : (
                'Signal Dashboard'
              )}
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-4 scrollbar-thin">
        {NAV_ITEMS.map((group) => (
          <div key={group.group}>
            {!sidebarCollapsed && (
              <p className="px-2 mb-1 text-[10px] font-semibold text-text-muted uppercase tracking-widest">
                {group.group}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map(({ path, label, icon: Icon }) => (
                <li key={path}>
                  <NavLink
                    to={path}
                    title={sidebarCollapsed ? label : undefined}
                    className={({ isActive }) =>
                      `flex items-center rounded-lg transition-all duration-150 text-sm font-medium
                       ${sidebarCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2'}
                       ${
                         isActive
                           ? 'text-signal-green bg-signal-greenDim border border-signal-green/20'
                           : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover border border-transparent'
                       }`
                    }
                  >
                    <div className="relative flex-shrink-0">
                      <Icon className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
                      {label === 'Alerts' && unreadAlertCount > 0 && (
                        <span
                          className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-signal-red
                                     rounded-full text-[8px] font-bold text-white
                                     flex items-center justify-center"
                        >
                          {unreadAlertCount > 9 ? '9+' : unreadAlertCount}
                        </span>
                      )}
                    </div>
                    {!sidebarCollapsed && (
                      <span className="truncate">{label}</span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <div className="px-2 py-3 border-t border-border flex-shrink-0">
        <button
          onClick={toggleSidebar}
          className={`
            w-full flex items-center rounded-lg py-2 px-2
            text-text-muted hover:text-text-secondary hover:bg-bg-hover
            transition-all duration-150 text-xs
            ${sidebarCollapsed ? 'justify-center' : 'gap-2'}
          `}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
