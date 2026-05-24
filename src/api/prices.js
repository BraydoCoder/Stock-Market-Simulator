// prices.js — stock price data layer
//
// Two modes depending on whether VITE_FINNHUB_API_KEY is set in .env.local:
//
//   Real mode  (API key present):
//     - initPrices() seeds UI instantly with base prices, then fetches all 37
//       stocks from Finnhub (staggered at 150ms each to stay inside the
//       60 req/min free-tier limit).
//     - startFinnhubPolling() re-fetches all stocks every 60 seconds.
//     - tick() does NOT apply a random walk — it only checks orders/alerts
//       and fires 'prices-updated' so the UI can refresh timestamps.
//
//   Simulation mode (no API key):
//     - tick() applies ±0.2% random walk every 3 seconds and fires
//       'prices-updated'.  No network calls are made.

import { STOCKS } from '../data/stocks.js'
import { FINNHUB_API_KEY } from '../config.js'
import { getState, deactivatePriceAlert, addNotification, snapshotNetWorth } from '../state/store.js'
import { toast } from '../components/toast.js'
import { pc } from '../utils/format.js'

// In-memory map: symbol → { price, change, changePct, prev }
const store = new Map()

// ── Init ──────────────────────────────────────────────────────────────────────

export function initPrices() {
  // Seed every stock with a ±3% jitter from base price so the UI isn't empty
  // while real data loads.
  STOCKS.forEach(s => {
    const jitter = 1 + (Math.random() * 0.06 - 0.03)
    const price  = round2(s.basePrice * jitter)
    store.set(s.symbol, {
      price,
      change:    round2(price - s.basePrice),
      changePct: round2((jitter - 1) * 100),
      prev:      price,
    })
  })

  // If an API key is present, immediately replace mock prices with real ones.
  if (FINNHUB_API_KEY) fetchAllRealPrices()
}

// Starts a 60-second polling loop that keeps all prices fresh from Finnhub.
// Call this once from main.js after initPrices().
export function startFinnhubPolling() {
  if (!FINNHUB_API_KEY) return
  setInterval(fetchAllRealPrices, 60_000)
}

// Fetch all 37 stocks from Finnhub, staggered at 150ms each.
// 37 × 150ms ≈ 5.5s total, well inside the 60 req/min rate limit.
async function fetchAllRealPrices() {
  for (const s of STOCKS) {
    await fetchFinnhub(s.symbol)
    await delay(150)
  }
  window.dispatchEvent(new Event('prices-updated'))
}

// ── Getters ───────────────────────────────────────────────────────────────────

export function getPrice(symbol) {
  return store.get(symbol) ?? { price: 0, change: 0, changePct: 0, prev: 0 }
}

export function getAllPrices() { return store }

// ── Tick ──────────────────────────────────────────────────────────────────────

// Called every 3 seconds from main.js.
// In real mode: no price movement (Finnhub polling handles that).
// In simulation mode: applies a small random walk to every stock.
export function tick() {
  if (!FINNHUB_API_KEY) {
    // Simulation: move each stock ±0.2% randomly
    STOCKS.forEach(s => {
      const cur = store.get(s.symbol)
      if (!cur) return
      const delta   = cur.price * (Math.random() * 0.004 - 0.002)
      const price   = Math.max(round2(cur.price + delta), 0.01)
      const chg     = round2(price - s.basePrice)
      const chgPct  = round2((chg / s.basePrice) * 100)
      store.set(s.symbol, { price, change: chg, changePct: chgPct, prev: cur.price })
    })
  }

  checkPriceAlerts()
  checkOrdersAndSnapshot()
  window.dispatchEvent(new Event('prices-updated'))
}

// ── Finnhub REST ──────────────────────────────────────────────────────────────

// Fetches a single real-time quote and writes it into the store.
// Returns the stored entry, or null on failure/missing key.
export async function fetchFinnhub(symbol) {
  if (!FINNHUB_API_KEY) return null
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (!res.ok) return null
    const data = await res.json()
    if (!data.c) return null   // data.c = current price; missing means bad response

    const prev = store.get(symbol)?.price ?? data.c
    store.set(symbol, {
      price:     data.c,
      change:    data.d  ?? round2(data.c - prev),   // d = dollar change
      changePct: data.dp ?? 0,                        // dp = percent change
      prev,
    })
    return store.get(symbol)
  } catch {
    return null
  }
}

// ── Portfolio value ───────────────────────────────────────────────────────────

export function portfolioValue(holdings) {
  return Object.entries(holdings).reduce((sum, [sym, h]) => {
    return sum + h.shares * (getPrice(sym).price || 0)
  }, 0)
}

// ── Market hours ──────────────────────────────────────────────────────────────

// Returns true if the US market is currently open (Mon–Fri 9:30–16:00 ET).
export function isMarketOpen() {
  const et   = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const day  = et.getDay()
  const mins = et.getHours() * 60 + et.getMinutes()
  return day >= 1 && day <= 5 && mins >= 570 && mins < 960
}

// ── Simulated price history ───────────────────────────────────────────────────

// Generates a stable random-walk price history for the stock detail chart.
// Seeded by symbol so history is consistent within a page load.
export function getPriceHistory(symbol, range = '1D') {
  const p = getPrice(symbol).price
  if (!p) return []

  let points, volatility
  if (range === '1D')      { points = 78;  volatility = 0.002 }
  else if (range === '1W') { points = 35;  volatility = 0.005 }
  else                     { points = 22;  volatility = 0.01  }

  let seed = symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0) + range.length
  const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280 }

  const history = [p]
  for (let i = 1; i < points; i++) {
    const prev  = history[0]
    const delta = prev * (rand() * volatility * 2 - volatility)
    history.unshift(Math.max(prev + delta, 0.01))
  }

  const stepMs = range === '1D' ? 5 * 60_000 : range === '1W' ? 60 * 60_000 : 24 * 60 * 60_000
  const now    = Date.now()
  return history.map((price, i) => ({ ts: now - (points - 1 - i) * stepMs, price }))
}

// ── Internals ─────────────────────────────────────────────────────────────────

function round2(n) { return Math.round(n * 100) / 100 }
function delay(ms) { return new Promise(r => setTimeout(r, ms)) }

function checkPriceAlerts() {
  const state = getState()
  state.priceAlerts.filter(a => a.active).forEach(alert => {
    const p = getPrice(alert.symbol)
    const triggered = alert.direction === 'above'
      ? p.price >= alert.threshold
      : p.price <= alert.threshold
    if (triggered) {
      const msg = `🔔 ${alert.symbol} ${alert.direction === 'above' ? 'rose above' : 'dropped below'} ${pc(alert.threshold)} — now ${pc(p.price)}`
      toast(msg, 'info', 5000)
      addNotification({ type: 'alert', message: msg })
      deactivatePriceAlert(alert.id)
    }
  })
}

function checkOrdersAndSnapshot() {
  import('../utils/orders.js').then(m => m.processOrders()).catch(() => {})

  const state = getState()
  const total = state.user.balance + portfolioValue(state.holdings)
  const last  = state.netWorthHistory.at(-1)
  if (!last || Date.now() - last.ts > 90_000) snapshotNetWorth(total)
}
