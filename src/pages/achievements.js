// achievements.js — badges + XP level overview page
import { getState, xpProgress } from '../state/store.js'
import { BADGES } from '../utils/achievements.js'

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

export function mountAchievements(el, subscribeFn) {
  container = el
  unsub = subscribeFn(() => render())
  render()
}

export function unmountAchievements() {
  if (unsub) { unsub(); unsub = null }
  container = null
}

function render() {
  if (!container) return
  const state = getState()
  const { pct, lo, hi } = xpProgress()
  const unlocked = state.achievements
  const unlockedCount = unlocked.length
  const totalCount = BADGES.length

  container.innerHTML = `
    <div class="max-w-5xl mx-auto px-4 py-6 space-y-6">

      <h1 class="text-2xl font-display font-bold text-text-primary">Achievements</h1>

      <!-- Level card -->
      <div class="bg-surface border border-border rounded-2xl p-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="text-xs text-text-muted uppercase tracking-wide mb-1">Current Level</div>
            <div class="flex items-baseline gap-3">
              <span class="text-5xl font-display font-bold text-accent-primary">${state.user.level}</span>
              <span class="text-xl font-semibold text-text-primary">${LEVEL_TITLES[state.user.level] ?? 'Pilot'}</span>
            </div>
          </div>
          <div class="sm:w-64">
            <div class="flex justify-between text-xs text-text-muted mb-1.5">
              <span>${state.user.xp.toLocaleString()} XP</span>
              <span>${hi.toLocaleString()} XP to next level</span>
            </div>
            <div class="h-3 bg-surface-elevated rounded-full overflow-hidden">
              <div class="h-full bg-accent-secondary rounded-full transition-all duration-700" style="width:${pct}%"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Progress summary -->
      <div class="flex items-center justify-between">
        <div class="text-sm text-text-muted">
          <span class="text-text-primary font-semibold">${unlockedCount}</span> / ${totalCount} badges unlocked
        </div>
        <div class="h-1.5 flex-1 mx-4 bg-surface-elevated rounded-full overflow-hidden">
          <div class="h-full bg-accent-primary rounded-full transition-all duration-700"
            style="width:${Math.round(unlockedCount / totalCount * 100)}%"></div>
        </div>
        <div class="text-sm font-semibold text-accent-primary">${Math.round(unlockedCount / totalCount * 100)}%</div>
      </div>

      <!-- Standard badges -->
      <div>
        <h2 class="font-semibold text-text-primary mb-3">Standard Badges</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          ${BADGES.filter(b => !b.secret).map(b => badgeCard(b, unlocked.includes(b.id))).join('')}
        </div>
      </div>

      <!-- Secret badges -->
      <div>
        <h2 class="font-semibold text-text-primary mb-3">Secret Badges</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          ${BADGES.filter(b => b.secret).map(b => badgeCard(b, unlocked.includes(b.id), true)).join('')}
        </div>
      </div>

    </div>
  `
}

function badgeCard(badge, isUnlocked, secret = false) {
  const showSecret = secret && !isUnlocked

  return `
    <div class="bg-surface border ${isUnlocked ? 'border-accent-secondary/50' : 'border-border'} rounded-xl p-4 flex flex-col items-center text-center transition-colors
      ${isUnlocked ? 'shadow-[0_0_12px_rgba(99,102,241,0.15)]' : 'opacity-60'}">
      <div class="w-12 h-12 rounded-xl mb-2 flex items-center justify-center text-[10px] font-bold tracking-wide
        ${isUnlocked ? 'bg-accent-secondary/20 border border-accent-secondary/50 text-accent-secondary' : 'bg-surface-elevated border border-border text-text-muted'}">
        ${showSecret ? '???' : badge.icon}
      </div>
      <div class="text-xs font-semibold text-text-primary mb-1">${showSecret ? '???' : badge.name}</div>
      <div class="text-[10px] text-text-muted leading-tight">${showSecret ? 'Keep trading to discover this secret badge.' : badge.desc}</div>
      ${isUnlocked
        ? `<div class="mt-2 text-[10px] text-accent-secondary font-medium">✓ Unlocked</div>`
        : badge.xp > 0
          ? `<div class="mt-2 text-[10px] text-text-muted">+${badge.xp} XP</div>`
          : ''}
    </div>
  `
}
