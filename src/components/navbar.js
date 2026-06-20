import { getState, subscribe, xpProgress, markNotificationsRead, getUnreadCount } from '../state/store.js'
import { isMarketOpen } from '../api/prices.js'
import { pc, relativeTime } from '../utils/format.js'
import { t } from '../i18n/index.js'

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
    const badge = document.getElementById('notif-badge')
    if (badge) {
      const n = getUnreadCount()
      badge.textContent = n
      badge.classList.toggle('hidden', n === 0)
    }
  })
  window.addEventListener('hashchange', highlightActive)
}

export function renderNavbar() {
  const marketOpen = isMarketOpen()
  document.getElementById('navbar').innerHTML = `
    <nav class="fixed top-0 inset-x-0 z-[100] bg-surface/95 backdrop-blur-sm border-b border-border h-14 flex items-center">
      <div class="w-full max-w-7xl mx-auto px-4 flex items-center justify-between gap-4">

        <!-- Logo -->
        <a href="#dashboard" class="font-display text-accent-primary font-bold text-base tracking-widest shrink-0 hover:opacity-80 transition-opacity">
          STOCKPILOT
        </a>

        <!-- Nav links -->
        <div class="flex items-center gap-0.5 overflow-x-auto">
          ${link('#dashboard',    t('Dashboard'))}
          ${link('#stocks',       t('Stocks'))}
          ${link('#portfolio',    t('Portfolio'))}
          ${link('#history',      t('History'))}
          ${link('#quests', t('Quests'))}
          ${link('#leaderboard',  t('Leaderboard'))}
          ${link('#learn',        t('Learn'))}
          ${link('#simulation',   t('Time Warp'))}
        </div>

        <!-- Right side -->
        <div class="flex items-center gap-2 shrink-0">

          <!-- Market status -->
          <div class="hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border
            ${marketOpen ? 'bg-gain/10 border-gain/30 text-gain' : 'bg-surface-elevated border-border text-text-muted'}">
            <span class="w-1.5 h-1.5 rounded-full ${marketOpen ? 'bg-gain animate-pulse' : 'bg-text-muted'}"></span>
            ${marketOpen ? t('Open') : t('Closed')}
          </div>

          <!-- Balance -->
          <div class="text-right hidden md:block">
            <div class="text-[10px] text-text-muted uppercase tracking-wide leading-none mb-0.5">${t('Balance')}</div>
            <div id="nav-balance" class="text-sm font-semibold text-accent-primary tabular-nums">
              ${pc(getState().user.balance)}
            </div>
          </div>

          <!-- Audio mute toggle -->
          <button id="nav-audio-toggle" title="Toggle sound"
            class="w-8 h-8 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-text-muted hover:text-text-primary transition-colors text-[10px] font-bold">
            ${getState().settings.soundEnabled ? 'SFX' : 'MUT'}
          </button>

          <!-- Notification bell -->
          <div class="relative">
            <button id="nav-bell" title="Notifications"
              class="w-8 h-8 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-text-muted hover:text-text-primary transition-colors text-[10px] font-bold">
              NOT
            </button>
            <span id="notif-badge" class="absolute -top-1 -right-1 bg-loss text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center ${getUnreadCount() === 0 ? 'hidden' : ''}">
              ${getUnreadCount()}
            </span>
          </div>

          <!-- Avatar + dropdown trigger -->
          <div class="relative">
            <button id="nav-avatar" class="flex items-center gap-2 group">
              <div class="w-8 h-8 rounded-full bg-accent-secondary/20 border border-accent-secondary flex items-center justify-center text-xs font-bold text-accent-secondary">
                ${getState().user.displayName[0].toUpperCase()}
              </div>
              <div class="hidden md:block text-left">
                <div class="text-xs font-medium text-text-primary leading-none">${getState().user.displayName}</div>
                <div class="text-[10px] text-text-muted leading-none mt-0.5">${LEVEL_TITLES[getState().user.level] ?? 'Pilot'}</div>
              </div>
            </button>

            <!-- Dropdown -->
            <div id="nav-dropdown" class="hidden absolute right-0 top-10 w-44 bg-surface border border-border rounded-xl shadow-xl overflow-hidden z-50">
              <a href="#profile" class="flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors">
                ${t('Profile')}
              </a>
              <a href="#settings" class="flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors">
                ${t('Settings')}
              </a>
              <a href="#teacher" class="flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors border-t border-border">
                ${t('Teacher Panel')}
              </a>
              <a href="#help" class="flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors">
                ${t('Help / FAQ')}
              </a>
              <button id="nav-feedback" class="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors border-t border-border">
                Send Feedback
              </button>
              <button id="nav-signout" class="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-loss hover:bg-surface-elevated transition-colors border-t border-border">
                ${t('Sign Out')}
              </button>
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

    <!-- Notification dropdown (outside nav for stacking) -->
    <div id="notif-dropdown" class="hidden fixed top-14 right-4 w-80 bg-surface border border-border rounded-xl shadow-2xl z-[150] overflow-hidden">
      <div class="flex items-center justify-between px-4 py-3 border-b border-border">
        <span class="font-semibold text-sm text-text-primary">${t('Notifications')}</span>
        <button id="mark-read-btn" class="text-[10px] text-accent-primary hover:underline">${t('Mark all read')}</button>
      </div>
      <div id="notif-list" class="max-h-80 overflow-y-auto divide-y divide-border">
        ${notifItems()}
      </div>
    </div>
  `

  highlightActive()
  bindNavEvents()
}

