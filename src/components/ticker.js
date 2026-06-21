// ticker.js — scrolling price banner shown below the navbar
import { getAllPrices } from '../api/prices.js'
import { STOCKS } from '../data/stocks.js'
import { pc } from '../utils/format.js'

let _el       = null
let _handler  = null
let _built    = false

export function initTicker() {
  _el = document.getElementById('ticker-banner')
  if (!_el) return

  _build()
  _handler = () => _update()
  window.addEventListener('prices-updated', _handler)
}

export function destroyTicker() {
  if (_handler) { window.removeEventListener('prices-updated', _handler); _handler = null }
  _built = false
}

// Build the DOM structure once — animation starts here and never resets
function _build() {
  if (!_el) return
  const prices = getAllPrices()

  const items = STOCKS.map(s => {
    const data = prices.get(s.symbol)
    const up   = data ? data.change >= 0 : true
    const pct  = data ? data.changePct.toFixed(2) : '0.00'
    const price = data ? pc(data.price) : '—'
    return `
      <span class="ticker-item inline-flex items-center gap-1.5 px-4" data-sym="${s.symbol}">
        <span class="font-bold text-text-primary text-xs tracking-wide">${s.symbol}</span>
        <span class="ticker-price font-mono text-xs text-text-secondary">${price}</span>
        <span class="ticker-pct text-[11px] font-bold ${up ? 'text-gain' : 'text-loss'}">
          ${up ? '▲' : '▼'} ${up ? '+' : ''}${pct}%
        </span>
      </span>
      <span class="text-border/60 text-xs">|</span>
    `
  }).join('')

  // Duplicate for seamless loop — both copies share the same data-sym items
  _el.innerHTML = `<div class="ticker-track whitespace-nowrap">${items}${items}</div>`
  _built = true
}

// Update only the text nodes — never touch the animation-driving structure
function _update() {
  if (!_el || !_built) return
  const prices = getAllPrices()

  _el.querySelectorAll('.ticker-item').forEach(item => {
    const sym  = item.dataset.sym
    const data = prices.get(sym)
    if (!data) return

    const up  = data.change >= 0
    const pct = data.changePct.toFixed(2)

    item.querySelector('.ticker-price').textContent = pc(data.price)

    const pctEl = item.querySelector('.ticker-pct')
    pctEl.textContent = `${up ? '▲' : '▼'} ${up ? '+' : ''}${pct}%`
    pctEl.className = `ticker-pct text-[11px] font-bold ${up ? 'text-gain' : 'text-loss'}`
  })
}
