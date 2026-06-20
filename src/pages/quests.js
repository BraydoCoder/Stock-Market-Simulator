// quests.js — active quest challenges replacing the achievements tab
import { getState, xpProgress } from '../state/store.js'
import { getAllPrices, portfolioValue } from '../api/prices.js'
import { BADGES } from '../utils/achievements.js'

let container = null
let unsub     = null

// ── Quest definitions ─────────────────────────────────────────────────────────
// Each quest has: id, title, desc, category, xp, icon, progress(state) → {value, goal}
// Quests auto-complete when progress.value >= progress.goal

const QUESTS = [
  // ── Trading ──
  {
    id: 'q_first_buy',
    title: 'First Steps',
    desc: 'Execute your first buy order.',
    category: 'Trading',
    icon: 'BUY',
    xp: 50,
    progress: s => ({ value: s.transactions.filter(t => t.type === 'buy').length, goal: 1 }),
  },
  {
    id: 'q_first_sell',
    title: 'Take the Win',
    desc: 'Execute your first sell order.',
    category: 'Trading',
    icon: 'SELL',
    xp: 50,
    progress: s => ({ value: s.transactions.filter(t => t.type === 'sell').length, goal: 1 }),
  },
  {
    id: 'q_5_trades',
    title: 'Getting Active',
    desc: 'Make 5 total trades (buys or sells).',
    category: 'Trading',
    icon: 'x5',
    xp: 100,
    progress: s => ({ value: s.transactions.length, goal: 5 }),
  },
  {
    id: 'q_25_trades',
    title: 'Active Trader',
    desc: 'Make 25 total trades.',
    category: 'Trading',
    icon: 'x25',
    xp: 250,
    progress: s => ({ value: s.transactions.length, goal: 25 }),
  },
  {
    id: 'q_100_trades',
    title: 'Market Veteran',
    desc: 'Make 100 total trades.',
    category: 'Trading',
    icon: 'x100',
    xp: 750,
    progress: s => ({ value: s.transactions.length, goal: 100 }),
  },
  {
    id: 'q_first_profit',
    title: 'In the Green',
    desc: 'Close a position with a profit.',
    category: 'Trading',
    icon: 'WIN',
    xp: 75,
    progress: s => ({
      value: s.transactions.filter(t => t.type === 'sell' && (t.realizedGain ?? 0) > 0).length,
      goal: 1,
    }),
  },
  {
    id: 'q_5_profits',
    title: 'Consistent Winner',
    desc: 'Close 5 positions with a profit.',
    category: 'Trading',
    icon: '5WIN',
    xp: 200,
    progress: s => ({
      value: s.transactions.filter(t => t.type === 'sell' && (t.realizedGain ?? 0) > 0).length,
      goal: 5,
    }),
  },
  {
    id: 'q_profit_500',
    title: 'Five Hundred Up',
    desc: 'Earn PC$500 in total realized gains.',
    category: 'Trading',
    icon: '$500',
    xp: 150,
    progress: s => ({
      value: Math.max(0, Math.round(
        s.transactions.filter(t => t.type === 'sell').reduce((sum, t) => sum + (t.realizedGain ?? 0), 0)
      )),
      goal: 500,
    }),
  },
  {
    id: 'q_profit_5000',
    title: 'Big Earner',
    desc: 'Earn PC$5,000 in total realized gains.',
    category: 'Trading',
    icon: '$5K',
    xp: 500,
    progress: s => ({
      value: Math.max(0, Math.round(
        s.transactions.filter(t => t.type === 'sell').reduce((sum, t) => sum + (t.realizedGain ?? 0), 0)
      )),
      goal: 5000,
    }),
  },

  // ── Portfolio ──
  {
    id: 'q_hold_3',
    title: 'Spread the Risk',
    desc: 'Hold 3 different stocks at the same time.',
    category: 'Portfolio',
    icon: 'x3',
    xp: 75,
    progress: s => ({ value: Object.keys(s.holdings).length, goal: 3 }),
  },
  {
    id: 'q_hold_5',
    title: 'Diversified',
    desc: 'Hold 5 different stocks at the same time.',
    category: 'Portfolio',
    icon: 'x5',
    xp: 150,
    progress: s => ({ value: Object.keys(s.holdings).length, goal: 5 }),
  },
  {
    id: 'q_hold_10',
    title: 'Full Portfolio',
    desc: 'Hold 10 different stocks simultaneously.',
    category: 'Portfolio',
    icon: 'x10',
    xp: 300,
    progress: s => ({ value: Object.keys(s.holdings).length, goal: 10 }),
  },
  {
    id: 'q_nw_12000',
    title: 'Growing Up',
    desc: 'Reach a net worth of PC$12,000.',
    category: 'Portfolio',
    icon: '$12K',
    xp: 100,
    progress: s => ({
      value: Math.round(s.user.balance + portfolioValue(s.holdings)),
      goal: 12000,
    }),
  },
  {
    id: 'q_nw_15000',
    title: 'Up 50%',
    desc: 'Grow your net worth to PC$15,000.',
    category: 'Portfolio',
    icon: '+50%',
    xp: 250,
    progress: s => ({
      value: Math.round(s.user.balance + portfolioValue(s.holdings)),
      goal: 15000,
    }),
  },
  {
    id: 'q_nw_25000',
    title: 'Quarter Million Milestone',
    desc: 'Reach PC$25,000 total net worth.',
    category: 'Portfolio',
    icon: '$25K',
    xp: 500,
    progress: s => ({
      value: Math.round(s.user.balance + portfolioValue(s.holdings)),
      goal: 25000,
    }),
  },
  {
    id: 'q_nw_50000',
    title: 'Half a Hundred',
    desc: 'Reach PC$50,000 total net worth.',
    category: 'Portfolio',
    icon: '$50K',
    xp: 1000,
    progress: s => ({
      value: Math.round(s.user.balance + portfolioValue(s.holdings)),
      goal: 50000,
    }),
  },
  {
    id: 'q_watchlist_5',
    title: 'On My Radar',
    desc: 'Add 5 stocks to your watchlist.',
    category: 'Portfolio',
    icon: 'WCH',
    xp: 50,
    progress: s => ({ value: (s.watchlist ?? []).length, goal: 5 }),
  },

  // ── Learning ──
  {
    id: 'q_alert_set',
    title: 'Stay Alert',
    desc: 'Set your first price alert.',
    category: 'Explorer',
    icon: 'ALT',
    xp: 50,
    progress: s => ({ value: (s.priceAlerts ?? []).length, goal: 1 }),
  },
  {
    id: 'q_level_5',
    title: 'Level Up x5',
    desc: 'Reach level 5.',
    category: 'Explorer',
    icon: 'LV5',
    xp: 200,
    progress: s => ({ value: s.user.level, goal: 5 }),
  },
  {
    id: 'q_level_10',
    title: 'Double Digits',
    desc: 'Reach level 10.',
    category: 'Explorer',
    icon: 'LV10',
    xp: 400,
    progress: s => ({ value: s.user.level, goal: 10 }),
  },
  {
    id: 'q_xp_1000',
    title: 'XP Grinder',
    desc: 'Earn 1,000 total XP.',
    category: 'Explorer',
    icon: '1KXP',
    xp: 100,
    progress: s => ({ value: s.user.xp, goal: 1000 }),
  },
  {
    id: 'q_xp_5000',
    title: 'XP Legend',
    desc: 'Earn 5,000 total XP.',
    category: 'Explorer',
    icon: '5KXP',
    xp: 300,
    progress: s => ({ value: s.user.xp, goal: 5000 }),
  },
  {
    id: 'q_badge_3',
    title: 'Badge Collector',
    desc: 'Unlock 3 achievement badges.',
    category: 'Explorer',
    icon: '3BDG',
    xp: 100,
    progress: s => ({ value: (s.achievements ?? []).length, goal: 3 }),
  },
  {
    id: 'q_badge_10',
    title: 'Achievement Hunter',
    desc: 'Unlock 10 achievement badges.',
    category: 'Explorer',
    icon: '10BDG',
    xp: 350,
    progress: s => ({ value: (s.achievements ?? []).length, goal: 10 }),
  },
]

