// stockDetail.js — individual stock page with Chart.js price chart
import { getPrice, fetchFinnhub, getPriceHistory, isMarketOpen } from '../api/prices.js'
import { getStock } from '../data/stocks.js'
import { pc, pct, gainClass } from '../utils/format.js'
import { openTradeModal } from '../components/tradeModal.js'
import { FINNHUB_API_KEY } from '../config.js'
import { getState } from '../state/store.js'
import Chart from 'chart.js/auto'

let chart = null
let priceListener = null
let currentSymbol = null
let currentRange = '1D'
let container = null

export function mountStockDetail(el, symbol) {
  container = el
  currentSymbol = symbol
  currentRange = '1D'

  if (FINNHUB_API_KEY) fetchFinnhub(symbol)

  render()

  priceListener = () => {
    updateLivePrice()
    if (chart) updateChart()
  }
  window.addEventListener('prices-updated', priceListener)
}

export function unmountStockDetail() {
  if (priceListener) {
    window.removeEventListener('prices-updated', priceListener)
    priceListener = null
  }
  if (chart) { chart.destroy(); chart = null }
  container = null
}

function render() {
  if (!container) return
  const stock = getStock(currentSymbol)
  const p = getPrice(currentSymbol)
  const state = getState()
  const holding = state.holdings[currentSymbol]
  const dir = p.price >= p.prev ? 'text-gain' : 'text-loss'
  const marketOpen = isMarketOpen()

  container.innerHTML = `
    <div class="max-w-5xl mx-auto px-4 py-6 space-y-6">

      <!-- Back -->
      <a href="#stocks" class="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors">
        ← Back to Stocks
      </a>

      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div class="flex items-center gap-3 mb-1">
            <h1 class="text-3xl font-display font-bold text-text-primary">${currentSymbol}</h1>
            <span class="text-xs px-2 py-0.5 rounded-full bg-surface-elevated border border-border text-text-muted">${stock?.sector ?? ''}</span>
            <span class="text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${marketOpen ? 'bg-gain/10 text-gain' : 'bg-surface-elevated text-text-muted'}">
              <span class="w-1.5 h-1.5 rounded-full ${marketOpen ? 'bg-gain animate-pulse' : 'bg-text-muted'}"></span>
              ${marketOpen ? 'Market Open' : 'Market Closed'}
            </span>
          </div>
          <div class="text-text-muted text-sm">${stock?.name ?? ''}</div>
        </div>
        <div class="text-right">
          <div id="detail-price" class="text-3xl font-bold font-mono text-text-primary">${pc(p.price)}</div>
          <div id="detail-change" class="text-sm font-medium mt-0.5 ${dir}">
            ${p.change >= 0 ? '+' : ''}${pc(p.change)} (${pct(p.changePct)})
          </div>
        </div>
      </div>

      <!-- Chart card -->
      <div class="bg-surface border border-border rounded-2xl p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold text-text-primary">Price Chart</h2>
          <div class="flex gap-1">
            ${['1D','1W','1M'].map(r => `
              <button data-range="${r}" class="range-btn px-3 py-1 rounded-lg text-xs font-medium border transition-colors
                ${currentRange === r ? 'bg-accent-primary text-bg border-accent-primary' : 'bg-surface border-border text-text-muted hover:text-text-primary'}">
                ${r}
              </button>
            `).join('')}
          </div>
        </div>
        <div class="relative h-56">
          <canvas id="price-chart"></canvas>
        </div>
      </div>

      <!-- Stats + Trade panel -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

        <!-- Stats -->
        <div class="md:col-span-2 space-y-4">

          <!-- Key stats -->
          <div class="bg-surface border border-border rounded-2xl p-5">
            <h2 class="font-semibold text-text-primary mb-4">Key Statistics</h2>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
              ${statItem('Base Price', pc(stock?.basePrice ?? 0))}
              ${statItem('Current Price', pc(p.price))}
              ${statItem('Day Change', `${p.change >= 0 ? '+' : ''}${pc(p.change)}`)}
              ${statItem('Day Change %', pct(p.changePct))}
              ${statItem('52W High (est.)', pc(Math.round(p.price * 1.35 * 100) / 100))}
              ${statItem('52W Low (est.)', pc(Math.round(p.price * 0.72 * 100) / 100))}
            </div>
          </div>

          <!-- Your position -->
          ${holding ? `
          <div class="bg-surface border border-border rounded-2xl p-5">
            <h2 class="font-semibold text-text-primary mb-4">Your Position</h2>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
              ${statItem('Shares Owned', holding.shares % 1 === 0 ? holding.shares : holding.shares.toFixed(4))}
              ${statItem('Avg Cost', pc(holding.avgCost))}
              ${statItem('Market Value', pc(holding.shares * p.price))}
              ${(() => {
                const pl = (p.price - holding.avgCost) * holding.shares
                const plPct = ((p.price - holding.avgCost) / holding.avgCost) * 100
                return statItem('Unrealized P&L', `<span class="${gainClass(pl)}">${pl >= 0 ? '+' : ''}${pc(pl)} (${pct(plPct)})</span>`)
              })()}
            </div>
          </div>` : ''}
        </div>

        <!-- Trade panel -->
        <div class="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3">
          <h2 class="font-semibold text-text-primary">Trade ${currentSymbol}</h2>
          <div class="text-2xl font-bold font-mono text-text-primary">${pc(p.price)}</div>
          <div class="text-xs text-text-muted">Balance: <span class="text-text-secondary">${pc(getState().user.balance)}</span></div>
          ${holding ? `<div class="text-xs text-text-muted">Holding: <span class="text-accent-secondary">${holding.shares % 1 === 0 ? holding.shares : holding.shares.toFixed(4)} shares</span></div>` : ''}
          <button id="buy-btn" class="w-full py-3 rounded-xl bg-gain hover:bg-gain/90 text-bg font-bold text-sm transition-colors">Buy ${currentSymbol}</button>
          ${holding ? `<button id="sell-btn" class="w-full py-3 rounded-xl bg-loss hover:bg-loss/90 text-white font-bold text-sm transition-colors">Sell ${currentSymbol}</button>` : ''}
          <div class="text-[10px] text-text-muted text-center">0.5% fee applies to all trades</div>
        </div>

      </div>
    </div>
  `

  // Range buttons
  container.querySelectorAll('.range-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentRange = btn.dataset.range
      container.querySelectorAll('.range-btn').forEach(b => {
        const active = b.dataset.range === currentRange
        b.className = `range-btn px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${active ? 'bg-accent-primary text-bg border-accent-primary' : 'bg-surface border-border text-text-muted hover:text-text-primary'}`
      })
      buildChart()
    })
  })

  container.querySelector('#buy-btn')?.addEventListener('click', () => openTradeModal(currentSymbol))
  container.querySelector('#sell-btn')?.addEventListener('click', () => openTradeModal(currentSymbol))

  setTimeout(() => buildChart(), 50)
}

