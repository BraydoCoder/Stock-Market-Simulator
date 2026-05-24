import { STOCKS, SECTORS } from '../data/stocks.js'
import { getPrice, fetchFinnhub } from '../api/prices.js'
import { getState } from '../state/store.js'
import { pc, pct, gainClass } from '../utils/format.js'
import { openTradeModal } from '../components/tradeModal.js'
import { FINNHUB_API_KEY } from '../config.js'

let filterSector = 'All'
let searchQuery = ''
let sortKey = 'symbol'
let sortDir = 1
let priceListener = null
let container = null

export function mountStockBrowser(el) {
  container = el
  render()

  priceListener = () => updatePriceRows()
  window.addEventListener('prices-updated', priceListener)
}

export function unmountStockBrowser() {
  if (priceListener) {
    window.removeEventListener('prices-updated', priceListener)
    priceListener = null
  }
  container = null
}

function filteredStocks() {
  return STOCKS
    .filter(s => {
      const matchSector = filterSector === 'All' || s.sector === filterSector
      const q = searchQuery.toLowerCase()
      const matchSearch = !q || s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
      return matchSector && matchSearch
    })
    .sort((a, b) => {
      let va, vb
      if (sortKey === 'symbol') { va = a.symbol; vb = b.symbol }
      else if (sortKey === 'name') { va = a.name; vb = b.name }
      else if (sortKey === 'price') { va = getPrice(a.symbol).price; vb = getPrice(b.symbol).price }
      else if (sortKey === 'change') { va = getPrice(a.symbol).changePct; vb = getPrice(b.symbol).changePct }
      else { va = a[sortKey] ?? 0; vb = b[sortKey] ?? 0 }
      if (va < vb) return -sortDir
      if (va > vb) return sortDir
      return 0
    })
}

function render() {
  if (!container) return
  const stocks = filteredStocks()
  const holdings = getState().holdings

  container.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 py-6 space-y-5">

      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 class="text-2xl font-display font-bold text-text-primary">Stock Browser</h1>
        ${FINNHUB_API_KEY
          ? `<div class="flex items-center gap-1.5 text-xs text-gain"><span class="w-1.5 h-1.5 rounded-full bg-gain animate-pulse"></span> Live Finnhub data</div>`
          : `<div class="flex items-center gap-1.5 text-xs text-text-muted"><span class="w-1.5 h-1.5 rounded-full bg-text-muted"></span> Simulated prices</div>`}
      </div>

      <!-- Filters -->
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="relative flex-1 max-w-xs">
          <input id="stock-search" type="text" placeholder="Search symbol or name…"
            value="${searchQuery}"
            class="w-full bg-surface border border-border rounded-xl px-4 py-2.5 pl-9 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary transition-colors" />
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">⌕</span>
        </div>

        <div class="flex gap-1.5 flex-wrap">
          ${SECTORS.map(s => `
            <button data-sector="${s}" class="sector-btn px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors
              ${filterSector === s
                ? 'bg-accent-primary text-bg border-accent-primary'
                : 'bg-surface border-border text-text-muted hover:text-text-primary hover:border-border'}">
              ${s}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Table -->
      <div class="bg-surface border border-border rounded-2xl overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-[10px] text-text-muted uppercase tracking-wide border-b border-border">
                ${th('symbol', 'Symbol', 'text-left px-5 py-3')}
                ${th('name', 'Company', 'text-left px-3 py-3 hidden sm:table-cell')}
                <th class="text-left px-3 py-3 hidden md:table-cell">Sector</th>
                ${th('price', 'Price', 'text-right px-3 py-3')}
                ${th('change', 'Change', 'text-right px-5 py-3')}
                <th class="text-right px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody id="stock-table-body" class="divide-y divide-border">
              ${stocks.map(s => stockRow(s, holdings)).join('')}
            </tbody>
          </table>
        </div>
        ${stocks.length === 0
          ? `<div class="px-5 py-10 text-center text-sm text-text-muted">No stocks match your search.</div>`
          : ''}
        <div class="px-5 py-3 border-t border-border text-xs text-text-muted">
          ${stocks.length} of ${STOCKS.length} stocks
        </div>
      </div>

    </div>
  `

  bindEvents()
}

function th(key, label, cls) {
  const active = sortKey === key
  const arrow = active ? (sortDir === 1 ? ' ↑' : ' ↓') : ''
  return `<th class="${cls} cursor-pointer hover:text-text-primary select-none" data-sort="${key}">${label}${arrow}</th>`
}

function stockRow(s, holdings) {
  const p = getPrice(s.symbol)
  const owned = holdings[s.symbol]
  return `
    <tr class="hover:bg-surface-elevated/50 transition-colors" data-symbol="${s.symbol}">
      <td class="px-5 py-3.5">
        <div class="font-mono font-bold text-text-primary">${s.symbol}</div>
        ${owned ? `<div class="text-[10px] text-accent-secondary mt-0.5">Owned: ${owned.shares % 1 === 0 ? owned.shares : owned.shares.toFixed(4)}</div>` : ''}
      </td>
      <td class="px-3 py-3.5 text-text-secondary hidden sm:table-cell">${s.name}</td>
      <td class="px-3 py-3.5 hidden md:table-cell">
        <span class="text-[10px] px-2 py-0.5 rounded-full bg-surface-elevated border border-border text-text-muted">${s.sector}</span>
      </td>
      <td class="px-3 py-3.5 text-right">
        <span class="price-cell tabular-nums font-mono text-text-primary" data-sym="${s.symbol}">${pc(p.price)}</span>
      </td>
      <td class="px-5 py-3.5 text-right">
        <span class="change-cell tabular-nums text-xs ${gainClass(p.changePct)}" data-sym="${s.symbol}">
          ${pct(p.changePct)}
        </span>
      </td>
      <td class="px-5 py-3.5 text-right">
        <button data-symbol="${s.symbol}" class="trade-btn px-3 py-1.5 rounded-lg bg-accent-primary/10 border border-accent-primary/30 text-accent-primary text-xs font-semibold hover:bg-accent-primary hover:text-bg transition-colors">
          Trade
        </button>
      </td>
    </tr>
  `
}

function updatePriceRows() {
  if (!container) return
  container.querySelectorAll('.price-cell').forEach(el => {
    const sym = el.dataset.sym
    const p = getPrice(sym)
    const prev = parseFloat(el.dataset.prev ?? p.price)
    el.dataset.prev = p.price
    el.textContent = pc(p.price)
    el.classList.remove('flash-green', 'flash-red')
    void el.offsetWidth
    el.classList.add(p.price >= prev ? 'flash-green' : 'flash-red')
  })
  container.querySelectorAll('.change-cell').forEach(el => {
    const sym = el.dataset.sym
    const p = getPrice(sym)
    el.textContent = pct(p.changePct)
    el.className = `change-cell tabular-nums text-xs ${gainClass(p.changePct)}`
    el.dataset.sym = sym
  })
}

function bindEvents() {
  const search = container.querySelector('#stock-search')
  search?.addEventListener('input', () => {
    searchQuery = search.value
    render()
  })

  container.querySelectorAll('.sector-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      filterSector = btn.dataset.sector
      render()
    })
  })

  container.querySelectorAll('[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort
      if (sortKey === key) sortDir *= -1
      else { sortKey = key; sortDir = 1 }
      render()
    })
  })

  container.querySelectorAll('.trade-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sym = btn.dataset.symbol
      if (FINNHUB_API_KEY) fetchFinnhub(sym)
      openTradeModal(sym)
    })
  })
}
