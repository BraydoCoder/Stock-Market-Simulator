import { getState, resetPortfolio } from '../state/store.js'
import { getAllPrices, portfolioValue } from '../api/prices.js'
import { getStock } from '../data/stocks.js'
import { pc, pct, gainClass, relativeTime } from '../utils/format.js'
import { openTradeModal } from '../components/tradeModal.js'

let container = null
let priceListener = null
let txFilter = 'all'
let sortHolding = 'value'

export function mountPortfolio(el) {
  container = el

  render()

  priceListener = () => render()
  window.addEventListener('prices-updated', priceListener)
}

export function unmountPortfolio() {
  if (priceListener) {
    window.removeEventListener('prices-updated', priceListener)
    priceListener = null
  }
  container = null
}

function render() {
  if (!container) return
  const state = getState()
  const prices = getAllPrices()
  const portVal = portfolioValue(state.holdings)
  const totalVal = state.user.balance + portVal
  const totalGain = totalVal - 10000
  const gainPct = (totalGain / 10000) * 100

  const holdings = Object.entries(state.holdings)
    .map(([sym, h]) => {
      const p = prices.get(sym) ?? { price: 0, changePct: 0 }
      const value = h.shares * p.price
      const pl = (p.price - h.avgCost) * h.shares
      const plPct = h.avgCost > 0 ? ((p.price - h.avgCost) / h.avgCost * 100) : 0
      return { sym, h, p, value, pl, plPct }
    })
    .sort((a, b) => {
      if (sortHolding === 'value') return b.value - a.value
      if (sortHolding === 'pl') return b.pl - a.pl
      if (sortHolding === 'pct') return b.plPct - a.plPct
      return a.sym.localeCompare(b.sym)
    })

  const txs = state.transactions.filter(tx => txFilter === 'all' || tx.type === txFilter)

  const allocation = holdings.reduce((acc, { sym, value }) => {
    const sector = getStock(sym)?.sector ?? 'Other'
    acc[sector] = (acc[sector] ?? 0) + value
    return acc
  }, {})

  container.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 py-6 space-y-6">

      <h1 class="text-2xl font-display font-bold text-text-primary">Portfolio</h1>

      <!-- Summary cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        ${card('Total Value', pc(totalVal), gainClass(totalGain))}
        ${card('Cash', pc(state.user.balance), 'text-text-primary')}
        ${card('Invested', pc(portVal), 'text-text-primary')}
        ${card(`P&L ${pct(gainPct)}`, `${totalGain >= 0 ? '+' : ''}${pc(totalGain)}`, gainClass(totalGain))}
      </div>

      <!-- Holdings + allocation -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- Holdings table -->
        <div class="lg:col-span-2 bg-surface border border-border rounded-2xl overflow-hidden">
          <div class="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 class="font-semibold text-text-primary">Holdings</h2>
            <div class="flex gap-1">
              ${[['value','Value'],['pl','P&L'],['pct','%'],['sym','A-Z']].map(([k,l]) => `
                <button data-sort-h="${k}" class="sort-h-btn px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors
                  ${sortHolding === k ? 'bg-accent-primary text-bg border-accent-primary' : 'bg-surface border-border text-text-muted hover:text-text-primary'}">
                  ${l}
                </button>
              `).join('')}
            </div>
          </div>

          ${holdings.length === 0
            ? `<div class="px-5 py-12 text-center text-sm text-text-muted">
                No holdings yet. <a href="#stocks" class="text-accent-primary hover:underline">Start trading</a>.
               </div>`
            : `<div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="text-[10px] text-text-muted uppercase tracking-wide border-b border-border">
                      <th class="text-left px-5 py-2.5">Stock</th>
                      <th class="text-right px-3 py-2.5">Shares</th>
                      <th class="text-right px-3 py-2.5 hidden sm:table-cell">Avg Cost</th>
                      <th class="text-right px-3 py-2.5">Price</th>
                      <th class="text-right px-3 py-2.5">Value</th>
                      <th class="text-right px-5 py-2.5">P&L</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-border">
                    ${holdings.map(({ sym, h, p, value, pl, plPct }) => `
                      <tr class="hover:bg-surface-elevated/50 transition-colors cursor-pointer" data-trade="${sym}">
                        <td class="px-5 py-3.5">
                          <div class="font-mono font-bold text-text-primary">${sym}</div>
                          <div class="text-[10px] text-text-muted mt-0.5">${getStock(sym)?.name ?? ''}</div>
                        </td>
                        <td class="px-3 py-3.5 text-right tabular-nums text-text-secondary">
                          ${h.shares % 1 === 0 ? h.shares : h.shares.toFixed(4)}
                        </td>
                        <td class="px-3 py-3.5 text-right tabular-nums text-text-muted hidden sm:table-cell">${pc(h.avgCost)}</td>
                        <td class="px-3 py-3.5 text-right tabular-nums text-text-secondary">${pc(p.price)}</td>
                        <td class="px-3 py-3.5 text-right tabular-nums font-medium text-text-primary">${pc(value)}</td>
                        <td class="px-5 py-3.5 text-right tabular-nums ${gainClass(pl)}">
                          <div class="font-medium">${pl >= 0 ? '+' : ''}${pc(pl)}</div>
                          <div class="text-[10px] opacity-70">${pct(plPct)}</div>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
               </div>`}
        </div>

        <!-- Allocation + stats -->
        <div class="space-y-4">

          <!-- Sector allocation -->
          <div class="bg-surface border border-border rounded-2xl p-5">
            <h2 class="font-semibold text-text-primary mb-4">Sector Allocation</h2>
            ${portVal > 0
              ? Object.entries(allocation).map(([sector, val]) => {
                  const pctAlloc = (val / portVal * 100).toFixed(1)
                  return `
                    <div class="mb-3">
                      <div class="flex justify-between text-xs mb-1">
                        <span class="text-text-secondary">${sector}</span>
                        <span class="text-text-muted tabular-nums">${pctAlloc}%</span>
                      </div>
                      <div class="h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                        <div class="h-full bg-accent-primary rounded-full" style="width:${pctAlloc}%"></div>
                      </div>
                    </div>
                  `
                }).join('')
              : `<div class="text-sm text-text-muted">No holdings to allocate.</div>`}
          </div>

          <!-- Stats -->
          <div class="bg-surface border border-border rounded-2xl p-5 space-y-3">
            <h2 class="font-semibold text-text-primary">Stats</h2>
            ${stat('Total trades', state.transactions.length)}
            ${stat('Buys', state.transactions.filter(t => t.type === 'buy').length)}
            ${stat('Sells', state.transactions.filter(t => t.type === 'sell').length)}
            ${stat('Level', state.user.level)}
            ${stat('XP', state.user.xp.toLocaleString())}
          </div>

          <!-- Danger zone -->
          <div class="bg-surface border border-border rounded-2xl p-5">
            <h2 class="font-semibold text-loss mb-3 text-sm">Danger Zone</h2>
            <button id="reset-portfolio-btn" class="w-full py-2 rounded-lg border border-loss/40 text-loss text-xs font-medium hover:bg-loss/10 transition-colors">
              Reset Portfolio
            </button>
          </div>

        </div>
      </div>

      <!-- Transaction history -->
      <div class="bg-surface border border-border rounded-2xl overflow-hidden">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 border-b border-border gap-3">
          <h2 class="font-semibold text-text-primary">Transaction History</h2>
          <div class="flex gap-1">
            ${[['all','All'],['buy','Buys'],['sell','Sells']].map(([k,l]) => `
              <button data-tx-filter="${k}" class="tx-filter-btn px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors
                ${txFilter === k ? 'bg-accent-primary text-bg border-accent-primary' : 'bg-surface border-border text-text-muted hover:text-text-primary'}">
                ${l}
              </button>
            `).join('')}
          </div>
        </div>

        ${txs.length === 0
          ? `<div class="px-5 py-10 text-center text-sm text-text-muted">No transactions yet.</div>`
          : `<div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-[10px] text-text-muted uppercase tracking-wide border-b border-border">
                    <th class="text-left px-5 py-2.5">Type</th>
                    <th class="text-left px-3 py-2.5">Symbol</th>
                    <th class="text-right px-3 py-2.5">Shares</th>
                    <th class="text-right px-3 py-2.5">Price</th>
                    <th class="text-right px-3 py-2.5">Fee</th>
                    <th class="text-right px-5 py-2.5">Total</th>
                    <th class="text-right px-5 py-2.5 hidden sm:table-cell">Time</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border">
                  ${txs.map(tx => `
                    <tr class="hover:bg-surface-elevated/50 transition-colors">
                      <td class="px-5 py-3">
                        <span class="text-xs font-bold px-2 py-0.5 rounded-full
                          ${tx.type === 'buy' ? 'bg-gain/10 text-gain' : 'bg-loss/10 text-loss'}">
                          ${tx.type.toUpperCase()}
                        </span>
                      </td>
                      <td class="px-3 py-3 font-mono font-semibold text-text-primary">${tx.symbol}</td>
                      <td class="px-3 py-3 text-right tabular-nums text-text-secondary">
                        ${tx.qty % 1 === 0 ? tx.qty : tx.qty.toFixed(4)}
                      </td>
                      <td class="px-3 py-3 text-right tabular-nums text-text-secondary">${pc(tx.price)}</td>
                      <td class="px-3 py-3 text-right tabular-nums text-warning">${pc(tx.fee)}</td>
                      <td class="px-5 py-3 text-right tabular-nums font-medium
                        ${tx.type === 'buy' ? 'text-loss' : 'text-gain'}">
                        ${tx.type === 'buy' ? '-' : '+'}${pc(tx.total)}
                      </td>
                      <td class="px-5 py-3 text-right text-[10px] text-text-muted hidden sm:table-cell">
                        ${relativeTime(tx.ts)}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
             </div>`}
      </div>

    </div>
  `

  bindEvents()
}

function card(label, value, cls) {
  return `
    <div class="bg-surface border border-border rounded-2xl p-4">
      <div class="text-xs text-text-muted uppercase tracking-wide mb-1">${label}</div>
      <div class="text-xl font-bold font-mono ${cls}">${value}</div>
    </div>
  `
}

function stat(label, value) {
  return `
    <div class="flex justify-between text-sm">
      <span class="text-text-muted">${label}</span>
      <span class="text-text-secondary font-medium">${value}</span>
    </div>
  `
}

function bindEvents() {
  container.querySelectorAll('[data-trade]').forEach(row => {
    row.addEventListener('click', () => openTradeModal(row.dataset.trade))
  })

  container.querySelectorAll('.sort-h-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sortHolding = btn.dataset.sortH
      render()
    })
  })

  container.querySelectorAll('.tx-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      txFilter = btn.dataset.txFilter
      render()
    })
  })

  container.querySelector('#reset-portfolio-btn')?.addEventListener('click', () => {
    if (confirm('Reset your portfolio to PC$10,000? This cannot be undone.')) {
      resetPortfolio()
    }
  })
}
