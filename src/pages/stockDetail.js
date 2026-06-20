import { getPrice, fetchFinnhub, getPriceHistory, isMarketOpen } from '../api/prices.js'
import { getStock, STOCKS } from '../data/stocks.js'
import { pc, pct, gainClass, relativeTime } from '../utils/format.js'
import { openTradeModal } from '../components/tradeModal.js'
import { openStockInfoModal, closeStockInfoModal } from '../components/stockInfoModal.js'
import { FINNHUB_API_KEY } from '../config.js'
import { getState, toggleWatchlist, isWatchlisted } from '../state/store.js'
import Chart from 'chart.js/auto'

let chart         = null
let priceListener = null
let currentSymbol = null
let currentRange  = '1D'
let container     = null
const newsCache   = new Map()

// ── Seeded deterministic stats ────────────────────────────────────────────────

function sr(symbol, offset) {
  let h = offset | 0
  for (let i = 0; i < symbol.length; i++) {
    h = Math.imul(31, h) + symbol.charCodeAt(i) | 0
  }
  return (Math.abs(h) % 10000) / 10000
}

function fakeStats(stock, price) {
  const s  = stock.symbol
  const pe = Math.round(8 + sr(s, 1) * 52)
  const eps    = Math.round(price / pe * 100) / 100
  const sharesB = 0.5 + sr(s, 2) * 29.5             // 0.5B–30B shares
  const mktCap  = price * sharesB * 1e9
  const highDiv  = stock.risk === 'High'
  const divYield = highDiv ? (sr(s, 3) * 0.5).toFixed(2) : (sr(s, 3) * 4.5).toFixed(2)
  const earningsDays = Math.round(7 + sr(s, 4) * 80)
  const earningsDate  = new Date(Date.now() + earningsDays * 86400000)
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const w52High = Math.round(price * (1.08 + sr(s, 5) * 0.35) * 100) / 100
  const w52Low  = Math.round(price * (0.62 + sr(s, 6) * 0.28) * 100) / 100
  const volM    = (0.5 + sr(s, 7) * 120).toFixed(3) + 'm'
  const spread  = Math.round(price * (0.0001 + sr(s, 8) * 0.0008) * 100) / 100
  const dayHigh = Math.round(price * (1.002 + sr(s, 9)  * 0.018) * 100) / 100
  const dayLow  = Math.round(price * (0.980 - sr(s, 10) * 0.015) * 100) / 100
  const bidAsk  = `${pc(Math.round((price - spread) * 100) / 100)}/${pc(Math.round((price + spread) * 100) / 100)}`
  const capStr  = mktCap >= 1e12
    ? (mktCap / 1e12).toFixed(2) + 'T'
    : (mktCap / 1e9).toFixed(1) + 'B'
  return { pe, eps, capStr, divYield, earningsDate, w52High, w52Low, volM, bidAsk, dayHigh, dayLow }
}

// ── Mount / unmount ───────────────────────────────────────────────────────────

export function mountStockDetail(el, symbol) {
  container     = el
  currentSymbol = symbol
  currentRange  = '1D'

  if (FINNHUB_API_KEY) fetchFinnhub(symbol)

  render()
  fetchNews(symbol)

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
  closeStockInfoModal()
  if (chart) { chart.destroy(); chart = null }
  container = null
}

// ── Render ────────────────────────────────────────────────────────────────────

const RANGES = ['1D', '1W', '1M']

