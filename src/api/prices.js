// prices.js — manages all stock price data
// Data flow: initPrices() seeds the store → tick() updates every 3s →
// 'prices-updated' event fires → UI components re-render with new prices.
// If a Finnhub API key is set, fetchFinnhub() replaces mock data with real quotes.

import { STOCKS } from '../data/stocks.js'
import { FINNHUB_API_KEY } from '../config.js'

// In-memory map: symbol → { price, change, changePct, prev }
const store = new Map()

// Seed every stock with a random ±3% jitter from its base price
export function initPrices() {
  STOCKS.forEach(s => {
    const jitter = 1 + (Math.random() * 0.06 - 0.03)
    const price  = Math.round(s.basePrice * jitter * 100) / 100
    store.set(s.symbol, {
      price,
      change:    Math.round((price - s.basePrice) * 100) / 100,
      changePct: Math.round((jitter - 1) * 10000) / 100,
      prev:      price,
    })
  })
}

// Returns the latest price data for one symbol
export function getPrice(symbol) {
  return store.get(symbol) ?? { price: 0, change: 0, changePct: 0, prev: 0 }
}

export function getAllPrices() { return store }

// Simulate one price tick: move each stock ±0.2% randomly, then notify listeners
export function tick() {
  STOCKS.forEach(s => {
    const cur = store.get(s.symbol)
    if (!cur) return
    const delta   = cur.price * (Math.random() * 0.004 - 0.002) // ±0.2%
    const price   = Math.max(Math.round((cur.price + delta) * 100) / 100, 0.01)
    const chg     = Math.round((price - s.basePrice) * 100) / 100
    const chgPct  = Math.round((chg / s.basePrice) * 10000) / 100
    store.set(s.symbol, { price, change: chg, changePct: chgPct, prev: cur.price })
  })
  // Broadcast so all listening UI components know to re-render
  window.dispatchEvent(new Event('prices-updated'))
}

// Calculate total market value of a holdings object { AAPL: { shares, avgCost }, ... }
export function portfolioValue(holdings) {
  return Object.entries(holdings).reduce((sum, [sym, h]) => {
    return sum + h.shares * (getPrice(sym).price || 0)
  }, 0)
}

// Fetch a real-time quote from Finnhub and update the store.
// Falls back to mock data silently if the key is missing or the request fails.
export async function fetchFinnhub(symbol) {
  if (!FINNHUB_API_KEY) return null
  try {
    const res  = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (!res.ok) return null
    const data = await res.json()
    if (!data.c) return null   // data.c is the current price field from Finnhub
    store.set(symbol, {
      price:     data.c,
      change:    data.d,       // data.d = dollar change
      changePct: data.dp,      // data.dp = percent change
      prev:      store.get(symbol)?.price ?? data.c,
    })
    return store.get(symbol)
  } catch {
    return null
  }
}
