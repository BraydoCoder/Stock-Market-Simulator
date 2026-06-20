// heatMap.js — market heat map grouped by sector
// Color intensity scales with % change: green = up, red = down.
import { STOCKS } from '../data/stocks.js'
import { getPrice } from '../api/prices.js'

let container = null
let priceListener = null

export function mountHeatMap(el) {
  container = el
  render()
  priceListener = () => updateCells()
  window.addEventListener('prices-updated', priceListener)
}

export function unmountHeatMap() {
  if (priceListener) {
    window.removeEventListener('prices-updated', priceListener)
    priceListener = null
  }
  container = null
}

// Group stocks by sector
function bySector() {
  const map = {}
  for (const s of STOCKS) {
    if (!map[s.sector]) map[s.sector] = []
    map[s.sector].push(s)
  }
  // Sort sectors alphabetically, stocks within sector by symbol
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([sector, stocks]) => ({ sector, stocks: stocks.sort((a, b) => a.symbol.localeCompare(b.symbol)) }))
}

function cellColor(changePct) {
  if (changePct === 0) return 'hsl(220,10%,22%)'
  const mag = Math.min(Math.abs(changePct), 10)
  const light = Math.max(18, 38 - mag * 2)
  return changePct > 0
    ? `hsl(142,65%,${light}%)`
    : `hsl(4,65%,${light}%)`
}

function cellHtml(s) {
  const p = getPrice(s.symbol)
  const color = cellColor(p.changePct)
  const sign = p.changePct > 0 ? '+' : ''
  return `
    <div class="heat-cell cursor-pointer rounded-lg p-2 flex flex-col justify-between min-w-0 border border-white/5 hover:border-white/20 transition-colors select-none"
      style="background:${color}; min-height:54px;"
      data-symbol="${s.symbol}"
      title="${s.name} | ${sign}${p.changePct.toFixed(2)}%">
      <div class="font-mono font-bold text-[11px] text-white/90 leading-none truncate">${s.symbol}</div>
      <div class="text-[10px] tabular-nums leading-none mt-1 ${p.changePct >= 0 ? 'text-green-300' : 'text-red-300'}"
        data-change="${s.symbol}">
        ${sign}${p.changePct.toFixed(1)}%
      </div>
    </div>
  `
}

function render() {
  if (!container) return
  const sectors = bySector()

  container.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-display font-bold text-text-primary">Market Heat Map</h1>
          <p class="text-xs text-text-muted mt-1">Click any cell to view stock detail. Color intensity = strength of move.</p>
        </div>
        <div class="flex items-center gap-4 text-xs text-text-muted">
          <span class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-sm" style="background:hsl(142,65%,30%)"></span> Up
          </span>
          <span class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-sm" style="background:hsl(220,10%,22%)"></span> Flat
          </span>
          <span class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-sm" style="background:hsl(4,65%,30%)"></span> Down
          </span>
        </div>
      </div>

      ${sectors.map(({ sector, stocks }) => `
        <div class="space-y-2">
          <div class="text-xs font-semibold text-text-muted uppercase tracking-widest">${sector} <span class="font-normal opacity-60">${stocks.length}</span></div>
          <div class="grid gap-1.5" style="grid-template-columns: repeat(auto-fill, minmax(70px, 1fr))">
            ${stocks.map(cellHtml).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `

  container.addEventListener('click', (e) => {
    const cell = e.target.closest('[data-symbol]')
    if (cell) window.location.hash = `#stock-${cell.dataset.symbol}`
  })
}

function updateCells() {
  if (!container) return
  container.querySelectorAll('.heat-cell').forEach(cell => {
    const sym = cell.dataset.symbol
    const p = getPrice(sym)
    const color = cellColor(p.changePct)
    cell.style.background = color
    const sign = p.changePct > 0 ? '+' : ''
    const changeEl = cell.querySelector(`[data-change="${sym}"]`)
    if (changeEl) {
      changeEl.textContent = `${sign}${p.changePct.toFixed(1)}%`
      changeEl.className = `text-[10px] tabular-nums leading-none mt-1 ${p.changePct >= 0 ? 'text-green-300' : 'text-red-300'}`
    }
    cell.title = `${sym} | ${sign}${p.changePct.toFixed(2)}%`
  })
}