function render() {
  if (!container) return
  const stock     = getStock(currentSymbol)
  const p         = getPrice(currentSymbol)
  const state     = getState()
  const holding   = state.holdings[currentSymbol]
  const marketOpen = isMarketOpen()
  const isUp      = p.change >= 0
  const stats     = fakeStats(stock, p.price)
  const logoUrl   = stock?.domain
    ? `https://www.google.com/s2/favicons?domain=${stock.domain}&sz=64`
    : null

  container.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 py-6 space-y-5">

      <!-- Back -->
      <a href="#stocks" class="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors">
        ← Back to Stocks
      </a>

      <!-- Main grid: info left + chart right -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

        <!-- ── LEFT: Stock info ─────────────────────────────────────────── -->
        <div class="space-y-5">

          <!-- Company identity -->
          <div class="bg-surface border border-border rounded-2xl p-5">
            <div class="flex items-start gap-4">

              <!-- Logo -->
              <div class="w-16 h-16 rounded-2xl border border-border bg-surface-elevated flex items-center justify-center shrink-0 overflow-hidden">
                ${logoUrl
                  ? `<img src="${logoUrl}" alt="${currentSymbol}" class="w-10 h-10 object-contain"
                       onerror="this.replaceWith(Object.assign(document.createElement('span'),
                         {className:'text-xl font-bold text-text-muted', textContent:'${currentSymbol[0]}'}))"/>`
                  : `<span class="text-xl font-bold text-text-muted">${currentSymbol[0]}</span>`}
              </div>

              <!-- Name / exchange / watchlist -->
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <h1 class="text-2xl font-display font-bold text-text-primary leading-none">${currentSymbol}</h1>
                    <div class="text-sm text-text-muted mt-0.5">${stock?.name ?? ''}</div>
                    <div class="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span class="text-[10px] px-2 py-0.5 rounded-full bg-surface-elevated border border-border text-text-muted">NASDAQ</span>
                      <span class="text-[10px] px-2 py-0.5 rounded-full bg-surface-elevated border border-border text-text-muted">${stock?.sector ?? ''}</span>
                      ${stock?.risk ? `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide
                        ${stock.risk === 'Low'  ? 'bg-gain/10 border-gain/30 text-gain' :
                          stock.risk === 'High' ? 'bg-loss/10 border-loss/30 text-loss' :
                                                  'bg-warning/10 border-warning/30 text-warning'}">
                        ${stock.risk} Risk
                      </span>` : ''}
                    </div>
                  </div>
                  <div class="flex flex-col gap-1.5">
                    <button id="watchlist-btn"
                      class="shrink-0 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors
                      ${isWatchlisted(currentSymbol)
                        ? 'bg-accent-primary/10 border-accent-primary/50 text-accent-primary'
                        : 'bg-surface-elevated border-border text-text-muted hover:border-accent-primary/40 hover:text-text-primary'}">
                      ${isWatchlisted(currentSymbol) ? '★ Watching' : '☆ Watch'}
                    </button>
                    <button id="more-info-btn"
                      class="shrink-0 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors
                        bg-surface-elevated border-border text-text-muted hover:border-accent-secondary/50 hover:text-accent-secondary">
                      More Info
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Price block -->
            <div class="mt-4 pb-4 border-b border-border">
              <div class="flex items-end gap-3">
                <div id="detail-price" class="text-4xl font-bold font-mono text-text-primary leading-none">${pc(p.price)}</div>
                <div id="detail-change" class="text-base font-semibold ${isUp ? 'text-gain' : 'text-loss'} mb-0.5">
                  ${p.change >= 0 ? '+' : ''}${pc(p.change)} (${pct(p.changePct)})
                </div>
              </div>
              <div class="flex items-center gap-1.5 mt-1.5 text-[11px] ${marketOpen ? 'text-gain' : 'text-text-muted'}">
                <span class="w-1.5 h-1.5 rounded-full ${marketOpen ? 'bg-gain animate-pulse' : 'bg-text-muted'}"></span>
                ${marketOpen ? 'MARKET OPEN' : 'MARKET CLOSED'} · USD
              </div>
            </div>

            <!-- Key metrics row -->
            <div class="grid grid-cols-5 gap-0 mt-4 divide-x divide-border">
              ${metricCell(stats.earningsDate, 'UPCOMING EARNINGS')}
              ${metricCell('$' + stats.eps, 'EPS')}
              ${metricCell(stats.capStr, 'MARKET CAP')}
              ${metricCell(stats.divYield + '%', 'DIV YIELD')}
              ${metricCell(stats.pe, 'P/E')}
            </div>
          </div>

          <!-- Stats table -->
          <div class="bg-surface border border-border rounded-2xl overflow-hidden">
            <div class="grid grid-cols-2 divide-x divide-border">
              ${statsRow('Volume (current)', stats.volM, '52 Week High ($)', pc(stats.w52High))}
              ${statsRow("Day's High ($)", pc(stats.dayHigh), 'Bid/Ask price ($)', stats.bidAsk)}
              ${statsRow("Day's Low ($)", pc(stats.dayLow), '52 Week Low ($)', pc(stats.w52Low))}
            </div>
          </div>

          <!-- Your Position (if held) -->
          ${holding ? `
          <div class="bg-surface border border-border rounded-2xl p-5">
            <h2 class="font-semibold text-text-primary mb-3 text-sm uppercase tracking-wide text-text-muted">Your Position</h2>
            <div class="grid grid-cols-2 gap-4">
              ${statItem('Shares Owned', holding.shares % 1 === 0 ? holding.shares : holding.shares.toFixed(4))}
              ${statItem('Avg Cost', pc(holding.avgCost))}
              ${statItem('Market Value', pc(holding.shares * p.price))}
              ${(() => {
                const pl    = (p.price - holding.avgCost) * holding.shares
                const plPct = ((p.price - holding.avgCost) / holding.avgCost) * 100
                return statItem('Unrealized P&L',
                  `<span class="${gainClass(pl)}">${pl >= 0 ? '+' : ''}${pc(pl)} (${pct(plPct)})</span>`)
              })()}
            </div>
          </div>` : ''}

        </div>

        <!-- ── RIGHT: Chart ──────────────────────────────────────────────── -->
        <div class="bg-surface border border-border rounded-2xl p-5">

          <!-- Range tabs -->
          <div class="flex items-center gap-1 mb-4">
            ${RANGES.map(r => `
              <button data-range="${r}" class="range-btn px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                ${currentRange === r
                  ? 'bg-accent-primary text-bg'
                  : 'text-text-muted hover:text-text-primary hover:bg-surface-elevated'}">
                ${r}
              </button>
            `).join('')}
          </div>

          <!-- Chart -->
          <div class="relative" style="height:340px;">
            <canvas id="price-chart"></canvas>
          </div>
        </div>

      </div>

      <!-- ── Trade panel ──────────────────────────────────────────────────── -->
      <div class="bg-surface border border-border rounded-2xl p-5">
        <h2 class="font-semibold text-text-primary mb-4">Place an Order — ${currentSymbol}
          <span class="text-text-muted font-normal text-sm ml-2">@ ${pc(p.price)}</span>
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">

          <!-- Action -->
          <div class="flex flex-col gap-1">
            <label class="text-[10px] font-semibold text-text-muted uppercase tracking-widest flex items-center gap-1">
              Action
            </label>
            <select id="trade-action" class="bg-surface-elevated border border-border rounded-xl px-3 py-2.5 text-sm
              text-text-primary outline-none focus:border-accent-primary transition-colors cursor-pointer">
              <option value="buy">Buy</option>
              ${holding ? '<option value="sell">Sell</option>' : ''}
            </select>
          </div>

          <!-- Quantity -->
          <div class="flex flex-col gap-1">
            <label class="text-[10px] font-semibold text-text-muted uppercase tracking-widest flex items-center gap-1">
              Quantity
              <button id="show-max-btn" class="text-accent-primary hover:underline normal-case font-medium ml-1">Show Max</button>
            </label>
            <input id="trade-qty" type="number" min="0" value="0"
              class="bg-surface-elevated border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary
                     outline-none focus:border-accent-primary transition-colors" />
          </div>

          <!-- Order Type -->
          <div class="flex flex-col gap-1">
            <label class="text-[10px] font-semibold text-text-muted uppercase tracking-widest">
              Order Type
            </label>
            <select class="bg-surface-elevated border border-border rounded-xl px-3 py-2.5 text-sm
              text-text-primary outline-none focus:border-accent-primary transition-colors cursor-pointer">
              <option>Market</option>
              <option>Limit</option>
              <option>Stop</option>
            </select>
          </div>

          <!-- Duration + Place button -->
          <div class="flex flex-col gap-1">
            <label class="text-[10px] font-semibold text-text-muted uppercase tracking-widest">
              Duration
            </label>
            <select class="bg-surface-elevated border border-border rounded-xl px-3 py-2.5 text-sm
              text-text-primary outline-none focus:border-accent-primary transition-colors cursor-pointer">
              <option>Day Only</option>
              <option>Good 'Til Cancelled</option>
              <option>Immediate or Cancel</option>
            </select>
          </div>
        </div>

        <!-- Cost preview + Place order -->
        <div class="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <div class="text-sm text-text-muted">
            Balance: <span class="text-text-primary font-semibold">${pc(state.user.balance)}</span>
            <span class="mx-2 text-border">·</span>
            Est. cost: <span id="est-cost" class="text-text-primary font-semibold">—</span>
          </div>
          <button id="place-order-btn"
            class="px-6 py-2.5 rounded-xl font-bold text-sm bg-accent-primary hover:bg-accent-primary/90 text-bg transition-colors">
            Place Order
          </button>
        </div>
      </div>

      <!-- News -->
      <div id="news-section" class="bg-surface border border-border rounded-2xl overflow-hidden">
        <div class="px-5 py-4 border-b border-border">
          <h2 class="font-semibold text-text-primary">Recent News</h2>
        </div>
        <div class="px-5 py-4 text-sm text-text-muted">Loading news...</div>
      </div>

    </div>
  `

  // Range buttons
  container.querySelectorAll('.range-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentRange = btn.dataset.range
      container.querySelectorAll('.range-btn').forEach(b => {
        const on = b.dataset.range === currentRange
        b.className = `range-btn px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
          on ? 'bg-accent-primary text-bg' : 'text-text-muted hover:text-text-primary hover:bg-surface-elevated'}`
      })
      buildChart()
    })
  })

  // More Info drawer
  container.querySelector('#more-info-btn')?.addEventListener('click', () => {
    openStockInfoModal(stock, p.price)
  })

  // Watchlist
  container.querySelector('#watchlist-btn')?.addEventListener('click', () => {
    toggleWatchlist(currentSymbol)
    const btn = container.querySelector('#watchlist-btn')
    if (!btn) return
    const on = isWatchlisted(currentSymbol)
    btn.textContent = on ? '★ Watching' : '☆ Watch'
    btn.className = `shrink-0 mt-0.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
      on
        ? 'bg-accent-primary/10 border-accent-primary/50 text-accent-primary'
        : 'bg-surface-elevated border-border text-text-muted hover:border-accent-primary/40 hover:text-text-primary'}`
  })

  // Trade qty → est cost
  const qtyInput = container.querySelector('#trade-qty')
  const estEl    = container.querySelector('#est-cost')
  function updateEst() {
    const qty = parseFloat(qtyInput?.value ?? 0) || 0
    const cp  = getPrice(currentSymbol).price
    estEl.textContent = qty > 0 ? pc(qty * cp) : '—'
  }
  qtyInput?.addEventListener('input', updateEst)

  // Show Max
  container.querySelector('#show-max-btn')?.addEventListener('click', () => {
    const action  = container.querySelector('#trade-action')?.value ?? 'buy'
    const cp      = getPrice(currentSymbol).price
    const balance = getState().user.balance
    const h       = getState().holdings[currentSymbol]
    if (action === 'buy') {
      qtyInput.value = Math.floor(balance / cp)
    } else {
      qtyInput.value = h ? h.shares : 0
    }
    updateEst()
  })

  // Place order
  container.querySelector('#place-order-btn')?.addEventListener('click', () => {
    openTradeModal(currentSymbol)
  })

  setTimeout(() => buildChart(), 50)
}

// ── Helper renderers ──────────────────────────────────────────────────────────

function metricCell(value, label) {
  return `
    <div class="px-3 first:pl-0 last:pr-0">
      <div class="text-sm font-bold text-text-primary">${value}</div>
      <div class="text-[9px] text-text-muted uppercase tracking-wide mt-0.5">${label}</div>
    </div>
  `
}

function statsRow(l1, v1, l2, v2) {
  return `
    <div class="px-5 py-3.5 border-b border-border last:border-0">
      <div class="flex justify-between items-baseline gap-2">
        <span class="text-xs font-semibold text-text-secondary">${l1}</span>
        <span class="text-xs font-mono text-text-primary">${v1}</span>
      </div>
    </div>
    <div class="px-5 py-3.5 border-b border-border last:border-0">
      <div class="flex justify-between items-baseline gap-2">
        <span class="text-xs font-semibold text-text-secondary">${l2}</span>
        <span class="text-xs font-mono text-text-primary">${v2}</span>
      </div>
    </div>
  `
}

function statItem(label, value) {
  return `
    <div>
      <div class="text-[10px] text-text-muted uppercase tracking-wide mb-0.5">${label}</div>
      <div class="text-sm font-semibold text-text-primary">${value}</div>
    </div>
  `
}

// ── Chart ─────────────────────────────────────────────────────────────────────

function buildChart() {
  if (chart) { chart.destroy(); chart = null }
  const canvas = document.getElementById('price-chart')
  if (!canvas) return

  const history = getPriceHistory(currentSymbol, currentRange)
  const prices  = history.map(h => h.price)
  const labels  = history.map(h => {
    const d = new Date(h.ts)
    if (currentRange === '1D') return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    if (currentRange === '1W') return d.toLocaleDateString([], { weekday: 'short' })
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  })

  const first = prices[0] ?? 0
  const last  = prices.at(-1) ?? 0
  const isUp  = last >= first
  const color = isUp ? '#10B981' : '#EF4444'

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
        backgroundColor: ctx => {
          const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, ctx.chart.height)
          g.addColorStop(0, color + '40')
          g.addColorStop(1, color + '00')
          return g
        },
        tension: 0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: ctx => `  ${pc(ctx.raw)}` },
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
          grid:  { color: '#1F293720' },
        },
        y: {
          ticks:    { color: '#6B7280', callback: v => pc(v) },
          grid:     { color: '#1F293720' },
          position: 'right',
        },
      },
    },
  })
}

function updateChart() {
  if (!chart) return
  const history = getPriceHistory(currentSymbol, currentRange)
  chart.data.datasets[0].data = history.map(h => h.price)
  chart.update('none')
}

// ── Live price update ─────────────────────────────────────────────────────────

function updateLivePrice() {
  if (!container) return
  const p = getPrice(currentSymbol)

  const priceEl = container.querySelector('#detail-price')
  if (priceEl) {
    const prev = parseFloat(priceEl.dataset.prev ?? p.price)
    priceEl.dataset.prev = p.price
    priceEl.textContent  = pc(p.price)
    priceEl.classList.remove('flash-green', 'flash-red')
    void priceEl.offsetWidth
    priceEl.classList.add(p.price >= prev ? 'flash-green' : 'flash-red')
  }

  const changeEl = container.querySelector('#detail-change')
  if (changeEl) {
    changeEl.className   = `text-base font-semibold ${p.change >= 0 ? 'text-gain' : 'text-loss'} mb-0.5`
    changeEl.textContent = `${p.change >= 0 ? '+' : ''}${pc(p.change)} (${pct(p.changePct)})`
  }

  const estEl  = container.querySelector('#est-cost')
  const qtyEl  = container.querySelector('#trade-qty')
  if (estEl && qtyEl) {
    const qty = parseFloat(qtyEl.value) || 0
    estEl.textContent = qty > 0 ? pc(qty * p.price) : '—'
  }
}

// ── News ──────────────────────────────────────────────────────────────────────

async function fetchNews(symbol) {
  if (!FINNHUB_API_KEY) { renderNews([]); return }
  const cached = newsCache.get(symbol)
  if (cached && Date.now() - cached.ts < 10 * 60_000) { renderNews(cached.articles); return }
  try {
    const to   = new Date().toISOString().slice(0, 10)
    const from = new Date(Date.now() - 7 * 24 * 60 * 60_000).toISOString().slice(0, 10)
    const res  = await fetch(
      `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`,
      { signal: AbortSignal.timeout(6000) }
    )
    const data     = res.ok ? await res.json() : []
    const articles = Array.isArray(data) ? data.slice(0, 5) : []
    newsCache.set(symbol, { ts: Date.now(), articles })
    renderNews(articles)
  } catch { renderNews([]) }
}

function renderNews(articles) {
  const section = container?.querySelector('#news-section')
  if (!section) return
  if (!articles.length) {
    section.querySelector('div:last-child').innerHTML =
      `<span class="text-sm text-text-muted">No recent news available.</span>`
    return
  }
  section.querySelector('div:last-child').innerHTML = `
    <div class="divide-y divide-border">
      ${articles.map(a => `
        <a href="${a.url}" target="_blank" rel="noopener noreferrer"
          class="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 hover:opacity-80 transition-opacity">
          <div class="text-sm font-medium text-text-primary leading-snug">${a.headline}</div>
          <div class="flex items-center gap-2 text-[10px] text-text-muted">
            <span>${a.source}</span><span>·</span><span>${relativeTime(a.datetime * 1000)}</span>
          </div>
        </a>
      `).join('')}
    </div>
  `
}