const CATEGORIES = ['All', 'Trading', 'Portfolio', 'Explorer']

const LEVEL_TITLES = [
  '', 'Rookie Pilot', 'Market Watcher', 'Trade Starter', 'Chart Reader',
  'Bull Believer', 'Risk Taker', 'Portfolio Builder', 'Swing Trader',
  'Value Hunter', 'Market Analyst', 'Sector Scout', 'Index Beater',
  'Alpha Seeker', 'Momentum Trader', 'Portfolio Pro', 'Smart Money',
  'Deep Value', 'Market Timer', 'Quant Trader', 'Hedge Fund Boss',
  'Market Maker', 'Wolf of StockPilot', 'Trading Legend', 'Warren Buffett Jr.',
  'Pilot Grandmaster',
]

// ── Mount / unmount ───────────────────────────────────────────────────────────

let activeCategory = 'All'

export function mountQuests(el, subscribeFn) {
  container      = el
  activeCategory = 'All'
  unsub = subscribeFn(() => render())
  render()
}

export function unmountQuests() {
  if (unsub) { unsub(); unsub = null }
  container = null
}

// ── Render ────────────────────────────────────────────────────────────────────

function render() {
  if (!container) return
  const state = getState()
  const { pct, hi }   = xpProgress()

  const filtered = activeCategory === 'All'
    ? QUESTS
    : QUESTS.filter(q => q.category === activeCategory)

  const done       = QUESTS.filter(q => { const p = q.progress(state); return p.value >= p.goal })
  const doneCount  = done.length
  const totalCount = QUESTS.length
  const overallPct = Math.round(doneCount / totalCount * 100)

  container.innerHTML = `
    <div class="max-w-5xl mx-auto px-4 py-6 space-y-6">

      <div>
        <h1 class="text-2xl font-display font-bold text-text-primary">Quests</h1>
        <p class="text-sm text-text-muted mt-1">Complete challenges to earn XP and level up your trading career.</p>
      </div>

      <!-- Level + XP card -->
      <div class="bg-surface border border-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-2xl bg-accent-primary/10 border border-accent-primary/30 flex items-center justify-center">
            <span class="text-2xl font-display font-bold text-accent-primary">${state.user.level}</span>
          </div>
          <div>
            <div class="text-xs text-text-muted uppercase tracking-wide mb-0.5">Current Rank</div>
            <div class="text-lg font-bold text-text-primary">${LEVEL_TITLES[state.user.level] ?? 'Pilot'}</div>
            <div class="text-xs text-text-muted">${state.user.xp.toLocaleString()} XP total</div>
          </div>
        </div>
        <div class="flex-1 sm:ml-4">
          <div class="flex justify-between text-xs text-text-muted mb-1.5">
            <span>Progress to Level ${state.user.level + 1}</span>
            <span>${hi.toLocaleString()} XP needed</span>
          </div>
          <div class="h-2.5 bg-surface-elevated rounded-full overflow-hidden">
            <div class="h-full bg-accent-primary rounded-full transition-all duration-700" style="width:${pct}%"></div>
          </div>
        </div>
        <div class="text-center sm:text-right shrink-0">
          <div class="text-2xl font-bold font-mono text-accent-secondary">${doneCount}<span class="text-text-muted text-base font-normal">/${totalCount}</span></div>
          <div class="text-xs text-text-muted">Quests done</div>
          <div class="w-full h-1 bg-surface-elevated rounded-full overflow-hidden mt-1.5">
            <div class="h-full bg-accent-secondary rounded-full" style="width:${overallPct}%"></div>
          </div>
        </div>
      </div>

      <!-- Category filter -->
      <div class="flex gap-2 flex-wrap">
        ${CATEGORIES.map(c => `
          <button data-cat="${c}" class="quest-cat-btn px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors
            ${activeCategory === c
              ? 'bg-accent-primary text-bg border-accent-primary'
              : 'bg-surface border-border text-text-muted hover:text-text-primary'}">
            ${c}
          </button>
        `).join('')}
      </div>

      <!-- Quest list -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        ${filtered.map(q => questCard(q, state)).join('')}
      </div>

    </div>
  `

  container.querySelectorAll('.quest-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => { activeCategory = btn.dataset.cat; render() })
  })
}

