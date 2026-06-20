// history.js — full transaction history with search + filter
import { getState, subscribe } from '../state/store.js'
import { pc, gainClass } from '../utils/format.js'

let container = null
let unsub = null
let filterType = 'all'   // 'all' | 'buy' | 'sell' | 'dividend'
let searchQuery = ''
let sortDir = -1          // -1 = newest first

export function mountHistory(el) {
  container = el
  unsub = subscribe(() => render())
  render()
}

export function unmountHistory() {
  if (unsub) { unsub(); unsub = null }
  container = null
}

function filteredTxns() {
  const txns = [...(getState().transactions ?? [])]
  return txns
    .filter(t => {
      if (filterType !== 'all' && t.type !== filterType) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return t.symbol?.toLowerCase().includes(q)
      }
      return true
    })
    .sort((a, b) => sortDir * (a.ts - b.ts))
}

function render() {
  if (!container) return
  const txns = filteredTxns()
  const all  = getState().transactions ?? []

  const totalBuys  = all.filter(t => t.type === 'buy').length
  const totalSells = all.filter(t => t.type === 'sell').length
  const totalFees  = all.reduce((s, t) => s + (t.fee ?? 0), 0)

  container.innerHTML = `
    <div class="max-w-5xl mx-auto px-4 py-6 space-y-5">

      <h1 class="text-2xl font-display font-bold text-text-primary">Transaction History</h1>

      <!-- Summary strip -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        ${summaryTile('Total Trades', all.length)}
        ${summaryTile('Buys', totalBuys)}
        ${summaryTile('Sells', totalSells)}
        ${summaryTile('Total Fees', pc(totalFees), 'text-loss')}
      </div>

      <!-- Filters -->
      <div class="flex flex-col sm:flex-row gap-3">
        <input id="hist-search" type="text" placeholder="Filter by symbol…" value="${searchQuery}"
          class="flex-1 max-w-xs bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary transition-colors" />

        <div class="flex gap-1 bg-surface-elevated rounded-lg p-1 self-start">
          ${[['all','All'],['buy','Buys'],['sell','Sells'],['dividend','💰 Divs']].map(([v,l]) => `
            <button data-filter="${v}" class="filter-btn px-3 py-1.5 rounded-md text-xs font-medium transition-colors
              ${filterType === v ? 'bg-surface text-text-primary shadow' : 'text-text-muted hover:text-text-primary'}">
              ${l}
            </button>
          `).join('')}
        </div>

        <button id="sort-toggle" class="text-xs text-text-muted hover:text-text-primary transition-colors self-center">
          ${sortDir === -1 ? 'Newest first' : 'Oldest first'} ↕
        </button>
      </div>

      <!-- Table -->
      ${txns.length === 0
        ? `<div class="bg-surface border border-border rounded-2xl p-12 text-center text-sm text-text-muted">
            ${all.length === 0 ? 'No trades yet. Head to the Stocks page to make your first trade.' : 'No transactions match your filter.'}
           </div>`
        : `<div class="bg-surface border border-border rounded-2xl overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-[10px] text-text-muted uppercase tracking-wide border-b border-border">
                    <th class="text-left px-5 py-3">Date / Time</th>
                    <th class="text-left px-3 py-3">Symbol</th>
                    <th class="text-left px-3 py-3 hidden sm:table-cell">Type</th>
                    <th class="text-right px-3 py-3">Shares</th>
                    <th class="text-right px-3 py-3">Price</th>
                    <th class="text-right px-3 py-3 hidden md:table-cell">Fee</th>
                    <th class="text-right px-5 py-3">Total</th>
                    <th class="text-right px-5 py-3 hidden md:table-cell">Realized P&L</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border">
                  ${txns.map(txnRow).join('')}
                </tbody>
              </table>
            </div>
           </div>
           <div class="text-xs text-text-muted">${txns.length} of ${all.length} transactions shown</div>`}

    </div>
  `

  bindEvents()
}

