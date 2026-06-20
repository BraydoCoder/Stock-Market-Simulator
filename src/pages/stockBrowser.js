// stockBrowser.js — 37 stocks with search, sector filter, sortable table, card view
import { STOCKS, SECTORS } from '../data/stocks.js'
import { getPrice, fetchFinnhub, isMarketOpen } from '../api/prices.js'
import { getState, toggleWatchlist, isWatchlisted } from '../state/store.js'
import { pc, pct, gainClass } from '../utils/format.js'
import { openTradeModal } from '../components/tradeModal.js'
import { FINNHUB_API_KEY } from '../config.js'

const PAGE_SIZE = 50

const SECTOR_COLORS = {
  'Technology':    'bg-blue-500/15 border-blue-500/40 text-blue-400',
  'Healthcare':    'bg-green-500/15 border-green-500/40 text-green-400',
  'Finance':       'bg-yellow-500/15 border-yellow-500/40 text-yellow-400',
  'Consumer':      'bg-orange-500/15 border-orange-500/40 text-orange-400',
  'Energy':        'bg-red-500/15 border-red-500/40 text-red-400',
  'Industrials':   'bg-gray-400/15 border-gray-400/40 text-gray-300',
  'Crypto':        'bg-purple-500/15 border-purple-500/40 text-purple-400',
  'Utilities':     'bg-cyan-500/15 border-cyan-500/40 text-cyan-400',
  'Real Estate':   'bg-pink-500/15 border-pink-500/40 text-pink-400',
  'Communication': 'bg-indigo-500/15 border-indigo-500/40 text-indigo-400',
}
function sectorBadge(sector) {
  const cls = SECTOR_COLORS[sector] ?? 'bg-surface-elevated border-border text-text-muted'
  return `<span class="text-[10px] font-medium px-2 py-0.5 rounded-full border ${cls}">${sector}</span>`
}

