// profile.js — user stats, badges, and recent activity
import { getState, xpProgress, subscribe } from '../state/store.js'
import { portfolioValue } from '../api/prices.js'
import { BADGES } from '../utils/achievements.js'
import { pc, pct, relativeTime } from '../utils/format.js'
import { STARTING_BALANCE } from '../config.js'

const LEVEL_TITLES = [
  '', 'Rookie Pilot', 'Market Watcher', 'Trade Starter', 'Chart Reader',
  'Bull Believer', 'Risk Taker', 'Portfolio Builder', 'Swing Trader',
  'Value Hunter', 'Market Analyst', 'Sector Scout', 'Index Beater',
  'Alpha Seeker', 'Momentum Trader', 'Portfolio Pro', 'Smart Money',
  'Deep Value', 'Market Timer', 'Quant Trader', 'Hedge Fund Boss',
  'Market Maker', 'Wolf of StockPilot', 'Trading Legend', 'Warren Buffett Jr.',
  'Pilot Grandmaster',
]

let container = null
let unsub = null

export function mountProfile(el) {
  container = el
  unsub = subscribe(() => render())
  render()
}

export function unmountProfile() {
  if (unsub) { unsub(); unsub = null }
  container = null
}

function render() {
  if (!container) return
  const state = getState()
  const { pct: xpPct, hi } = xpProgress()
  const portVal = portfolioValue(state.holdings)
  const totalVal = state.user.balance + portVal
  const gainPct = ((totalVal - STARTING_BALANCE) / STARTING_BALANCE) * 100

  const unlocked = BADGES.filter(b => state.achievements.includes(b.id))
  const recentBadges = unlocked.slice(-4).reverse()
  const recentTxs = state.transactions.slice(0, 5)

  container.innerHTML = `
    <div class="max-w-4xl mx-auto px-4 py-6 space-y-6">

      <h1 class="text-2xl font-display font-bold text-text-primary">Profile</h1>

      <!-- Hero card -->
      <div class="bg-surface border border-border rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <!-- Avatar -->
        <div class="w-20 h-20 rounded-full bg-accent-secondary/20 border-2 border-accent-secondary flex items-center justify-center text-3xl font-bold text-accent-secondary shrink-0">
          ${state.user.displayName[0].toUpperCase()}
        </div>
        <div class="flex-1 text-center sm:text-left">
          <h2 class="text-2xl font-bold text-text-primary">${state.user.displayName}</h2>
          <div class="text-accent-secondary text-sm font-medium mb-3">${LEVEL_TITLES[state.user.level] ?? 'Pilot'} · Level ${state.user.level}</div>
          <div class="flex items-center gap-2 justify-center sm:justify-start mb-1">
            <div class="flex-1 max-w-xs h-2 bg-surface-elevated rounded-full overflow-hidden">
              <div class="h-full bg-accent-secondary rounded-full transition-all duration-700" style="width:${xpPct}%"></div>
            </div>
            <span class="text-xs text-text-muted">${state.user.xp.toLocaleString()} / ${hi.toLocaleString()} XP</span>
          </div>
        </div>
      </div>

      <!-- Stat cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        ${statCard('Total Return', `${gainPct >= 0 ? '+' : ''}${pct(gainPct, false)}`, gainPct >= 0 ? 'text-gain' : 'text-loss')}
        ${statCard('Total Trades', state.transactions.length, 'text-text-primary')}
        ${statCard('Badges', `${state.achievements.length} / ${BADGES.length}`, 'text-accent-secondary')}
        ${statCard('Current Level', state.user.level, 'text-accent-primary')}
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

        <!-- Recent badges -->
        <div class="bg-surface border border-border rounded-2xl p-5">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-semibold text-text-primary">Recent Badges</h2>
            <a href="#achievements" class="text-xs text-accent-primary hover:underline">View all →</a>
          </div>
          ${recentBadges.length
            ? `<div class="grid grid-cols-2 gap-3">
                ${recentBadges.map(b => `
                  <div class="flex items-center gap-2 bg-surface-elevated rounded-xl p-3">
                    <div class="w-8 h-8 rounded-lg bg-accent-secondary/20 border border-accent-secondary/50 flex items-center justify-center text-[10px] font-bold text-accent-secondary shrink-0">${b.icon}</div>
                    <div>
                      <div class="text-xs font-semibold text-text-primary">${b.name}</div>
                      <div class="text-[10px] text-text-muted">${b.desc.substring(0, 30)}…</div>
                    </div>
                  </div>
                `).join('')}
               </div>`
            : `<div class="text-sm text-text-muted">No badges yet — start trading!</div>`}
        </div>

        <!-- Recent transactions -->
        <div class="bg-surface border border-border rounded-2xl overflow-hidden">
          <div class="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 class="font-semibold text-text-primary">Recent Trades</h2>
            <a href="#history" class="text-xs text-accent-primary hover:underline">Full history →</a>
          </div>
          ${recentTxs.length
            ? `<div class="divide-y divide-border">
                ${recentTxs.map(tx => `
                  <div class="flex items-center gap-3 px-5 py-3">
                    <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                      ${tx.type === 'buy' ? 'bg-gain/10 text-gain' : 'bg-loss/10 text-loss'}">
                      ${tx.type === 'buy' ? '↑' : '↓'}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-sm font-medium text-text-primary">${tx.type === 'buy' ? 'Bought' : 'Sold'} ${tx.symbol}</div>
                      <div class="text-[10px] text-text-muted">${relativeTime(tx.ts)}</div>
                    </div>
                    <div class="text-sm tabular-nums font-medium ${tx.type === 'buy' ? 'text-loss' : 'text-gain'}">
                      ${tx.type === 'buy' ? '-' : '+'}${pc(tx.total)}
                    </div>
                  </div>
                `).join('')}
               </div>`
            : `<div class="px-5 py-8 text-center text-sm text-text-muted">No trades yet.</div>`}
        </div>

      </div>
    </div>
  `
}

function statCard(label, value, cls) {
  return `
    <div class="bg-surface border border-border rounded-2xl p-4 text-center">
      <div class="text-xs text-text-muted uppercase tracking-wide mb-1">${label}</div>
      <div class="text-2xl font-bold font-mono ${cls}">${value}</div>
    </div>
  `
}
