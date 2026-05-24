// store.js — single source of truth for all app state
// Uses a simple pub/sub pattern: call subscribe(fn) to listen for changes,
// call any mutator (buyShares, adjustBalance, etc.) to update state and notify all listeners.
// State is persisted to localStorage so it survives page refreshes.

import { STARTING_BALANCE } from '../config.js'

const KEY = 'stockpilot_v1' // localStorage key

const DEFAULT = {
  user: { displayName: 'Pilot', balance: STARTING_BALANCE, xp: 0, level: 1 },
  holdings: {},       // { AAPL: { shares: 5.0, avgCost: 189.52 } }
  transactions: [],   // newest first
  achievements: [],   // array of unlocked badge IDs
  orders: [],         // pending limit/stop-loss orders
  priceAlerts: [],    // price alert definitions
  netWorthHistory: [], // [{ ts, value }] snapshots for the net worth chart
  notifications: [],  // [{ id, type, message, ts, read }]
  settings: { tradeInsights: true, soundEnabled: false, musicVolume: 50, sfxVolume: 70, tutorialDone: false },
}

export const XP_THRESHOLDS = [
  0, 100, 250, 500, 800, 1200, 1700, 2400, 3200, 4200,
  5500, 7000, 9000, 11500, 14500, 18000, 22000, 27000, 33000, 40000,
  48000, 57000, 68000, 80000, 95000,
]

function levelFor(xp) {
  for (let i = XP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= XP_THRESHOLDS[i]) return i + 1
  }
  return 1
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return structuredClone(DEFAULT)
    const saved = JSON.parse(raw)
    return {
      ...DEFAULT,
      ...saved,
      user:         { ...DEFAULT.user,     ...saved.user },
      settings:     { ...DEFAULT.settings, ...saved.settings },
      achievements: saved.achievements  ?? [],
      orders:       saved.orders        ?? [],
      priceAlerts:  saved.priceAlerts   ?? [],
      netWorthHistory: saved.netWorthHistory ?? [],
      notifications:   saved.notifications   ?? [],
    }
  } catch {
    return structuredClone(DEFAULT)
  }
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      state.transactions = state.transactions.slice(0, 50)
      state.netWorthHistory = state.netWorthHistory.slice(-100)
      localStorage.setItem(KEY, JSON.stringify(state))
    }
  }
}

let state = load()
const listeners = new Set()

export const getState  = () => state
export const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn) }

function emit() { listeners.forEach(fn => fn(state)) }

// ── User ──────────────────────────────────────────────────────────────────────

export function setDisplayName(name) {
  state.user.displayName = name
  save(); emit()
}

export function adjustBalance(delta) {
  state.user.balance = Math.round((state.user.balance + delta) * 100) / 100
  save(); emit()
}

// ── Holdings ──────────────────────────────────────────────────────────────────

export function buyShares(symbol, qty, price) {
  const h = state.holdings[symbol]
  if (h) {
    // Weighted average cost: keeps track of true avg even across multiple buys
    const total = h.shares + qty
    h.avgCost = (h.shares * h.avgCost + qty * price) / total
    h.shares  = total
  } else {
    state.holdings[symbol] = { shares: qty, avgCost: price, since: Date.now() }
  }
  save(); emit()
}

export function sellShares(symbol, qty) {
  const h = state.holdings[symbol]
  if (!h) return
  h.shares -= qty
  if (h.shares < 0.000001) delete state.holdings[symbol]
  save(); emit()
}

// ── Transactions ──────────────────────────────────────────────────────────────

export function recordTx(tx) {
  state.transactions.unshift({ id: crypto.randomUUID(), ts: Date.now(), ...tx })
  if (state.transactions.length > 500) state.transactions.length = 500
  save()
}

// ── XP & Levels ──────────────────────────────────────────────────────────────

export function awardXP(amount) {
  state.user.xp += amount
  const newLevel = levelFor(state.user.xp)
  const leveled  = newLevel > state.user.level
  state.user.level = newLevel
  save(); emit()
  return leveled
}

// ── Achievements ──────────────────────────────────────────────────────────────

export function unlockBadge(id) {
  if (state.achievements.includes(id)) return false
  state.achievements.push(id)
  addNotification({ type: 'achievement', message: `Badge unlocked: ${id}` })
  save(); emit()
  return true
}

export function hasBadge(id) {
  return state.achievements.includes(id)
}

// ── Pending Orders ────────────────────────────────────────────────────────────

export function addOrder(order) {
  state.orders.push({ id: crypto.randomUUID(), ts: Date.now(), status: 'pending', ...order })
  save(); emit()
}

export function cancelOrder(id) {
  const order = state.orders.find(o => o.id === id)
  if (order) { order.status = 'cancelled'; save(); emit() }
}

export function fillOrder(id) {
  const order = state.orders.find(o => o.id === id)
  if (order) { order.status = 'filled'; order.filledAt = Date.now(); save(); emit() }
}

export function getOpenOrders() {
  return state.orders.filter(o => o.status === 'pending')
}

// ── Price Alerts ──────────────────────────────────────────────────────────────

export function addPriceAlert(alert) {
  state.priceAlerts.push({ id: crypto.randomUUID(), active: true, ...alert })
  save(); emit()
}

export function removePriceAlert(id) {
  state.priceAlerts = state.priceAlerts.filter(a => a.id !== id)
  save(); emit()
}

export function deactivatePriceAlert(id) {
  const a = state.priceAlerts.find(a => a.id === id)
  if (a) { a.active = false; save() }
}

// ── Net Worth History ─────────────────────────────────────────────────────────

export function snapshotNetWorth(value) {
  state.netWorthHistory.push({ ts: Date.now(), value })
  if (state.netWorthHistory.length > 200) state.netWorthHistory = state.netWorthHistory.slice(-200)
  save()
}

// ── Notifications ─────────────────────────────────────────────────────────────

export function addNotification(n) {
  state.notifications.unshift({ id: crypto.randomUUID(), ts: Date.now(), read: false, ...n })
  if (state.notifications.length > 30) state.notifications.length = 30
  save(); emit()
}

export function markNotificationsRead() {
  state.notifications.forEach(n => n.read = true)
  save(); emit()
}

export function getUnreadCount() {
  return state.notifications.filter(n => !n.read).length
}

// ── Settings ──────────────────────────────────────────────────────────────────

export function updateSettings(patch) {
  state.settings = { ...state.settings, ...patch }
  save(); emit()
}

// ── Reset ─────────────────────────────────────────────────────────────────────

export function resetPortfolio() {
  state.user.balance   = STARTING_BALANCE
  state.holdings       = {}
  state.transactions   = []
  state.orders         = []
  state.netWorthHistory = []
  save(); emit()
}

// ── XP Progress ───────────────────────────────────────────────────────────────

export function xpProgress() {
  const lvl = state.user.level
  const lo  = XP_THRESHOLDS[lvl - 1] ?? 0
  const hi  = XP_THRESHOLDS[lvl]     ?? XP_THRESHOLDS[XP_THRESHOLDS.length - 1]
  const pct = Math.min(((state.user.xp - lo) / (hi - lo)) * 100, 100)
  return { lo, hi, pct: isNaN(pct) ? 100 : pct }
}
