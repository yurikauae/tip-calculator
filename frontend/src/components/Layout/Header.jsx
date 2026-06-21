import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Bell,
  FlaskConical,
  X,
  CheckCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
} from 'lucide-react'
import useStore from '../../store/useStore'
import { searchSymbol } from '../../services/api'

function NotificationsDropdown({ onClose }) {
  const { notifications, markNotificationRead, markAllNotificationsRead, clearNotifications } = useStore()
  const unread = notifications.filter((n) => !n.read)

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-bg-card border border-border rounded-xl shadow-elevated z-50 animate-fade-in">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-semibold text-text-primary">Notifications</span>
        <div className="flex items-center gap-2">
          {unread.length > 0 && (
            <button
              onClick={markAllNotificationsRead}
              className="text-xs text-signal-green hover:underline"
            >
              Mark all read
            </button>
          )}
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="max-h-72 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Bell className="w-6 h-6 text-text-muted" />
            <p className="text-text-muted text-sm">No notifications</p>
          </div>
        ) : (
          notifications.slice(0, 15).map((n) => (
            <button
              key={n.id}
              onClick={() => markNotificationRead(n.id)}
              className={`w-full text-left px-4 py-3 border-b border-border/50 hover:bg-bg-hover
                          transition-colors duration-100 ${!n.read ? 'bg-bg-elevated' : ''}`}
            >
              <div className="flex items-start gap-2">
                {!n.read && (
                  <div className="w-1.5 h-1.5 rounded-full bg-signal-green mt-1.5 flex-shrink-0" />
                )}
                <div className={!n.read ? '' : 'ml-3.5'}>
                  <p className="text-xs font-medium text-text-primary line-clamp-2">
                    {n.title || n.message}
                  </p>
                  <p className="text-[10px] text-text-muted mt-0.5">
                    {new Date(n.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
      {notifications.length > 0 && (
        <div className="px-4 py-2 border-t border-border">
          <button
            onClick={clearNotifications}
            className="text-xs text-text-muted hover:text-signal-red transition-colors"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}

function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { setSelectedSymbol, addToWatchlist } = useStore()
  const inputRef = useRef(null)
  const timeoutRef = useRef(null)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setOpen(false)
      return
    }
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await searchSymbol(query)
        setResults(data?.results || [])
        setOpen(true)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 350)
    return () => clearTimeout(timeoutRef.current)
  }, [query])

  const handleSelect = (symbol) => {
    setSelectedSymbol(symbol)
    setQuery('')
    setOpen(false)
    navigate(`/chart/${symbol}`)
  }

  return (
    <div className="relative flex-1 max-w-xs">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value.toUpperCase())}
          placeholder="Search symbol..."
          className="input-dark pl-8 pr-3 h-8 text-xs"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 border border-signal-green border-t-transparent rounded-full animate-spin" />
        )}
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-bg-card border border-border rounded-lg shadow-elevated z-50 overflow-hidden">
          {results.slice(0, 8).map((r) => (
            <button
              key={r.symbol}
              onClick={() => handleSelect(r.symbol)}
              className="w-full text-left px-3 py-2 hover:bg-bg-hover transition-colors duration-100 flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-semibold text-text-primary font-mono">
                  {r.symbol}
                </span>
                <span className="text-[10px] text-text-muted ml-2 truncate max-w-[140px]">
                  {r.name}
                </span>
              </div>
              <span className="text-[10px] text-text-muted">{r.exchange}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Header() {
  const { paperMode, setPaperMode, notifications, unreadAlertCount, clearUnreadAlerts } = useStore()
  const [showNotifications, setShowNotifications] = useState(false)
  const notifRef = useRef(null)
  const unreadCount = notifications.filter((n) => !n.read).length

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleNotifToggle = () => {
    setShowNotifications((v) => !v)
    if (!showNotifications) clearUnreadAlerts()
  }

  return (
    <header className="h-14 flex items-center gap-3 px-4 border-b border-border bg-bg-card flex-shrink-0">
      {/* Search */}
      <SearchBar />

      <div className="flex-1" />

      {/* Paper Mode Toggle */}
      <button
        onClick={() => setPaperMode(!paperMode)}
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
          border transition-all duration-150
          ${
            paperMode
              ? 'bg-signal-yellowDim border-signal-yellow/30 text-signal-yellow'
              : 'bg-bg-elevated border-border text-text-secondary hover:text-text-primary hover:border-border-bright'
          }
        `}
        title="Toggle paper trading mode"
      >
        <FlaskConical className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">
          {paperMode ? 'Paper Mode' : 'Live View'}
        </span>
      </button>

      {/* Notifications */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={handleNotifToggle}
          className="relative w-8 h-8 flex items-center justify-center rounded-lg
                     bg-bg-elevated border border-border hover:border-border-bright
                     text-text-secondary hover:text-text-primary transition-all duration-150"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1
                         bg-signal-red rounded-full text-[9px] font-bold text-white
                         flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        {showNotifications && (
          <NotificationsDropdown onClose={() => setShowNotifications(false)} />
        )}
      </div>
    </header>
  )
}
