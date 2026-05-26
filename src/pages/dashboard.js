// dashboard.js — home screen with portfolio summary, movers, achievements, quick trade
import { getState, subscribe, xpProgress } from '../state/store.js'
import { getAllPrices, portfolioValue } from '../api/prices.js'
import { pc, pct, gainClass, relativeTime } from '../utils/format.js'
import { openTradeModal } from '../components/tradeModal.js'
import { STOCKS } from '../data/stocks.js'
import { BADGES } from '../utils/achievements.js'
import { joinSession, leaveSession, getActiveSession, getActiveSessionId } from '../lib/session.js'
import { supabase } from '../lib/supabase.js'

let unsub = null
let priceHandler = null
let activeSession = null

export async function mountDashboard(container) {
  // Load active session info (non-blocking — renders immediately, refreshes after)
  activeSession = await getActiveSession()
  render(container)
  unsub = subscribe(() => render(container))
  priceHandler = () => render(container)
  window.addEventListener('prices-updated', priceHandler)
}

export function unmountDashboard() {
  if (unsub) { unsub(); unsub = null }
  if (priceHandler) {
    window.removeEventListener('prices-updated', priceHandler)
    priceHandler = null
  }
  activeSession = null
}

function render(container) {
  const state = getState()
  const prices = getAllPrices()
  const portVal = portfolioValue(state.holdings)
  const totalValue = state.user.balance + portVal
  const gain = totalValue - 10000
  const gainPct = (gain / 10000) * 100
  const { pct: xpPct, hi } = xpProgress()

  const topMovers = [...prices.entries()]
    .sort((a, b) => Math.abs(b[1].changePct) - Math.abs(a[1].changePct))
    .slice(0, 6)

  const recentTxs = state.transactions.slice(0, 5)

  const recentBadges = BADGES
    .filter(b => state.achievements.includes(b.id))
    .slice(-4).reverse()

  container.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 py-6 space-y-6">

      <!-- Greeting -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-display font-bold text-text-primary">
            Welcome back, ${state.user.displayName}
          </h1>
          <p class="text-text-muted text-sm mt-0.5">${BADGES.filter(b => state.achievements.includes(b.id)).length} badges · Level ${state.user.level}</p>
        </div>
        <div class="hidden sm:flex items-center gap-2">
          <span class="text-xs text-text-muted">${state.user.xp.toLocaleString()} XP</span>
          <div class="w-32 h-1.5 bg-surface-elevated rounded-full overflow-hidden">
            <div class="h-full bg-accent-secondary rounded-full transition-all duration-700" style="width:${xpPct}%"></div>
          </div>
          <span class="text-xs text-text-muted">${hi.toLocaleString()}</span>
        </div>
      </div>

      <!-- Stat cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        ${statCard('Total Value', pc(totalValue), gain, 'Portfolio net worth')}
        ${statCard('Cash Balance', pc(state.user.balance), null, 'Available to trade')}
        ${statCard('Invested', pc(portVal), null, 'Current market value')}
        ${statCard(`P&L (${pct(gainPct, false)})`, `${gain >= 0 ? '+' : ''}${pc(gain)}`, gain, 'Since start')}
      </div>

      <!-- Class session widget -->
      ${sessionWidget()}

      <!-- Main grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- Holdings -->
        <div class="lg:col-span-2 bg-surface border border-border rounded-2xl overflow-hidden">
          <div class="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 class="font-semibold text-text-primary">Your Holdings</h2>
            <a href="#portfolio" class="text-xs text-accent-primary hover:underline">View all →</a>
          </div>
          ${holdingsTable(state.holdings, prices)}
        </div>

        <!-- Sidebar -->
        <div class="space-y-4">

          <!-- Top movers -->
          <div class="bg-surface border border-border rounded-2xl overflow-hidden">
            <div class="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 class="font-semibold text-text-primary">Top Movers</h2>
              <a href="#stocks" class="text-xs text-accent-primary hover:underline">Trade →</a>
            </div>
            <div class="divide-y divide-border">
              ${topMovers.map(([sym, p]) => moverRow(sym, p)).join('')}
            </div>
          </div>

          <!-- Recent activity -->
          <div class="bg-surface border border-border rounded-2xl overflow-hidden">
            <div class="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 class="font-semibold text-text-primary">Recent Activity</h2>
              <a href="#portfolio" class="text-xs text-accent-primary hover:underline">History →</a>
            </div>
            ${recentTxs.length
              ? `<div class="divide-y divide-border">${recentTxs.map(txRow).join('')}</div>`
              : `<div class="px-5 py-8 text-center text-sm text-text-muted">No trades yet — go buy something!</div>`}
          </div>

        </div>
      </div>

      <!-- Achievements widget -->
      <div class="bg-surface border border-border rounded-2xl overflow-hidden">
        <div class="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 class="font-semibold text-text-primary">Achievements</h2>
            <div class="text-xs text-text-muted mt-0.5">${state.achievements.length} / ${BADGES.length} badges unlocked</div>
          </div>
          <a href="#achievements" class="text-xs text-accent-primary hover:underline">View all →</a>
        </div>
        ${recentBadges.length
          ? `<div class="flex gap-3 px-5 py-4 flex-wrap">
              ${recentBadges.map(b => `
                <div class="flex items-center gap-2 bg-surface-elevated rounded-xl px-3 py-2 border border-accent-secondary/30">
                  <span class="text-xl">${b.icon}</span>
                  <div>
                    <div class="text-xs font-semibold text-text-primary">${b.name}</div>
                    <div class="text-[10px] text-accent-secondary">Unlocked</div>
                  </div>
                </div>
              `).join('')}
             </div>`
          : `<div class="px-5 py-6 text-sm text-text-muted">Make your first trade to earn badges!</div>`}
      </div>

      <!-- Quick trade -->
      <div class="bg-surface border border-border rounded-2xl p-5">
        <h2 class="font-semibold text-text-primary mb-4">Quick Trade</h2>
        <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          ${STOCKS.slice(0, 8).map(s => {
            const p = prices.get(s.symbol) ?? { price: 0, changePct: 0 }
            return `
              <button data-symbol="${s.symbol}" class="quick-trade-btn flex flex-col items-center p-3 bg-surface-elevated border border-border rounded-xl hover:border-accent-primary transition-colors group">
                <div class="font-mono text-xs font-bold text-text-primary group-hover:text-accent-primary">${s.symbol}</div>
                <div class="text-[10px] text-text-muted mt-0.5">${pc(p.price)}</div>
                <div class="text-[10px] ${gainClass(p.changePct)} mt-0.5">${pct(p.changePct)}</div>
              </button>
            `
          }).join('')}
        </div>
      </div>

    </div>
  `

  container.querySelectorAll('.quick-trade-btn').forEach(btn => {
    btn.addEventListener('click', () => openTradeModal(btn.dataset.symbol))
  })

  container.querySelectorAll('[data-trade]').forEach(btn => {
    btn.addEventListener('click', () => openTradeModal(btn.dataset.trade))
  })

  container.querySelector('#reset-btn')?.addEventListener('click', () => {
    if (confirm('Reset your portfolio to PC$10,000? This cannot be undone.')) {
      const { resetPortfolio } = window.__store__ ?? {}
      if (resetPortfolio) resetPortfolio()
    }
  })

  // Session join
  const joinBtn  = container.querySelector('#join-session-btn')
  const joinErr  = container.querySelector('#join-error')
  const codeInput = container.querySelector('#join-code-input')

  codeInput?.addEventListener('input', () => {
    codeInput.value = codeInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
  })

  joinBtn?.addEventListener('click', async () => {
    const code = codeInput?.value.trim()
    if (!code || code.length < 6) {
      joinErr.textContent = 'Enter a 6-character code'
      joinErr.classList.remove('hidden')
      return
    }
    joinBtn.disabled = true
    joinBtn.textContent = 'Joining…'
    joinErr.classList.add('hidden')
    try {
      const { session } = await joinSession(code)
      activeSession = session
      window.dispatchEvent(new Event('session-joined'))
      render(container)
    } catch (err) {
      joinErr.textContent = err.message
      joinErr.classList.remove('hidden')
      joinBtn.disabled = false
      joinBtn.textContent = 'Join'
    }
  })

  // Session leave
  container.querySelector('#leave-session-btn')?.addEventListener('click', () => {
    if (!confirm('Leave this class session? You can rejoin with the same code.')) return
    leaveSession()
    activeSession = null
    render(container)
  })
}

function sessionWidget() {
  // Only show when Supabase is configured
  if (!supabase) return ''

  if (activeSession) {
    const statusColor = activeSession.status === 'active' ? 'text-gain' : 'text-warning'
    const dot = activeSession.status === 'active'
      ? 'bg-gain animate-pulse' : 'bg-warning'
    return `
      <div class="bg-surface border border-accent-primary/30 rounded-2xl p-4 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-accent-primary/10 border border-accent-primary/30 flex items-center justify-center text-lg">🎓</div>
          <div>
            <div class="text-sm font-semibold text-text-primary">${activeSession.name}</div>
            <div class="flex items-center gap-1.5 mt-0.5">
              <span class="w-1.5 h-1.5 rounded-full ${dot}"></span>
              <span class="text-xs ${statusColor} capitalize">${activeSession.status}</span>
              <span class="text-xs text-text-muted">· Code: <span class="font-mono font-bold text-text-secondary">${activeSession.join_code}</span></span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <a href="#leaderboard" class="px-3 py-1.5 rounded-lg bg-accent-primary/10 border border-accent-primary/30 text-accent-primary text-xs font-semibold hover:bg-accent-primary hover:text-bg transition-colors">
            Leaderboard
          </a>
          <button id="leave-session-btn" class="px-3 py-1.5 rounded-lg bg-surface-elevated border border-border text-text-muted text-xs hover:text-loss hover:border-loss/50 transition-colors">
            Leave
          </button>
        </div>
      </div>
    `
  }

  return `
    <div class="bg-surface border border-border rounded-2xl p-4">
      <div class="flex flex-col sm:flex-row sm:items-center gap-3">
        <div class="flex items-center gap-3 flex-1">
          <div class="w-9 h-9 rounded-xl bg-surface-elevated border border-border flex items-center justify-center text-lg">🎓</div>
          <div>
            <div class="text-sm font-semibold text-text-primary">Join a Class</div>
            <div class="text-xs text-text-muted">Enter your teacher's 6-digit join code</div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <input id="join-code-input" type="text" maxlength="6" placeholder="ABC123"
            class="w-28 bg-bg border border-border rounded-lg px-3 py-2 text-sm font-mono font-bold text-text-primary placeholder-text-muted text-center uppercase focus:outline-none focus:border-accent-primary transition-colors tracking-widest" />
          <button id="join-session-btn"
            class="px-4 py-2 rounded-lg bg-accent-primary text-bg text-sm font-semibold hover:bg-accent-primary/90 transition-colors">
            Join
          </button>
        </div>
      </div>
      <div id="join-error" class="hidden mt-2 text-xs text-loss"></div>
    </div>
  `
}

function statCard(label, value, gain, sub) {
  const dir = gain === null ? '' : gainClass(gain)
  return `
    <div class="bg-surface border border-border rounded-2xl p-4">
      <div class="text-xs text-text-muted uppercase tracking-wide mb-1">${label}</div>
      <div class="text-xl font-bold font-mono ${dir || 'text-text-primary'}">${value}</div>
      ${sub ? `<div class="text-[10px] text-text-muted mt-0.5">${sub}</div>` : ''}
    </div>
  `
}

function holdingsTable(holdings, prices) {
  const entries = Object.entries(holdings)
  if (!entries.length) {
    return `<div class="px-5 py-10 text-center text-sm text-text-muted">
      No holdings yet. <a href="#stocks" class="text-accent-primary hover:underline">Browse stocks</a> to get started.
    </div>`
  }
  return `
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-[10px] text-text-muted uppercase tracking-wide border-b border-border">
            <th class="text-left px-5 py-2.5">Symbol</th>
            <th class="text-right px-3 py-2.5">Shares</th>
            <th class="text-right px-3 py-2.5">Price</th>
            <th class="text-right px-3 py-2.5">Value</th>
            <th class="text-right px-5 py-2.5">P&L</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          ${entries.slice(0, 6).map(([sym, h]) => {
            const p = prices.get(sym) ?? { price: 0, changePct: 0 }
            const val = h.shares * p.price
            const pl = (p.price - h.avgCost) * h.shares
            const plPct = h.avgCost > 0 ? ((p.price - h.avgCost) / h.avgCost * 100) : 0
            return `
              <tr class="hover:bg-surface-elevated/50 transition-colors cursor-pointer" data-trade="${sym}">
                <td class="px-5 py-3">
                  <div class="font-mono font-semibold text-text-primary">${sym}</div>
                  <div class="text-[10px] text-text-muted">${pc(h.avgCost)} avg</div>
                </td>
                <td class="px-3 py-3 text-right text-text-secondary tabular-nums">${h.shares % 1 === 0 ? h.shares : h.shares.toFixed(4)}</td>
                <td class="px-3 py-3 text-right tabular-nums text-text-secondary">${pc(p.price)}</td>
                <td class="px-3 py-3 text-right tabular-nums text-text-primary font-medium">${pc(val)}</td>
                <td class="px-5 py-3 text-right tabular-nums ${gainClass(pl)}">
                  <div>${pl >= 0 ? '+' : ''}${pc(pl)}</div>
                  <div class="text-[10px] opacity-70">${pct(plPct)}</div>
                </td>
              </tr>
            `
          }).join('')}
        </tbody>
      </table>
    </div>
  `
}

function moverRow(sym, p) {
  return `
    <div class="flex items-center justify-between px-5 py-3 hover:bg-surface-elevated transition-colors cursor-pointer" data-trade="${sym}">
      <span class="font-mono text-sm font-semibold text-text-primary">${sym}</span>
      <div class="text-right">
        <div class="text-xs tabular-nums text-text-secondary">${pc(p.price)}</div>
        <div class="text-[10px] ${gainClass(p.changePct)} tabular-nums">${pct(p.changePct)}</div>
      </div>
    </div>
  `
}

function txRow(tx) {
  const isBuy = tx.type === 'buy'
  return `
    <div class="flex items-center gap-3 px-5 py-3">
      <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
        ${isBuy ? 'bg-gain/10 text-gain' : 'bg-loss/10 text-loss'}">
        ${isBuy ? '↑' : '↓'}
      </div>
      <div class="flex-1 min-w-0">
        <div class="text-sm font-medium text-text-primary">${isBuy ? 'Bought' : 'Sold'} ${tx.symbol}</div>
        <div class="text-[10px] text-text-muted">${relativeTime(tx.ts)}</div>
      </div>
      <div class="text-sm tabular-nums ${isBuy ? 'text-loss' : 'text-gain'} font-medium">
        ${isBuy ? '-' : '+'}${pc(tx.total)}
      </div>
    </div>
  `
}