function notifItems() {
  const ns = getState().notifications.slice(0, 10)
  if (!ns.length) return `<div class="px-4 py-6 text-center text-sm text-text-muted">${t('No notifications yet.')}</div>`
  return ns.map(n => `
    <div class="flex items-start gap-2 px-4 py-3 ${n.read ? 'opacity-60' : ''} hover:bg-surface-elevated transition-colors">
      <span class="text-base shrink-0">${notifIcon(n.type)}</span>
      <div class="flex-1 min-w-0">
        <div class="text-xs text-text-primary leading-snug">${n.message}</div>
        <div class="text-[10px] text-text-muted mt-0.5">${relativeTime(n.ts)}</div>
      </div>
      ${!n.read ? '<div class="w-1.5 h-1.5 rounded-full bg-accent-primary mt-1.5 shrink-0"></div>' : ''}
    </div>
  `).join('')
}

function notifIcon(type) {
  switch (type) {
    case 'achievement': return '★'
    case 'order':       return '↑'
    case 'alert':       return '!'
    default:            return '·'
  }
}

function bindNavEvents() {
  // Audio toggle
  document.getElementById('nav-audio-toggle')?.addEventListener('click', () => {
    const { updateSettings, getState: gs } = window.__store__ ?? {}
    if (!updateSettings) return
    const enabled = !gs().settings.soundEnabled
    updateSettings({ soundEnabled: enabled })
    const btn = document.getElementById('nav-audio-toggle')
    if (btn) btn.textContent = enabled ? 'SFX' : 'MUT'
  })

  // Bell dropdown
  const bell = document.getElementById('nav-bell')
  const notifDrop = document.getElementById('notif-dropdown')
  bell?.addEventListener('click', (e) => {
    e.stopPropagation()
    notifDrop?.classList.toggle('hidden')
    if (!notifDrop?.classList.contains('hidden')) {
      markNotificationsRead()
      document.getElementById('notif-list').innerHTML = notifItems()
    }
  })

  document.getElementById('mark-read-btn')?.addEventListener('click', () => {
    markNotificationsRead()
    document.getElementById('notif-list').innerHTML = notifItems()
  })

  // Avatar dropdown
  const avatar = document.getElementById('nav-avatar')
  const dropdown = document.getElementById('nav-dropdown')
  avatar?.addEventListener('click', (e) => {
    e.stopPropagation()
    dropdown?.classList.toggle('hidden')
    notifDrop?.classList.add('hidden')
  })

  // Feedback
  document.getElementById('nav-feedback')?.addEventListener('click', async () => {
    dropdown?.classList.add('hidden')
    const { openFeedbackModal } = await import('./feedbackModal.js')
    openFeedbackModal()
  })

  // Sign out
  document.getElementById('nav-signout')?.addEventListener('click', async () => {
    const { signOut } = await import('../utils/auth.js')
    await signOut()
    // onAuthStateChange in main.js handles redirecting to auth screen
  })

  // Close dropdowns on outside click
  document.addEventListener('click', () => {
    dropdown?.classList.add('hidden')
    notifDrop?.classList.add('hidden')
  })
}

function link(href, label) {
  return `<a href="${href}" data-nav="${href}"
    class="nav-link px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 text-text-secondary hover:text-text-primary hover:bg-surface-elevated whitespace-nowrap">
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
