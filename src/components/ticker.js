// ticker.js — scrolling price banner shown below the navbar
import { getAllPrices } from '../api/prices.js'
import { STOCKS } from '../data/stocks.js'
import { pc } from '../utils/format.js'

let _el       = null
let _handler  = null

export function initTicker() {
  _el = document.getElementById('ticker-banner')
  if (!_el) return

  _render()
  _handler = () => _render()
  window.addEventListener('prices-updated', _handler)
}

export function destroyTicker() {
  if (_handler) { window.removeEventListener('prices-updated', _handler); _handler = null }
}

function _render() {
  if (!_el) return
  const prices = getAllPrices()

  // Build ticker items — duplicated so the marquee loops seamlessly
  const items = STOCKS.map(s => {
    const data = prices.get(s.symbol)
    if (!data) return ''
    const up  = data.change >= 0
    const pct = data.changePct != null ? data.changePct.toFixed(2) : '0.00'
    return `
      <span class="ticker-item inline-flex items-center gap-1.5 px-4">
        <span class="font-bold text-text-primary text-xs tracking-wide">${s.symbol}</span>
        <span class="font-mono text-xs text-text-secondary">${pc(data.price)}</span>
        <span class="text-[11px] font-bold ${up ? 'text-gain' : 'text-loss'}">
          ${up ? '▲' : '▼'} ${up ? '+' : ''}${pct}%
        </span>
      </span>
      <span class="text-border/60 text-xs">|</span>
    `
  }).join('')

  _el.innerHTML = `
    <div class="ticker-track whitespace-nowrap">
      ${items}${items}
    </div>
  `
}
