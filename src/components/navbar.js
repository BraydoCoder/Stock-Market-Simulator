import { getState, subscribe, xpProgress } from '../state/store.js'
import { pc } from '../utils/format.js'

const LEVEL_TITLES = [
  '', 'Rookie Pilot', 'Market Watcher', 'Trade Starter', 'Chart Reader',
  'Bull Believer', 'Risk Taker', 'Portfolio Builder', 'Swing Trader',
  'Value Hunter', 'Market Analyst', 'Sector Scout', 'Index Beater',
  'Alpha Seeker', 'Momentum Trader', 'Portfolio Pro', 'Smart Money',
  'Deep Value', 'Market Timer', 'Quant Trader', 'Hedge Fund Boss',
  'Market Maker', 'Wolf of StockPilot', 'Trading Legend', 'Warren Buffett Jr.',
  'Pilot Grandmaster',
]

export function initNavbar() {
  renderNavbar()
  subscribe(() => {
    const el = document.getElementById('nav-balance')
    if (el) el.textContent = pc(getState().user.balance)
    const xpEl = document.getElementById('nav-xp-bar')
    if (xpEl) xpEl.style.width = xpProgress().pct + '%'
  })
  window.addEventListener('hashchange', highlightActive)
}

function renderNavbar() {
  document.getElementById('navbar').innerHTML = `
    <nav class="fixed top-0 inset-x-0 z-[100] bg-surface/95 backdrop-blur-sm border-b border-border h-14 flex items-center">
      <div class="w-full max-w-7xl mx-auto px-4 flex items-center justify-between gap-4">

        <a href="#dashboard" class="font-display text-accent-primary font-bold text-base tracking-widest shrink-0 hover:opacity-80 transition-opacity">
          ✈ STOCKPILOT
        </a>

        <div class="flex items-center gap-0.5">
          ${link('#dashboard', 'Dashboard')}
          ${link('#stocks',    'Stocks')}
          ${link('#portfolio', 'Portfolio')}
          ${link('#leaderboard', 'Leaderboard')}
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <!-- Balance -->
          <div class="text-right hidden sm:block">
            <div class="text-[10px] text-text-muted uppercase tracking-wide leading-none mb-0.5">Balance</div>
            <div id="nav-balance" class="text-sm font-semibold text-accent-primary tabular-nums">
              ${pc(getState().user.balance)}
            </div>
          </div>

          <!-- Avatar + level -->
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-accent-secondary/20 border border-accent-secondary flex items-center justify-center text-xs font-bold text-accent-secondary">
              ${getState().user.displayName[0].toUpperCase()}
            </div>
            <div class="hidden md:block">
              <div class="text-xs font-medium text-text-primary leading-none">${getState().user.displayName}</div>
              <div class="text-[10px] text-text-muted leading-none mt-0.5">${LEVEL_TITLES[getState().user.level] ?? 'Pilot'}</div>
            </div>
          </div>
        </div>

      </div>
      <!-- XP bar -->
      <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-surface-elevated">
        <div id="nav-xp-bar" class="h-full bg-accent-secondary transition-all duration-700"
          style="width:${xpProgress().pct}%"></div>
      </div>
    </nav>
  `
  highlightActive()
}

function link(href, label) {
  return `<a href="${href}" data-nav="${href}"
    class="nav-link px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 text-text-secondary hover:text-text-primary hover:bg-surface-elevated">
    ${label}
  </a>`
}

function highlightActive() {
  const hash = window.location.hash || '#dashboard'
  document.querySelectorAll('[data-nav]').forEach(a => {
    const active = hash === a.dataset.nav || (hash === '' && a.dataset.nav === '#dashboard')
    a.classList.toggle('text-text-primary', active)
    a.classList.toggle('bg-surface-elevated', active)
    a.classList.toggle('text-text-secondary', !active)
  })
}