let filterSector = 'All'
let searchQuery = ''
let sortKey = 'symbol'
let sortDir = 1
let viewMode = 'table'   // 'table' | 'card'
let page = 0
let priceListener = null
let container = null
let searchDebounce = null

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
      if (sortKey === 'symbol')  { va = a.symbol; vb = b.symbol }
      else if (sortKey === 'name')   { va = a.name;   vb = b.name }
      else if (sortKey === 'price')  { va = getPrice(a.symbol).price;     vb = getPrice(b.symbol).price }
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
  const marketOpen = isMarketOpen()
  const totalPages = Math.max(1, Math.ceil(stocks.length / PAGE_SIZE))
  if (page >= totalPages) page = totalPages - 1
  const start = page * PAGE_SIZE
  const pagedStocks = stocks.slice(start, start + PAGE_SIZE)

  container.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 py-6 space-y-5">

      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 class="text-2xl font-display font-bold text-text-primary">Stock Browser</h1>
        <div class="flex items-center gap-3">
          <span class="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border
            ${marketOpen ? 'bg-gain/10 border-gain/30 text-gain' : 'bg-surface-elevated border-border text-text-muted'}">
            <span class="w-1.5 h-1.5 rounded-full ${marketOpen ? 'bg-gain animate-pulse' : 'bg-text-muted'}"></span>
            Market ${marketOpen ? 'Open' : 'Closed'}
          </span>
          ${FINNHUB_API_KEY
            ? `<span class="flex items-center gap-1 text-xs text-gain"><span class="w-1.5 h-1.5 rounded-full bg-gain animate-pulse"></span> Live data</span>`
            : `<span class="text-xs text-text-muted">Simulated prices</span>`}
        </div>
      </div>

      <!-- Filters row -->
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="relative flex-1 max-w-xs">
          <input id="stock-search" type="text" placeholder="Search symbol or name…"
            value="${searchQuery}"
            class="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary transition-colors" />
        </div>

        <!-- View toggle -->
        <div class="flex gap-1 bg-surface-elevated rounded-lg p-1 self-start">
          <button data-view="table" class="view-btn px-3 py-1.5 rounded-md text-xs font-medium transition-colors
            ${viewMode === 'table' ? 'bg-surface text-text-primary shadow' : 'text-text-muted hover:text-text-primary'}">
            Table
          </button>
          <button data-view="card" class="view-btn px-3 py-1.5 rounded-md text-xs font-medium transition-colors
            ${viewMode === 'card' ? 'bg-surface text-text-primary shadow' : 'text-text-muted hover:text-text-primary'}">
            Cards
          </button>
        </div>
      </div>

      <!-- Sector filter chips -->
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

      <!-- Stock list -->
      ${viewMode === 'table' ? tableView(pagedStocks, holdings) : cardView(pagedStocks, holdings)}

      <!-- Pagination -->
      <div class="flex items-center justify-between">
        <div class="text-xs text-text-muted">${start + 1}–${Math.min(start + PAGE_SIZE, stocks.length)} of ${stocks.length} stocks</div>
        <div class="flex gap-1">
          <button id="page-prev" ${page === 0 ? 'disabled' : ''}
            class="px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors
            ${page === 0 ? 'border-border text-text-muted opacity-40 cursor-default' : 'bg-surface-elevated border-border text-text-muted hover:text-text-primary'}">
            Prev
          </button>
          <span class="px-3 py-1.5 text-xs text-text-muted">Page ${page + 1} / ${totalPages}</span>
          <button id="page-next" ${page >= totalPages - 1 ? 'disabled' : ''}
            class="px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors
            ${page >= totalPages - 1 ? 'border-border text-text-muted opacity-40 cursor-default' : 'bg-surface-elevated border-border text-text-muted hover:text-text-primary'}">
            Next
          </button>
        </div>
      </div>
    </div>
  `

  bindEvents()
}

function tableView(stocks, holdings) {
  return `
    <div class="bg-surface border border-border rounded-2xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-[10px] text-text-muted uppercase tracking-wide border-b border-border">
              ${th('symbol', 'Symbol', 'text-left px-5 py-3')}
              ${th('name', 'Company', 'text-left px-3 py-3 hidden sm:table-cell')}
              <th class="text-left px-3 py-3 hidden md:table-cell">Sector</th>
              <th class="text-left px-3 py-3 hidden lg:table-cell">Risk</th>
              ${th('price', 'Price', 'text-right px-3 py-3')}
              ${th('change', 'Change', 'text-right px-3 py-3')}
              <th class="text-right px-3 py-3 hidden sm:table-cell">Watch</th>
              <th class="text-right px-5 py-3">Action</th>
            </tr>
          </thead>
          <tbody id="stock-table-body" class="divide-y divide-border">
            ${stocks.map(s => stockRow(s, holdings)).join('')}
          </tbody>
        </table>
      </div>
      ${stocks.length === 0 ? `<div class="px-5 py-10 text-center text-sm text-text-muted">No stocks match your search.</div>` : ''}
    </div>
  `
}

function cardView(stocks, holdings) {
  if (stocks.length === 0) {
    return `<div class="text-center py-10 text-sm text-text-muted">No stocks match your search.</div>`
  }
  return `
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      ${stocks.map(s => {
        const p = getPrice(s.symbol)
        const owned = holdings[s.symbol]
        const isUp = p.price >= p.prev
        return `
          <div class="bg-surface border border-border rounded-xl p-4 hover:border-accent-primary transition-colors cursor-pointer group"
            data-symbol="${s.symbol}">
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-2.5">
                ${logoImg(s, 'w-10 h-10')}
                <div>
                  <div class="font-mono font-bold text-base text-text-primary group-hover:text-accent-primary leading-none">${s.symbol}</div>
                  <div class="mt-1">${sectorBadge(s.sector)}</div>
                </div>
              </div>
              ${owned ? `<div class="text-[9px] text-accent-secondary font-bold bg-accent-secondary/10 px-1.5 py-0.5 rounded">Owned</div>` : ''}
            </div>
            <div class="text-[10px] text-text-muted truncate mb-2">${s.name}</div>
            <div class="text-lg font-bold font-mono price-cell text-text-primary tabular-nums" data-sym="${s.symbol}">${pc(p.price)}</div>
            <div class="flex items-center gap-1 mt-0.5">
              <span class="text-xs ${gainClass(p.changePct)} tabular-nums change-cell" data-sym="${s.symbol}">${pct(p.changePct)}</span>
            </div>
            <div class="flex gap-1.5 mt-3">
              <button data-symbol="${s.symbol}" class="trade-btn flex-1 py-1.5 rounded-lg bg-accent-primary/10 border border-accent-primary/30 text-accent-primary text-[10px] font-semibold hover:bg-accent-primary hover:text-bg transition-colors">
                Trade
              </button>
              <button data-watch="${s.symbol}" class="watch-btn py-1.5 px-2 rounded-lg border text-[10px] font-semibold transition-colors
                ${isWatchlisted(s.symbol)
                  ? 'bg-accent-primary/10 border-accent-primary/50 text-accent-primary'
                  : 'bg-surface-elevated border-border text-text-muted hover:border-accent-primary/40'}">
                ${isWatchlisted(s.symbol) ? 'Watching' : 'Watch'}
              </button>
            </div>
          </div>
        `
      }).join('')}
    </div>
  `
}

function th(key, label, cls) {
  const active = sortKey === key
  const arrow = active ? (sortDir === 1 ? ' ↑' : ' ↓') : ''
  return `<th class="${cls} cursor-pointer hover:text-text-primary select-none" data-sort="${key}">${label}${arrow}</th>`
}

function logoImg(s, cls = 'w-10 h-10') {
  const initials = s.symbol.slice(0, 2)
  const fallback = `<div class="${cls} rounded-xl bg-surface-elevated border border-border flex items-center justify-center text-xs font-bold text-text-muted shrink-0">${initials}</div>`
  if (!s.domain) return fallback
  return `<img
    src="https://www.google.com/s2/favicons?domain=${s.domain}&sz=64"
    alt="${s.symbol}"
    class="${cls} rounded-xl object-contain bg-surface-elevated p-1.5 border border-border shrink-0"
    onerror="this.replaceWith(Object.assign(document.createElement('div'), {
      className: '${cls} rounded-xl bg-surface-elevated border border-border flex items-center justify-center text-xs font-bold text-text-muted shrink-0',
      textContent: '${initials}'
    }))" />`
}

