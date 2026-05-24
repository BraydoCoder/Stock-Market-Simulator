import { STOCKS } from '../data/stocks.js'
import { FINNHUB_API_KEY } from '../config.js'

const store = new Map()

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

export function getPrice(symbol) {
  return store.get(symbol) ?? { price: 0, change: 0, changePct: 0, prev: 0 }
}

export function getAllPrices() { return store }

export function tick() {
  STOCKS.forEach(s => {
    const cur = store.get(s.symbol)
    if (!cur) return
    const delta   = cur.price * (Math.random() * 0.004 - 0.002)
    const price   = Math.max(Math.round((cur.price + delta) * 100) / 100, 0.01)
    const chg     = Math.round((price - s.basePrice) * 100) / 100
    const chgPct  = Math.round((chg / s.basePrice) * 10000) / 100
    store.set(s.symbol, { price, change: chg, changePct: chgPct, prev: cur.price })
  })
  window.dispatchEvent(new Event('prices-updated'))
}

export function portfolioValue(holdings) {
  return Object.entries(holdings).reduce((sum, [sym, h]) => {
    return sum + h.shares * (getPrice(sym).price || 0)
  }, 0)
}

export async function fetchFinnhub(symbol) {
  if (!FINNHUB_API_KEY) return null
  try {
    const res  = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (!res.ok) return null
    const data = await res.json()
    if (!data.c) return null
    store.set(symbol, {
      price:     data.c,
      change:    data.d,
      changePct: data.dp,
      prev:      store.get(symbol)?.price ?? data.c,
    })
    return store.get(symbol)
  } catch {
    return null
  }
}