function questCard(quest, state) {
  const { value, goal } = quest.progress(state)
  const done      = value >= goal
  const barPct    = Math.min(100, Math.round((value / goal) * 100))
  const showNum   = goal > 1

  return `
    <div class="bg-surface border ${done ? 'border-gain/40' : 'border-border'} rounded-2xl p-4 flex flex-col gap-3
      ${done ? 'shadow-[0_0_12px_rgba(16,185,129,0.08)]' : ''}">

      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-bold shrink-0
          ${done ? 'bg-gain/10 border border-gain/30' : 'bg-surface-elevated border border-border'}">
          ${quest.icon}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold text-text-primary">${quest.title}</span>
            ${done ? '<span class="text-[10px] text-gain font-bold">✓ COMPLETE</span>' : ''}
          </div>
          <p class="text-[11px] text-text-muted mt-0.5 leading-relaxed">${quest.desc}</p>
        </div>
      </div>

      ${showNum ? `
        <div>
          <div class="flex justify-between text-[10px] text-text-muted mb-1">
            <span class="${done ? 'text-gain' : ''}">${value.toLocaleString()} / ${goal.toLocaleString()}</span>
            <span>${barPct}%</span>
          </div>
          <div class="h-1.5 bg-surface-elevated rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all duration-500 ${done ? 'bg-gain' : 'bg-accent-primary'}"
              style="width:${barPct}%"></div>
          </div>
        </div>
      ` : `
        <div class="flex items-center gap-2">
          <div class="h-1.5 flex-1 bg-surface-elevated rounded-full overflow-hidden">
            <div class="h-full rounded-full ${done ? 'bg-gain' : 'bg-accent-primary'}" style="width:${done ? 100 : 0}%"></div>
          </div>
        </div>
      `}

      <div class="flex items-center justify-between">
        <span class="text-[10px] px-2 py-0.5 rounded-full border text-text-muted border-border bg-surface-elevated">
          ${quest.category}
        </span>
        <span class="text-[10px] font-bold ${done ? 'text-gain' : 'text-accent-secondary'}">+${quest.xp} XP</span>
      </div>

    </div>
  `
}