function statItem(label, value) {
  return `
    <div>
      <div class="text-[10px] text-text-muted uppercase tracking-wide mb-0.5">${label}</div>
      <div class="text-sm font-semibold text-text-primary">${value}</div>
    </div>
  `
}

function buildChart() {
  if (chart) { chart.destroy(); chart = null }
  const canvas = document.getElementById('price-chart')
  if (!canvas) return

  const history = getPriceHistory(currentSymbol, currentRange)
  const prices  = history.map(h => h.price)
  const labels  = history.map(h => {
    const d = new Date(h.ts)
    if (currentRange === '1D') return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    if (currentRange === '1W') return d.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  })

  const first  = prices[0] ?? 0
  const last   = prices.at(-1) ?? 0
  const isUp   = last >= first
  const color  = isUp ? '#10B981' : '#EF4444'

  chart = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: prices,
        borderColor: color,
        borderWidth: 2,
        pointRadius: 0,
        fill: true,
        backgroundColor: (ctx) => {
          const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, ctx.chart.height)
          gradient.addColorStop(0, color + '33')
          gradient.addColorStop(1, color + '00')
          return gradient
        },
        tension: 0.3,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `  ${pc(ctx.raw)}`,
          },
          backgroundColor: '#111827',
          borderColor: '#1F2937',
          borderWidth: 1,
          titleColor: '#9CA3AF',
          bodyColor: '#F9FAFB',
        },
      },
      scales: {
        x: {
          ticks: { color: '#6B7280', maxTicksLimit: 6, maxRotation: 0 },
          grid: { color: '#1F2937' },
        },
        y: {
          ticks: { color: '#6B7280', callback: v => pc(v) },
          grid: { color: '#1F2937' },
          position: 'right',
        },
      },
    },
  })
}

function updateLivePrice() {
  if (!container) return
  const p = getPrice(currentSymbol)
  const dir = p.price >= p.prev ? 'text-gain' : 'text-loss'
  const priceEl = container.querySelector('#detail-price')
  const changeEl = container.querySelector('#detail-change')
  if (priceEl) priceEl.textContent = pc(p.price)
  if (changeEl) {
    changeEl.className = `text-sm font-medium mt-0.5 ${dir}`
    changeEl.textContent = `${p.change >= 0 ? '+' : ''}${pc(p.change)} (${pct(p.changePct)})`
  }
}

function updateChart() {
  if (!chart) return
  const history = getPriceHistory(currentSymbol, currentRange)
  const prices  = history.map(h => h.price)
  chart.data.datasets[0].data = prices
  chart.update('none')
}