function txnRow(t) {
  const date = new Date(t.ts)
  const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const isDividend = t.type === 'dividend'
  const isBuy = t.type === 'buy'
  const pl = t.realizedGain ?? null
  const sharesStr = (t.qty ?? t.shares ?? 0) % 1 === 0
    ? String(t.qty ?? t.shares ?? 0)
    : (t.qty ?? t.shares ?? 0).toFixed(4)

  if (isDividend) {
    return `
      <tr class="hover:bg-surface-elevated/50 transition-colors">
        <td class="px-5 py-3 text-text-muted text-xs whitespace-nowrap">
          <div>${dateStr}</div>
          <div class="text-[10px]">${timeStr}</div>
        </td>
        <td class="px-3 py-3">
          <a href="#stock-${t.symbol}" class="font-mono font-bold text-text-primary hover:text-accent-primary transition-colors">${t.symbol}</a>
        </td>
        <td class="px-3 py-3 hidden sm:table-cell">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent-secondary/10 text-accent-secondary">
            💰 DIV
          </span>
        </td>
        <td class="px-3 py-3 text-right font-mono text-text-muted tabular-nums">—</td>
        <td class="px-3 py-3 text-right font-mono text-text-secondary tabular-nums">${pc(t.price ?? 0)}</td>
        <td class="px-3 py-3 text-right text-[10px] text-text-muted tabular-nums hidden md:table-cell">—</td>
        <td class="px-5 py-3 text-right font-mono font-bold tabular-nums text-gain">+${pc(t.amount ?? 0)}</td>
        <td class="px-5 py-3 text-right text-xs tabular-nums hidden md:table-cell text-text-muted">—</td>
      </tr>
    `
  }

  return `
    <tr class="hover:bg-surface-elevated/50 transition-colors">
      <td class="px-5 py-3 text-text-muted text-xs whitespace-nowrap">
        <div>${dateStr}</div>
        <div class="text-[10px]">${timeStr}</div>
      </td>
      <td class="px-3 py-3">
        <a href="#stock-${t.symbol}" class="font-mono font-bold text-text-primary hover:text-accent-primary transition-colors">${t.symbol}</a>
        ${t.orderType && t.orderType !== 'market' ? `<div class="text-[10px] text-text-muted capitalize">${t.orderType}</div>` : ''}
      </td>
      <td class="px-3 py-3 hidden sm:table-cell">
        <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold
          ${isBuy ? 'bg-gain/10 text-gain' : 'bg-loss/10 text-loss'}">
          ${isBuy ? 'BUY' : 'SELL'}
        </span>
      </td>
      <td class="px-3 py-3 text-right font-mono text-text-primary tabular-nums">${sharesStr}</td>
      <td class="px-3 py-3 text-right font-mono text-text-secondary tabular-nums">${pc(t.price ?? 0)}</td>
      <td class="px-3 py-3 text-right text-[10px] text-loss tabular-nums hidden md:table-cell">${t.fee ? pc(t.fee) : '—'}</td>
      <td class="px-5 py-3 text-right font-mono font-bold tabular-nums ${isBuy ? 'text-loss' : 'text-gain'}">
        ${isBuy ? '-' : '+'}${pc(t.total ?? 0)}
      </td>
      <td class="px-5 py-3 text-right text-xs tabular-nums hidden md:table-cell ${pl != null ? gainClass(pl) : 'text-text-muted'}">
        ${pl != null ? `${pl >= 0 ? '+' : ''}${pc(pl)}` : '—'}
      </td>
    </tr>
  `
}

function summaryTile(label, value, cls = '') {
  return `
    <div class="bg-surface border border-border rounded-xl p-4">
      <div class="text-[10px] text-text-muted uppercase tracking-wide mb-1">${label}</div>
      <div class="text-lg font-bold font-mono ${cls || 'text-text-primary'}">${value}</div>
    </div>
  `
}

function bindEvents() {
  const search = container.querySelector('#hist-search')
  let debounce = null
  search?.addEventListener('input', () => {
    clearTimeout(debounce)
    debounce = setTimeout(() => { searchQuery = search.value; render() }, 300)
  })

  container.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => { filterType = btn.dataset.filter; render() })
  })

  container.querySelector('#sort-toggle')?.addEventListener('click', () => {
    sortDir *= -1
    render()
  })
}