function stockRow(s, holdings) {
  const p = getPrice(s.symbol)
  const owned = holdings[s.symbol]
  const riskClass = s.risk === 'Low'  ? 'bg-gain/10 border-gain/30 text-gain' :
                    s.risk === 'High' ? 'bg-loss/10 border-loss/30 text-loss' :
                                        'bg-warning/10 border-warning/30 text-warning'
  return `
    <tr class="hover:bg-surface-elevated/50 transition-colors cursor-pointer" data-nav-stock="${s.symbol}">
      <td class="px-5 py-3.5">
        <div class="flex items-center gap-2">
          ${logoImg(s, 'w-10 h-10')}
          <div>
            <div class="font-mono font-bold text-text-primary group-hover:text-accent-primary">${s.symbol}</div>
            ${owned ? `<div class="text-[10px] text-accent-secondary">Owned: ${owned.shares % 1 === 0 ? owned.shares : owned.shares.toFixed(4)}</div>` : ''}
          </div>
        </div>
      </td>
      <td class="px-3 py-3.5 hidden sm:table-cell">
        <div class="font-mono font-bold text-xs text-accent-primary">${s.symbol}</div>
        <div class="text-text-secondary text-xs mt-0.5">${s.name}</div>
      </td>
      <td class="px-3 py-3.5 hidden md:table-cell">
        ${sectorBadge(s.sector)}
      </td>
      <td class="px-3 py-3.5 hidden lg:table-cell">
        ${s.risk ? `<span class="text-[9px] font-bold px-2 py-0.5 rounded-full border ${riskClass}">${s.risk}</span>` : '—'}
      </td>
      <td class="px-3 py-3.5 text-right">
        <span class="price-cell tabular-nums font-mono text-text-primary" data-sym="${s.symbol}">${pc(p.price)}</span>
      </td>
      <td class="px-3 py-3.5 text-right">
        <span class="change-cell tabular-nums text-xs ${gainClass(p.changePct)}" data-sym="${s.symbol}">${pct(p.changePct)}</span>
      </td>
      <td class="px-3 py-3.5 text-right hidden sm:table-cell">
        <button data-watch="${s.symbol}" class="watch-btn px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors
          ${isWatchlisted(s.symbol)
            ? 'bg-accent-primary/10 border-accent-primary/50 text-accent-primary'
            : 'bg-surface-elevated border-border text-text-muted hover:border-accent-primary/40 hover:text-text-primary'}">
          ${isWatchlisted(s.symbol) ? 'Watching' : 'Watch'}
        </button>
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
  search?.addEventListener('input', () => { searchQuery = search.value; page = 0; render() })

  container.querySelectorAll('.sector-btn').forEach(btn => {
    btn.addEventListener('click', () => { filterSector = btn.dataset.sector; page = 0; render() })
  })

  container.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => { viewMode = btn.dataset.view; render() })
  })

  container.querySelectorAll('[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort
      if (sortKey === key) sortDir *= -1
      else { sortKey = key; sortDir = 1 }
      page = 0
      render()
    })
  })

  container.querySelector('#page-prev')?.addEventListener('click', () => { if (page > 0) { page--; render() } })
  container.querySelector('#page-next')?.addEventListener('click', () => { page++; render() })

  container.querySelectorAll('.trade-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const sym = btn.dataset.symbol
      if (FINNHUB_API_KEY) fetchFinnhub(sym)
      openTradeModal(sym)
    })
  })

  container.querySelectorAll('.watch-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const sym = btn.dataset.watch
      toggleWatchlist(sym)
      const watching = isWatchlisted(sym)
      btn.textContent = watching ? 'Watching' : 'Watch'
      btn.classList.toggle('bg-accent-primary/10', watching)
      btn.classList.toggle('border-accent-primary/50', watching)
      btn.classList.toggle('text-accent-primary', watching)
      btn.classList.toggle('bg-surface-elevated', !watching)
      btn.classList.toggle('border-border', !watching)
      btn.classList.toggle('text-text-muted', !watching)
    })
  })

  // Table row click → stock detail
  container.querySelectorAll('[data-nav-stock]').forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('button')) return
      window.location.hash = `#stock-${row.dataset.navStock}`
    })
  })

  // Card click navigates to detail page
  if (viewMode === 'card') {
    container.querySelectorAll('.group[data-symbol]').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('button')) return
        window.location.hash = `#stock-${card.dataset.symbol}`
      })
    })
  }
}
