import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

const STARTING_BALANCE = 10000;
const COMMISSION_PER_LOT = 3.50;
const SLIPPAGE_PIPS = 0.5;

function formatAge(openedAt) {
  const seconds = Math.floor((Date.now() - openedAt) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

function calcPnl(trade, currentPrice) {
  const direction = trade.direction === 'BUY' ? 1 : -1;
  const pipValue = trade.lots * 10;
  const priceDiff = (currentPrice - trade.entryPrice) * direction;
  const pips = priceDiff * 10000;
  return pips * pipValue;
}

function calcMargin(lots, price) {
  return lots * 1000 * price * 0.01;
}

const INITIAL_PRICES = {
  EURUSD: 1.08500,
  GBPUSD: 1.26500,
  USDJPY: 149.500,
  AUDUSD: 0.65800,
  USDCAD: 1.36200,
  NZDUSD: 0.60500,
  USDCHF: 0.89200,
  XAUUSD: 2050.00,
  BTCUSD: 43500.00,
};

function getDefaultPrice(sym) {
  return INITIAL_PRICES[sym.toUpperCase()] ?? 1.0000;
}

export default function PaperTrading() {
  const [searchParams] = useSearchParams();

  const [balance, setBalance] = useState(STARTING_BALANCE);
  const [openTrades, setOpenTrades] = useState([]);
  const [closedTrades, setClosedTrades] = useState([]);
  const [currentPrices, setCurrentPrices] = useState({ ...INITIAL_PRICES });
  const [pulsing, setPulsing] = useState(false);

  const [form, setForm] = useState({
    symbol: searchParams.get('symbol') || 'EURUSD',
    direction: 'BUY',
    lots: '0.10',
    entryPrice: searchParams.get('entry') || String(getDefaultPrice(searchParams.get('symbol') || 'EURUSD')),
    stopLoss: searchParams.get('sl') || '',
    takeProfit: searchParams.get('tp') || '',
  });

  const [formError, setFormError] = useState('');
  const [tpWarning, setTpWarning] = useState(false);
  const [confirmClose, setConfirmClose] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [tick, setTick] = useState(0);

  const updatePrices = useCallback(() => {
    setCurrentPrices(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(sym => {
        const p = next[sym];
        const vol = p > 1000 ? p * 0.0002 : p > 100 ? p * 0.0003 : 0.00050;
        const delta = (Math.random() - 0.5) * 2 * vol;
        const decimals = sym === 'BTCUSD' || sym === 'XAUUSD' ? 2 : sym === 'USDJPY' ? 3 : 5;
        next[sym] = Math.max(0.0001, parseFloat((p + delta).toFixed(decimals)));
      });
      return next;
    });
    setPulsing(true);
    setTick(t => t + 1);
    setTimeout(() => setPulsing(false), 700);
  }, []);

  useEffect(() => {
    const id = setInterval(updatePrices, 3000);
    return () => clearInterval(id);
  }, [updatePrices]);

  const totalUnrealizedPnl = openTrades.reduce((sum, t) => {
    const price = currentPrices[t.symbol] ?? t.entryPrice;
    return sum + calcPnl(t, price);
  }, 0);

  const usedMargin = openTrades.reduce((sum, t) => sum + t.margin, 0);
  const freeMargin = balance + totalUnrealizedPnl - usedMargin;

  const closedPnls = closedTrades.map(t => t.pnl);
  const wins = closedPnls.filter(p => p > 0);
  const losses = closedPnls.filter(p => p < 0);
  const winRate = closedTrades.length > 0 ? ((wins.length / closedTrades.length) * 100).toFixed(1) : '0.0';
  const avgWin = wins.length > 0 ? (wins.reduce((a, b) => a + b, 0) / wins.length).toFixed(2) : '0.00';
  const avgLoss = losses.length > 0 ? (Math.abs(losses.reduce((a, b) => a + b, 0) / losses.length)).toFixed(2) : '0.00';
  const grossWin = wins.reduce((a, b) => a + b, 0);
  const grossLoss = Math.abs(losses.reduce((a, b) => a + b, 0));
  const profitFactor = grossLoss > 0 ? (grossWin / grossLoss).toFixed(2) : grossWin > 0 ? '∞' : '0.00';

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setFormError('');
    if (name === 'takeProfit') setTpWarning(false);
    if (name === 'symbol') {
      const price = getDefaultPrice(value);
      setForm(f => ({ ...f, symbol: value, entryPrice: String(price) }));
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    const sym = form.symbol.trim().toUpperCase();
    if (!sym) return setFormError('Symbol is required.');

    const lots = parseFloat(form.lots);
    if (isNaN(lots) || lots < 0.01 || lots > 100) return setFormError('Lots must be between 0.01 and 100.');

    const entryPrice = parseFloat(form.entryPrice);
    if (isNaN(entryPrice) || entryPrice <= 0) return setFormError('Entry price must be a positive number.');

    const sl = parseFloat(form.stopLoss);
    if (isNaN(sl) || sl <= 0) return setFormError('Stop loss is required and must be a positive number.');

    const tp = form.takeProfit.trim() ? parseFloat(form.takeProfit) : null;
    if (form.takeProfit.trim() && (isNaN(tp) || tp <= 0)) return setFormError('Take profit must be a positive number.');

    if (!form.takeProfit.trim() && !tpWarning) {
      setTpWarning(true);
      return;
    }

    const commission = lots * COMMISSION_PER_LOT;
    const margin = calcMargin(lots, entryPrice);

    if (margin > freeMargin) return setFormError(`Insufficient margin. Need $${margin.toFixed(2)}, free $${freeMargin.toFixed(2)}.`);

    const trade = {
      id: Date.now(),
      symbol: sym,
      direction: form.direction,
      lots,
      entryPrice,
      stopLoss: sl,
      takeProfit: tp,
      openedAt: Date.now(),
      commission,
      margin,
      slippage: SLIPPAGE_PIPS,
    };

    setOpenTrades(prev => [...prev, trade]);
    setBalance(prev => prev - commission);
    setTpWarning(false);
    setForm(f => ({ ...f, stopLoss: '', takeProfit: '' }));
  }

  function handleCloseExecute() {
    if (!confirmClose) return;
    const trade = confirmClose;
    const closePrice = currentPrices[trade.symbol] ?? trade.entryPrice;
    const pnl = calcPnl(trade, closePrice);

    setOpenTrades(prev => prev.filter(t => t.id !== trade.id));
    setClosedTrades(prev => [{
      ...trade,
      closePrice,
      closedAt: Date.now(),
      pnl,
      closeReason: 'Manual',
    }, ...prev]);
    setBalance(prev => prev + pnl + trade.margin);
    setConfirmClose(null);
  }

  function handleReset() {
    setBalance(STARTING_BALANCE);
    setOpenTrades([]);
    setClosedTrades([]);
    setCurrentPrices({ ...INITIAL_PRICES });
    setConfirmReset(false);
    setForm({ symbol: 'EURUSD', direction: 'BUY', lots: '0.10', entryPrice: String(INITIAL_PRICES.EURUSD), stopLoss: '', takeProfit: '' });
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white p-4" style={{ fontFamily: 'ui-monospace, monospace' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-wide">Paper Trading</h1>
          <div className="flex items-center gap-2 bg-[#111827] border border-[#1f2937] rounded-full px-3 py-1">
            <span
              className="w-2.5 h-2.5 rounded-full bg-[#00d4aa]"
              style={{
                transition: 'transform 0.2s, opacity 0.2s, box-shadow 0.2s',
                transform: pulsing ? 'scale(1.6)' : 'scale(1)',
                opacity: pulsing ? 1 : 0.6,
                boxShadow: pulsing ? '0 0 10px #00d4aa' : 'none',
              }}
            />
            <span className="text-xs text-[#00d4aa] font-semibold">LIVE</span>
          </div>
        </div>
        <button
          onClick={() => setConfirmReset(true)}
          className="border text-sm font-semibold px-4 py-2 rounded transition-colors"
          style={{ background: 'transparent', borderColor: '#ff4757', color: '#ff4757' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#ff4757'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ff4757'; }}
        >
          RESET ACCOUNT
        </button>
      </div>

      {/* Account Summary */}
      <div className="grid grid-cols-2 gap-3 mb-4" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        {[
          { label: 'Balance', value: `$${balance.toFixed(2)}`, color: '#fff' },
          { label: 'Used Margin', value: `$${usedMargin.toFixed(2)}`, color: '#ffa502' },
          { label: 'Free Margin', value: `$${freeMargin.toFixed(2)}`, color: freeMargin >= 0 ? '#00d4aa' : '#ff4757' },
          { label: 'Unrealized P&L', value: `${totalUnrealizedPnl >= 0 ? '+' : ''}$${totalUnrealizedPnl.toFixed(2)}`, color: totalUnrealizedPnl >= 0 ? '#00d4aa' : '#ff4757' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 8, padding: '1rem' }}>
            <div style={{ color: '#9ca3af', fontSize: 11, marginBottom: 4 }}>{label}</div>
            <div style={{ color, fontSize: 20, fontWeight: 700 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        {[
          { label: 'Win Rate', value: `${winRate}%`, color: '#00d4aa' },
          { label: 'Avg Win', value: `$${avgWin}`, color: '#00d4aa' },
          { label: 'Avg Loss', value: `$${avgLoss}`, color: '#ff4757' },
          { label: 'Profit Factor', value: profitFactor, color: parseFloat(profitFactor) >= 1 || profitFactor === '∞' ? '#00d4aa' : '#ff4757' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 8, padding: '1rem' }}>
            <div style={{ color: '#9ca3af', fontSize: 11, marginBottom: 4 }}>{label}</div>
            <div style={{ color, fontSize: 20, fontWeight: 700 }}>{value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 mb-6" style={{ gridTemplateColumns: '340px 1fr' }}>

        {/* New Trade Form */}
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 8, padding: '1.25rem' }}>
          <div style={{ color: '#9ca3af', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', marginBottom: '1rem', textTransform: 'uppercase' }}>New Trade</div>
          <form onSubmit={handleSubmit}>

            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', color: '#6b7280', fontSize: 11, marginBottom: 4 }}>Symbol</label>
              <input
                name="symbol"
                value={form.symbol}
                onChange={handleFormChange}
                placeholder="e.g. EURUSD"
                style={{ width: '100%', background: '#0a0e1a', border: '1px solid #1f2937', borderRadius: 6, padding: '0.5rem 0.75rem', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', color: '#6b7280', fontSize: 11, marginBottom: 4 }}>Direction</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['BUY', 'SELL'].map(dir => (
                  <button
                    key={dir}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, direction: dir }))}
                    style={{
                      flex: 1, padding: '0.5rem', borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
                      background: form.direction === dir ? (dir === 'BUY' ? '#00d4aa' : '#ff4757') : '#0a0e1a',
                      color: form.direction === dir ? (dir === 'BUY' ? '#000' : '#fff') : '#9ca3af',
                      border: form.direction === dir ? 'none' : '1px solid #1f2937',
                    }}
                  >{dir}</button>
                ))}
              </div>
            </div>

            {[
              { name: 'lots', label: 'Lots (0.01 – 100)', type: 'number', step: '0.01', min: '0.01', max: '100' },
              { name: 'entryPrice', label: 'Entry Price', type: 'number', step: 'any' },
              { name: 'stopLoss', label: 'Stop Loss *', type: 'number', step: 'any' },
              { name: 'takeProfit', label: 'Take Profit (optional)', type: 'number', step: 'any' },
            ].map(({ name, label, ...rest }) => (
              <div key={name} style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', color: '#6b7280', fontSize: 11, marginBottom: 4 }}>{label}</label>
                <input
                  name={name}
                  value={form[name]}
                  onChange={handleFormChange}
                  {...rest}
                  style={{ width: '100%', background: '#0a0e1a', border: `1px solid ${name === 'stopLoss' ? '#ff475733' : '#1f2937'}`, borderRadius: 6, padding: '0.5rem 0.75rem', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            ))}

            <div style={{ fontSize: 11, color: '#4b5563', borderTop: '1px solid #1f2937', paddingTop: '0.5rem', marginBottom: '0.75rem', lineHeight: '1.6' }}>
              <div>Commission: ${COMMISSION_PER_LOT.toFixed(2)} / lot</div>
              <div>Slippage: {SLIPPAGE_PIPS} pip per trade</div>
            </div>

            {tpWarning && (
              <div style={{ background: '#ffa50220', border: '1px solid #ffa502', borderRadius: 6, padding: '0.5rem 0.75rem', color: '#ffa502', fontSize: 11, marginBottom: '0.75rem' }}>
                No take profit set — trade has no upside target. Submit again to confirm.
              </div>
            )}

            {formError && (
              <div style={{ background: '#ff475720', border: '1px solid #ff4757', borderRadius: 6, padding: '0.5rem 0.75rem', color: '#ff4757', fontSize: 11, marginBottom: '0.75rem' }}>
                {formError}
              </div>
            )}

            <button
              type="submit"
              style={{
                width: '100%', padding: '0.625rem', borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: 'pointer', border: 'none',
                background: form.direction === 'BUY' ? '#00d4aa' : '#ff4757',
                color: form.direction === 'BUY' ? '#000' : '#fff',
              }}
            >
              Open {form.direction} Trade
            </button>
          </form>
        </div>

        {/* Open Positions */}
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 8, padding: '1.25rem' }}>
          <div style={{ color: '#9ca3af', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', marginBottom: '1rem', textTransform: 'uppercase' }}>
            Open Positions <span style={{ color: '#00d4aa' }}>({openTrades.length})</span>
          </div>

          {openTrades.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#374151', padding: '3rem 0', fontSize: 13 }}>No open positions</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 480, overflowY: 'auto' }}>
              {openTrades.map(trade => {
                const price = currentPrices[trade.symbol] ?? trade.entryPrice;
                const pnl = calcPnl(trade, price);
                const pnlPct = trade.margin > 0 ? (pnl / trade.margin) * 100 : 0;
                return (
                  <div key={trade.id} style={{ background: '#0a0e1a', border: '1px solid #1f2937', borderRadius: 8, padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, color: '#fff' }}>{trade.symbol}</span>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                          background: trade.direction === 'BUY' ? '#00d4aa20' : '#ff475720',
                          color: trade.direction === 'BUY' ? '#00d4aa' : '#ff4757',
                        }}>{trade.direction}</span>
                        <span style={{ fontSize: 11, color: '#6b7280' }}>{trade.lots} lot{trade.lots !== 1 ? 's' : ''}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: pnl >= 0 ? '#00d4aa' : '#ff4757' }}>
                            {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                          </div>
                          <div style={{ fontSize: 11, color: pnl >= 0 ? '#00d4aa' : '#ff4757' }}>
                            {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%
                          </div>
                        </div>
                        <button
                          onClick={() => setConfirmClose(trade)}
                          style={{ fontSize: 11, background: '#1f2937', border: 'none', color: '#d1d5db', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#ff4757'; e.currentTarget.style.color = '#fff'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#1f2937'; e.currentTarget.style.color = '#d1d5db'; }}
                        >CLOSE</button>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px 16px', fontSize: 11 }}>
                      {[
                        { label: 'Entry', value: trade.entryPrice, color: '#fff' },
                        { label: 'Current', value: price, color: '#ffa502' },
                        { label: 'Age', value: formatAge(trade.openedAt), color: '#fff' },
                        { label: 'SL', value: trade.stopLoss, color: '#ff4757' },
                        { label: 'TP', value: trade.takeProfit ?? '—', color: trade.takeProfit ? '#00d4aa' : '#4b5563' },
                        { label: 'Slippage', value: `${trade.slippage} pip`, color: '#6b7280' },
                      ].map(({ label, value, color }) => (
                        <div key={label}>
                          <div style={{ color: '#6b7280' }}>{label}</div>
                          <div style={{ color, fontWeight: 600 }}>{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Closed Trades History */}
      <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 8, padding: '1.25rem' }}>
        <div style={{ color: '#9ca3af', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', marginBottom: '1rem', textTransform: 'uppercase' }}>
          Trade History <span style={{ color: '#4b5563' }}>({closedTrades.length})</span>
        </div>

        {closedTrades.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#374151', padding: '2rem 0', fontSize: 13 }}>No closed trades yet</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1f2937' }}>
                  {['Symbol', 'Dir', 'Lots', 'Entry', 'Exit', 'P&L', 'Reason'].map(h => (
                    <th key={h} style={{ textAlign: h === 'Symbol' || h === 'Dir' || h === 'Reason' ? 'left' : 'right', padding: '6px 12px 6px 0', color: '#6b7280', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {closedTrades.map(t => (
                  <tr key={`${t.id}-c`} style={{ borderBottom: '1px solid #1f293740' }}>
                    <td style={{ padding: '8px 12px 8px 0', fontWeight: 700, color: '#fff' }}>{t.symbol}</td>
                    <td style={{ padding: '8px 12px 8px 0', fontWeight: 700, color: t.direction === 'BUY' ? '#00d4aa' : '#ff4757' }}>{t.direction}</td>
                    <td style={{ padding: '8px 12px 8px 0', textAlign: 'right', color: '#d1d5db' }}>{t.lots}</td>
                    <td style={{ padding: '8px 12px 8px 0', textAlign: 'right', color: '#d1d5db' }}>{t.entryPrice}</td>
                    <td style={{ padding: '8px 12px 8px 0', textAlign: 'right', color: '#d1d5db' }}>{t.closePrice}</td>
                    <td style={{ padding: '8px 12px 8px 0', textAlign: 'right', fontWeight: 700, color: t.pnl >= 0 ? '#00d4aa' : '#ff4757' }}>
                      {t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)}
                    </td>
                    <td style={{ padding: '8px 12px 8px 0', color: '#6b7280' }}>{t.closeReason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm Close Modal */}
      {confirmClose && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: '1.5rem', maxWidth: 360, width: '100%' }}>
            <div style={{ fontWeight: 700, fontSize: 18, color: '#fff', marginBottom: 8 }}>Close Position?</div>
            <div style={{ color: '#9ca3af', fontSize: 13, marginBottom: '1.25rem' }}>
              Close{' '}
              <span style={{ color: confirmClose.direction === 'BUY' ? '#00d4aa' : '#ff4757', fontWeight: 700 }}>{confirmClose.direction}</span>{' '}
              {confirmClose.lots} lot{confirmClose.lots !== 1 ? 's' : ''} of <span style={{ color: '#fff', fontWeight: 700 }}>{confirmClose.symbol}</span> at market price?
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setConfirmClose(null)} style={{ flex: 1, padding: '0.5rem', background: '#0a0e1a', border: '1px solid #1f2937', color: '#d1d5db', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Cancel</button>
              <button onClick={handleCloseExecute} style={{ flex: 1, padding: '0.5rem', background: '#ff4757', border: 'none', color: '#fff', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>Close Trade</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Reset Modal */}
      {confirmReset && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: '1.5rem', maxWidth: 360, width: '100%' }}>
            <div style={{ fontWeight: 700, fontSize: 18, color: '#fff', marginBottom: 8 }}>Reset Account?</div>
            <div style={{ color: '#9ca3af', fontSize: 13, marginBottom: '1.25rem' }}>
              This will close all open trades, erase all history, and reset your balance to <span style={{ color: '#00d4aa', fontWeight: 700 }}>$10,000</span>. This cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setConfirmReset(false)} style={{ flex: 1, padding: '0.5rem', background: '#0a0e1a', border: '1px solid #1f2937', color: '#d1d5db', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Cancel</button>
              <button onClick={handleReset} style={{ flex: 1, padding: '0.5rem', background: '#ff4757', border: 'none', color: '#fff', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>Reset</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
