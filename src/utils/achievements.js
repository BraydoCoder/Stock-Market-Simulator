// achievements.js — badge definitions and unlock logic
// checkAchievements() is called after every trade and on each price tick.
// Each badge has an id, name, description, icon, xp reward, and a check() fn.

import { getState, unlockBadge, hasBadge, awardXP } from '../state/store.js'
import { getAllPrices, portfolioValue } from '../api/prices.js'
import { toast } from '../components/toast.js'

export const BADGES = [
  // ── Standard ────────────────────────────────────────────────────────────────
  {
    id: 'first_trade',
    name: 'First Trade',
    desc: 'Execute your first buy order.',
    icon: '🚀',
    xp: 50,
    check: (s) => s.transactions.some(t => t.type === 'buy'),
  },
  {
    id: 'first_sell',
    name: 'First Sell',
    desc: 'Execute your first sell order.',
    icon: '💰',
    xp: 50,
    check: (s) => s.transactions.some(t => t.type === 'sell'),
  },
  {
    id: 'first_profit',
    name: 'First Profit',
    desc: 'Close a position in the green.',
    icon: '📈',
    xp: 75,
    check: (s) => s.transactions.some(t => t.type === 'sell' && (t.realizedGain ?? 0) > 0),
  },
  {
    id: 'first_loss',
    name: 'First Loss',
    desc: 'Sell a position for a loss. Everyone stumbles.',
    icon: '📉',
    xp: 25,
    check: (s) => s.transactions.some(t => t.type === 'sell' && (t.realizedGain ?? 0) < 0),
  },
  {
    id: 'diversified_5',
    name: 'Diversified 5',
    desc: 'Hold 5 different stocks at the same time.',
    icon: '🗂️',
    xp: 100,
    check: (s) => Object.keys(s.holdings).length >= 5,
  },
  {
    id: 'diversified_10',
    name: 'Diversified 10',
    desc: 'Hold 10 different stocks at the same time.',
    icon: '🌐',
    xp: 200,
    check: (s) => Object.keys(s.holdings).length >= 10,
  },
  {
    id: 'gain_5pct',
    name: 'Up 5%',
    desc: 'Grow your total portfolio value by 5%.',
    icon: '📊',
    xp: 100,
    check: (s, prices) => {
      const total = s.user.balance + portfolioValue(s.holdings)
      return (total - 10000) / 10000 >= 0.05
    },
  },
  {
    id: 'gain_10pct',
    name: 'Up 10%',
    desc: 'Grow your total portfolio value by 10%.',
    icon: '💎',
    xp: 200,
    check: (s, prices) => {
      const total = s.user.balance + portfolioValue(s.holdings)
      return (total - 10000) / 10000 >= 0.10
    },
  },
  {
    id: 'gain_25pct',
    name: 'Up 25%',
    desc: 'Grow your total portfolio value by 25%.',
    icon: '🏆',
    xp: 500,
    check: (s) => {
      const total = s.user.balance + portfolioValue(s.holdings)
      return (total - 10000) / 10000 >= 0.25
    },
  },
  {
    id: 'gain_50pct',
    name: 'Up 50%',
    desc: 'Double half your starting balance.',
    icon: '🌟',
    xp: 1000,
    check: (s) => {
      const total = s.user.balance + portfolioValue(s.holdings)
      return (total - 10000) / 10000 >= 0.50
    },
  },
  {
    id: 'gain_100pct',
    name: 'Doubled Up',
    desc: 'Double your entire starting balance.',
    icon: '🔥',
    xp: 2500,
    check: (s) => {
      const total = s.user.balance + portfolioValue(s.holdings)
      return (total - 10000) / 10000 >= 1.0
    },
  },
  {
    id: 'limit_order',
    name: 'Limit Setter',
    desc: 'Place a limit order.',
    icon: '🎯',
    xp: 75,
    check: (s) => s.transactions.some(t => t.orderType === 'limit'),
  },
  {
    id: 'stop_loss',
    name: 'Risk Manager',
    desc: 'Place a stop-loss order.',
    icon: '🛡️',
    xp: 75,
    check: (s) => s.transactions.some(t => t.orderType === 'stop-loss'),
  },
  {
    id: 'trades_10',
    name: '10 Trades',
    desc: 'Complete 10 total trades.',
    icon: '⚡',
    xp: 150,
    check: (s) => s.transactions.length >= 10,
  },
  {
    id: 'trades_50',
    name: '50 Trades',
    desc: 'Complete 50 total trades.',
    icon: '💫',
    xp: 500,
    check: (s) => s.transactions.length >= 50,
  },
  {
    id: 'tech_investor',
    name: 'Tech Investor',
    desc: 'Own 3 or more Technology sector stocks simultaneously.',
    icon: '💻',
    xp: 100,
    check: (s) => {
      const { STOCKS } = window.__STOCKS__ ?? { STOCKS: [] }
      const techSymbols = new Set(STOCKS.filter(st => st.sector === 'Technology').map(st => st.symbol))
      return Object.keys(s.holdings).filter(sym => techSymbols.has(sym)).length >= 3
    },
  },
  {
    id: 'all_sectors',
    name: 'Sector Scout',
    desc: 'Hold at least one stock in every sector.',
    icon: '🗺️',
    xp: 300,
    check: (s) => {
      const { STOCKS } = window.__STOCKS__ ?? { STOCKS: [] }
      const allSectors = new Set(STOCKS.map(st => st.sector))
      const ownedSectors = new Set(
        Object.keys(s.holdings).map(sym => STOCKS.find(st => st.symbol === sym)?.sector).filter(Boolean)
      )
      return allSectors.size > 0 && [...allSectors].every(sec => ownedSectors.has(sec))
    },
  },
  {
    id: 'tutorial_done',
    name: 'Ready for Takeoff',
    desc: 'Complete the tutorial.',
    icon: '✈️',
    xp: 100,
    check: (s) => s.settings.tutorialDone,
  },
  {
    id: 'level_10',
    name: 'Level 10',
    desc: 'Reach investor level 10.',
    icon: '🎖️',
    xp: 0,
    check: (s) => s.user.level >= 10,
  },
  {
    id: 'level_25',
    name: 'Grandmaster',
    desc: 'Reach the maximum investor level 25.',
    icon: '👑',
    xp: 0,
    check: (s) => s.user.level >= 25,
  },
  // ── Secret ───────────────────────────────────────────────────────────────────
  {
    id: 'night_owl',
    name: 'Night Owl',
    desc: 'Make a trade after 11 PM local time.',
    icon: '🦉',
    xp: 50,
    secret: true,
    check: (s) => s.transactions.some(t => new Date(t.ts).getHours() >= 23),
  },
  {
    id: 'paper_hands',
    name: 'Paper Hands',
    desc: 'Sell a stock within 60 seconds of buying it.',
    icon: '📄',
    xp: 25,
    secret: true,
    check: (s) => {
      const sells = s.transactions.filter(t => t.type === 'sell')
      return sells.some(sell => {
        const prevBuy = s.transactions.find(t => t.type === 'buy' && t.symbol === sell.symbol && t.ts < sell.ts)
        return prevBuy && (sell.ts - prevBuy.ts) < 60_000
      })
    },
  },
  {
    id: 'diamond_hands',
    name: 'Diamond Hands',
    desc: 'Hold a stock through a 10%+ unrealized loss without selling.',
    icon: '💎',
    xp: 200,
    secret: true,
    check: (s, prices) => {
      return Object.entries(s.holdings).some(([sym, h]) => {
        const price = prices?.get(sym)?.price ?? h.avgCost
        return (price - h.avgCost) / h.avgCost <= -0.10
      })
    },
  },
  {
    id: 'all_in',
    name: 'All In',
    desc: 'Spend 95% or more of your balance in a single trade.',
    icon: '🎲',
    xp: 100,
    secret: true,
    check: (s) => s.transactions.some(t => t.type === 'buy' && t.total >= (s.user.balance + t.total) * 0.95),
  },
  {
    id: 'big_spender',
    name: 'Big Spender',
    desc: 'Make a single trade worth over PC$5,000.',
    icon: '💸',
    xp: 150,
    secret: true,
    check: (s) => s.transactions.some(t => t.total >= 5000),
  },
  {
    id: 'perfect_timing',
    name: 'Perfect Timing',
    desc: 'Sell a stock at a gain of 20%+ from your average cost.',
    icon: '⏱️',
    xp: 250,
    secret: true,
    check: (s) => s.transactions.some(t => {
      if (t.type !== 'sell') return false
      const gainPct = t.realizedGain != null && t.total > 0
        ? (t.realizedGain / (t.total - t.realizedGain)) * 100
        : 0
      return gainPct >= 20
    }),
  },
]

export function checkAchievements() {
  const s = getState()
  const prices = getAllPrices()

  BADGES.forEach(badge => {
    if (hasBadge(badge.id)) return
    try {
      if (badge.check(s, prices)) {
        const granted = unlockBadge(badge.id)
        if (granted) {
          if (badge.xp > 0) awardXP(badge.xp)
          toast(`🏅 Badge unlocked: ${badge.name}`, 'success', 4000)
        }
      }
    } catch { /* ignore check errors */ }
  })
}
