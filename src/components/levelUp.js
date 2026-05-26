// levelUp.js — full-screen level-up celebration card (PRD animation spec)
import { getState, xpProgress } from '../state/store.js'

const LEVEL_TITLES = [
  '', 'Rookie Pilot', 'Market Watcher', 'Trade Starter', 'Chart Reader',
  'Bull Believer', 'Risk Taker', 'Portfolio Builder', 'Swing Trader',
  'Value Hunter', 'Market Analyst', 'Sector Scout', 'Index Beater',
  'Alpha Seeker', 'Momentum Trader', 'Portfolio Pro', 'Smart Money',
  'Deep Value', 'Market Timer', 'Quant Trader', 'Hedge Fund Boss',
  'Market Maker', 'Wolf of StockPilot', 'Trading Legend', 'Warren Buffett Jr.',
  'Pilot Grandmaster',
]

export function showLevelUp(level) {
  const title = LEVEL_TITLES[level] ?? 'Pilot'
  const { pct } = xpProgress()

  const el = document.createElement('div')
  el.id = 'level-up-overlay'
  el.className = 'fixed inset-0 z-[300] flex items-center justify-center opacity-0 transition-opacity duration-300'
  el.style.background = 'rgba(0,0,0,0.85)'
  el.innerHTML = `
    <div id="level-up-card"
      class="relative bg-surface border border-accent-secondary/50 rounded-3xl p-10 text-center max-w-sm w-full mx-4 shadow-2xl"
      style="transform:scale(0.8); transition: transform 400ms cubic-bezier(0.34,1.56,0.64,1)">

      <!-- Stars -->
      <div id="stars" class="text-4xl mb-4 flex justify-center gap-3" style="animation: pulse-stars 1.2s ease-in-out infinite">
        ⭐ ⭐ ⭐
      </div>

      <div class="text-xs font-mono text-accent-secondary uppercase tracking-widest mb-2">Level Up!</div>
      <div class="text-7xl font-display font-bold text-accent-primary mb-2">${level}</div>
      <div class="text-xl font-semibold text-text-primary mb-1">${title}</div>
      <div class="text-sm text-text-muted mb-6">You've reached a new investor level!</div>

      <!-- XP bar animation -->
      <div class="h-2 bg-surface-elevated rounded-full overflow-hidden mb-6">
        <div id="lu-xp-bar" class="h-full bg-accent-secondary rounded-full transition-all duration-700" style="width:0%"></div>
      </div>

      <button id="level-up-dismiss"
        class="px-8 py-3 rounded-xl bg-accent-primary text-bg font-bold hover:bg-accent-primary/90 transition-colors">
        Keep Trading
      </button>
    </div>
  `

  document.body.appendChild(el)

  // Backdrop fade-in
  requestAnimationFrame(() => {
    el.classList.remove('opacity-0')
    el.classList.add('opacity-100')
    const card = document.getElementById('level-up-card')
    if (card) card.style.transform = 'scale(1)'
  })

  // XP bar fills after card animation completes
  setTimeout(() => {
    const bar = document.getElementById('lu-xp-bar')
    if (bar) bar.style.width = pct + '%'
  }, 700)

  document.getElementById('level-up-dismiss')?.addEventListener('click', () => {
    el.classList.remove('opacity-100')
    el.classList.add('opacity-0')
    setTimeout(() => el.remove(), 300)
  })
}
