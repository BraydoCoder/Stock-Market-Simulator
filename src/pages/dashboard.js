import { getState, subscribe, xpProgress, resetPortfolio } from '../state/store.js'
import { getAllPrices, portfolioValue } from '../api/prices.js'
import { pc, pct, gainClass, relativeTime } from '../utils/format.js'
import { openTradeModal } from '../components/tradeModal.js'
import { STOCKS } from '../data/stocks.js'

let unsub = null
let priceHandler = null

export function mountDashboard(container) {
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
}

function render(container) {
  const state = getState()
  const prices = getAllPrices()
  const portVal = portfolioValue(state.holdings)
  const totalValue = state.user.balance + portVal
  const gain = totalValue - 10000
  const { pct: xpPct, lo, hi } = xpProgress()

  const topMovers = [...prices.entries()]
    .sort((a, b) => Math.abs(b[1].changePct) - Math.abs(a[1].changePct))
    .slice(0, 5)

  const recentTxs = state.transactions.slice(0, 5)

  container.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 py-6 space-y-6">

      <!-- Greeting -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-display font-bold text-text-primary">
            Welcome back, ${state.user.displayName}
          </h1>
          <p class="text-text-muted text-sm mt-0.5">Here's your portfolio at a glance</p>
        </div>
        <div class="hidden sm:flex items-center gap-2">
          <span class="text-xs text-text-muted">Lvl ${state.user.level}</span>
          <div class="w-32 h-1.5 bg-surface-elevated rounded-full overflow-hidden">
            <div class="h-full bg-accent-secondary rounded-full transition-all duration-700" style="width:${xpPct}%"></div>
          </div>
          <span class="text-xs text-text-muted">${state.user.xp} XP</span>
        </div>
      </div>

      <!-- Stat cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        ${statCard('Total Value', pc(totalValue), gain, 'Portfolio net worth')}
        ${statCard('Cash Balance', pc(state.user.balance), null, 'Available to trade')}
        ${statCard('Invested', pc(portVal), null, 'Current market value')}
        ${statCard('Total P&L', pc(gain), gain, 'Since start')}
      </div>

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
            <div class="px-5 py-4 border-b border-border">
              <h2 class="font-semibold text-text-primary">Recent Activity</h2>
            </div>
            ${recentTxs.length
              ? `<div class="divide-y divide-border">${recentTxs.map(txRow).join('')}</div>`
              : `<div class="px-5 py-8 text-center text-sm text-text-muted">No trades yet — go buy something!</div>`}
          </div>

        </div>
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

      <!-- Reset (dev) -->
      <div class="flex justify-end">
        <button id="reset-btn" class="text-xs text-text-muted hover:text-loss transition-colors">
          Reset Portfolio
        </button>
      </div>

    </div>
  `

  container.querySelectorAll('.quick-trade-btn').forEach(btn => {
    btn.addEventListener('click', () => openTradeModal(btn.dataset.symbol))
  })

  container.querySelectorAll('[data-trade]').forEach(btn => {
    btn.addEventListener('click', () => openTradeModal(btn.dataset.trade))
  })

  container.getElementById?.('reset-btn') ?? container.querySelector('#reset-btn')
    ?.addEventListener('click', () => {
      if (confirm('Reset your portfolio to PC$10,000? This cannot be undone.')) {
        resetPortfolio()
      }
    })
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
          ${entries.map(([sym, h]) => {
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
