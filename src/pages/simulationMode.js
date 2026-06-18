// simulationMode.js — Time Warp page
import Chart from 'chart.js/auto'
import { pc } from '../utils/format.js'
import { getPrice } from '../api/prices.js'
import { STOCKS } from '../data/stocks.js'
import { FINNHUB_API_KEY } from '../config.js'
import {
  getTimeMachineState,
  subscribeTimeMachine,
  setSpeed,
  pauseTime,
  startRewind,
  stopRewind,
  stepBack,
  stepForward,
  returnToLive,
  travelToDate,
  getHistory,
} from '../lib/timeMachine.js'

let container    = null
let _sub         = null
let _chart       = null
let _selectedSym = 'AAPL'
let _travelOpen  = false
let _travelError = ''
let _rafPending  = false

// ── Mount / unmount ───────────────────────────────────────────────────────────

export function mountSimulationMode(el) {
  container    = el
  _travelOpen  = false
  _travelError = ''
  _rafPending  = false

  _renderPage()
  _initChart()

  // Event delegation — attached ONCE to the stable container, survives re-renders
  container.addEventListener('click',  _handleClick)
  container.addEventListener('keydown', _handleKey)
  container.addEventListener('change',  _handleChange)

  _sub = subscribeTimeMachine(_scheduleUpdate)
}

export function unmountSimulationMode() {
  _sub?.()
  _sub = null
  if (_chart) { _chart.destroy(); _chart = null }
  container = null
}

// ── Throttled update ──────────────────────────────────────────────────────────

function _scheduleUpdate() {
  if (_rafPending) return
  _rafPending = true
  requestAnimationFrame(() => {
    _rafPending = false
    _renderControls()
    _updateChart()
    _updateStockPrice()
    _updatePriceTable()
    _updateStats()
  })
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function _fmtDate(d) {
  if (!d) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function _isoDate(d) {
  if (!d) return ''
  const y  = d.getFullYear()
  const m  = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

// ── Static page shell (rendered once on mount) ────────────────────────────────

function _renderPage() {
  if (!container) return

  const symOptions = STOCKS.map(s =>
    `<option value="${s.symbol}" ${s.symbol === _selectedSym ? 'selected' : ''}>${s.symbol} — ${s.name}</option>`
  ).join('')

  container.innerHTML = `
    <div class="max-w-6xl mx-auto px-4 py-6 space-y-4">

      <!-- Header -->
      <div>
        <h1 class="text-2xl font-display font-bold text-text-primary">Time Warp</h1>
        <p class="text-sm text-text-muted mt-1">
          Control simulated time — speed up, pause, rewind, or jump to any date.
          ${FINNHUB_API_KEY
            ? '<span class="text-gain font-medium">&#9679; Real Finnhub prices active</span>'
            : '<span class="text-accent-primary font-medium">&#9679; Simulation mode &mdash; mock data for future dates</span>'}
        </p>
      </div>

      <!-- Controls card — inner divs re-rendered; outer card persists -->
      <div class="bg-surface border border-border rounded-2xl overflow-hidden">
        <div id="tw-controls" class="px-4 py-3"></div>
        <div id="tw-travel-panel"></div>
      </div>

      <!-- Main grid: chart left, sidebar right -->
      <div class="grid grid-cols-1 lg:grid-cols-[1fr_288px] gap-4">

        <!-- Left: stock price chart -->
        <div class="bg-surface border border-border rounded-2xl overflow-hidden">

          <!-- Stock selector + live price (selector is static; price span is updated in-place) -->
          <div class="px-5 py-3 border-b border-border flex items-center gap-3 flex-wrap">
            <select id="tw-sym"
              class="bg-surface-elevated border border-border rounded-lg px-2.5 py-1.5 text-sm
                     text-text-primary outline-none focus:border-accent-primary transition-colors cursor-pointer">
              ${symOptions}
            </select>
            <div id="tw-stock-price" class="flex items-baseline gap-2">
              <!-- updated in _updateStockPrice() -->
            </div>
            <span class="text-[10px] text-text-muted ml-auto hidden sm:block">Price over simulated time</span>
          </div>

          <!-- Chart canvas -->
          <div style="position:relative;height:264px;">
            <canvas id="tw-chart"></canvas>
          </div>
        </div>

        <!-- Right sidebar -->
        <div class="flex flex-col gap-4">

          <!-- Stats -->
          <div id="tw-stats"
            class="bg-surface border border-border rounded-2xl p-4 grid grid-cols-2 gap-x-4 gap-y-3">
            <!-- updated in _updateStats() -->
          </div>

          <!-- Live price table -->
          <div class="bg-surface border border-border rounded-2xl overflow-hidden flex-1">
            <div class="px-4 py-2.5 border-b border-border flex items-center justify-between">
              <span class="text-xs font-semibold text-text-primary uppercase tracking-wider">Live Prices</span>
              <span class="text-[10px] text-text-muted">Updates each tick</span>
            </div>
            <div id="tw-price-table" class="overflow-y-auto" style="max-height:340px;">
              <!-- updated in _updatePriceTable() -->
            </div>
          </div>

        </div>
      </div>
    </div>
  `

  _renderControls()
  _updateStockPrice()
  _updatePriceTable()
  _updateStats()
}

// ── Controls (re-rendered on each TM state change) ────────────────────────────
// Buttons use data-action attrs; clicks are caught by container delegation.

function _renderControls() {
  const ctrlEl   = document.getElementById('tw-controls')
  const travelEl = document.getElementById('tw-travel-panel')
  if (!ctrlEl) return

  const { speed, mode, historySize, histIdx, speeds, simDate, minDate } = getTimeMachineState()
  const isLive      = mode === 'live'
  const isPaused    = mode === 'paused'
  const isRewinding = mode === 'rewinding'
  const isTraveling = mode === 'traveling'
  const canBack     = histIdx === null ? historySize > 0 : histIdx > 0
  const canFwd      = histIdx !== null && histIdx < historySize - 1
  const ticksBack   = histIdx !== null ? (historySize - 1 - histIdx) : 0
  const dateLabel   = _fmtDate(simDate)
  const curVal      = _isoDate(simDate)
  const minVal      = minDate ? _isoDate(minDate) : '2000-01-01'
  // ── Traveling UI ──
  if (isTraveling) {
    ctrlEl.innerHTML = `
      <div class="flex items-center gap-3 text-sm text-accent-secondary">
        <span class="animate-pulse">&#9654;&#9654;</span>
        <span>Simulating to ${dateLabel}&hellip;</span>
        <span class="text-text-muted text-xs">${historySize} ticks recorded</span>
      </div>
    `
    if (travelEl) travelEl.innerHTML = ''
    return
  }

  // ── Live UI ──
  if (isLive) {
    ctrlEl.innerHTML = `
      <div class="flex flex-wrap items-center gap-2 text-xs">

        <div class="flex items-center gap-1.5 mr-1">
          <span class="w-2 h-2 rounded-full bg-gain animate-pulse"></span>
          <span class="font-bold text-gain">LIVE</span>
          <span class="font-mono text-text-secondary">${dateLabel}</span>
        </div>

        <div class="w-px h-4 bg-border"></div>

        <!-- Speed buttons -->
        <div class="flex items-center gap-1">
          ${speeds.map(s => {
            const active = speed === s
            return `<button
              data-action="speed" data-speed="${s}"
              class="w-9 py-1 rounded-lg border text-center transition-colors
                ${active
                  ? 'bg-accent-primary text-bg border-accent-primary font-bold cursor-default'
                  : 'border-border text-text-muted hover:text-text-primary hover:bg-surface-elevated cursor-pointer'}">
              ${s}&times;
            </button>`
          }).join('')}
        </div>

        <div class="w-px h-4 bg-border"></div>

        <!-- Pause -->
        <button data-action="pause"
          class="px-3 py-1 rounded-lg border transition-colors
            border-border text-text-secondary hover:text-text-primary hover:bg-surface-elevated cursor-pointer">
          &#9646;&#9646; Pause
        </button>

        <!-- Rewind -->
        <button data-action="rewind" ${!canBack ? 'disabled' : ''}
          class="px-3 py-1 rounded-lg border transition-colors
            ${canBack
              ? 'border-border text-text-secondary hover:text-text-primary hover:bg-surface-elevated cursor-pointer'
              : 'border-border/20 text-text-muted/30 cursor-not-allowed'}">
          &#9664;&#9664; Rewind
        </button>

        <div class="w-px h-4 bg-border ml-auto"></div>

        <!-- Travel -->
        <button data-action="toggle-travel"
          class="px-3 py-1 rounded-lg border transition-colors cursor-pointer
            ${_travelOpen
              ? 'bg-accent-secondary/15 border-accent-secondary text-accent-secondary'
              : 'border-border text-text-muted hover:text-text-primary hover:bg-surface-elevated'}">
          &#128197; Travel
        </button>
      </div>
    `
  } else {
    // ── Paused / rewinding UI ──
    ctrlEl.innerHTML = `
      <div class="flex flex-wrap items-center gap-2 text-xs">

        <div class="flex items-center gap-1.5 mr-1">
          <span class="text-text-muted">${isRewinding ? '&#9664;&#9664;' : '&#9646;&#9646;'}</span>
          <span class="font-mono text-text-secondary">${dateLabel}</span>
          ${ticksBack > 0
            ? `<span class="text-text-muted text-[10px]">(${ticksBack} tick${ticksBack !== 1 ? 's' : ''} back)</span>`
            : ''}
        </div>

        <div class="w-px h-4 bg-border"></div>

        <button data-action="step-back" ${!canBack ? 'disabled' : ''}
          class="px-3 py-1 rounded-lg border transition-colors
            ${canBack
              ? 'border-border text-text-secondary hover:bg-surface-elevated cursor-pointer'
              : 'border-border/20 text-text-muted/30 cursor-not-allowed'}">
          &#9664; Back
        </button>

        ${isRewinding
          ? `<button data-action="stop-rewind"
               class="px-3 py-1 rounded-lg border border-warning/40 bg-warning/10 text-warning
                      hover:bg-warning/20 transition-colors cursor-pointer">
               &#9646;&#9646; Stop
             </button>`
          : `<button data-action="start-rewind" ${!canBack ? 'disabled' : ''}
               class="px-3 py-1 rounded-lg border transition-colors
                 ${canBack
                   ? 'border-border text-text-secondary hover:bg-surface-elevated cursor-pointer'
                   : 'border-border/20 text-text-muted/30 cursor-not-allowed'}">
               &#9664;&#9664; Auto
             </button>`}

        <button data-action="step-fwd" ${!canFwd ? 'disabled' : ''}
          class="px-3 py-1 rounded-lg border transition-colors
            ${canFwd
              ? 'border-border text-text-secondary hover:bg-surface-elevated cursor-pointer'
              : 'border-border/20 text-text-muted/30 cursor-not-allowed'}">
          Fwd &#9654;
        </button>

        <div class="w-px h-4 bg-border"></div>

        <button data-action="live"
          class="px-3 py-1 rounded-lg bg-gain/15 border border-gain/30 text-gain font-semibold
                 hover:bg-gain/25 transition-colors cursor-pointer">
          &#9679; Live
        </button>

        <div class="w-px h-4 bg-border"></div>

        <button data-action="toggle-travel"
          class="px-3 py-1 rounded-lg border transition-colors cursor-pointer
            ${_travelOpen
              ? 'bg-accent-secondary/15 border-accent-secondary text-accent-secondary'
              : 'border-border text-text-muted hover:text-text-primary hover:bg-surface-elevated'}">
          &#128197; Travel
        </button>
      </div>
    `
  }

  // Travel panel (below controls)
  if (travelEl) {
    travelEl.innerHTML = _travelOpen ? `
      <div class="border-t border-border px-4 py-3 flex flex-wrap items-center gap-3 text-xs">
        <span class="text-text-muted">Jump to date:</span>
        <input id="tw-date-input" type="date" value="${curVal}" min="${minVal}"
          class="bg-surface-elevated border border-border rounded-lg px-2.5 py-1.5 text-sm text-text-primary
                 outline-none focus:border-accent-primary transition-colors cursor-pointer" />
        <button data-action="travel-go"
          class="px-4 py-1.5 rounded-lg bg-accent-primary text-bg font-bold
                 hover:bg-accent-primary/90 transition-colors cursor-pointer">
          Go &#8594;
        </button>
        <span class="text-text-muted text-[10px]">
          Past dates restore from snapshot history &middot; Future dates simulate forward
          ${FINNHUB_API_KEY ? '&middot; Real prices for present' : '&middot; All prices are simulated'}
        </span>
        ${_travelError ? `<span class="text-loss w-full">${_travelError}</span>` : ''}
      </div>
    ` : ''
  }
}

// ── Current stock price display ───────────────────────────────────────────────

function _updateStockPrice() {
  const el = document.getElementById('tw-stock-price')
  if (!el) return
  const { price, prev } = getPrice(_selectedSym)
  const delta    = price - prev
  const deltaPct = prev ? (delta / prev) * 100 : 0
  const up       = delta >= 0
  el.innerHTML = `
    <span class="font-mono font-bold text-text-primary text-lg leading-none">${pc(price)}</span>
    <span class="text-sm font-bold ${up ? 'text-gain' : 'text-loss'}">
      ${up ? '▲' : '▼'} ${up ? '+' : ''}${deltaPct.toFixed(2)}%
    </span>
    <span class="text-xs text-text-muted">${up ? '+' : ''}${pc(delta)} this tick</span>
  `
}

// ── Live price table (all stocks, tick-to-tick delta) ─────────────────────────

function _updatePriceTable() {
  const el = document.getElementById('tw-price-table')
  if (!el) return
  el.innerHTML = STOCKS.map(s => {
    const { price, prev } = getPrice(s.symbol)
    const delta    = price - prev
    const deltaPct = prev ? (delta / prev) * 100 : 0
    const up       = delta >= 0
    const sel      = s.symbol === _selectedSym
    return `
      <div class="flex items-center justify-between px-4 py-1.5 border-l-2
        ${sel
          ? 'bg-accent-primary/8 border-accent-primary'
          : up
            ? 'bg-gain/8 border-gain/50'
            : 'bg-loss/8 border-loss/50'}">
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold text-text-primary w-12 shrink-0">${s.symbol}</span>
          <span class="text-[10px] text-text-muted truncate max-w-[72px] hidden sm:block">${s.name.split(' ')[0]}</span>
        </div>
        <div class="text-right shrink-0">
          <div class="text-xs font-mono font-semibold text-text-primary">${pc(price)}</div>
          <div class="text-[10px] font-bold ${up ? 'text-gain' : 'text-loss'}">
            ${up ? '▲ +' : '▼ '}${deltaPct.toFixed(2)}%
          </div>
        </div>
      </div>
    `
  }).join('')
}

// ── Stats card ────────────────────────────────────────────────────────────────

function _updateStats() {
  const el = document.getElementById('tw-stats')
  if (!el) return
  const { speed, mode, historySize } = getTimeMachineState()
  const hist     = getHistory()
  const last     = hist[hist.length - 1]
  const first    = hist[0]
  const nw       = last?.netWorth  ?? 10000
  const nwStart  = first?.netWorth ?? 10000
  const nwChg    = nw - nwStart
  const nwChgPct = nwStart ? (nwChg / nwStart) * 100 : 0
  const up       = nwChg >= 0
  el.innerHTML = `
    <div>
      <div class="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">Net Worth</div>
      <div class="font-mono font-bold text-text-primary text-sm">${pc(nw)}</div>
    </div>
    <div>
      <div class="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">Return</div>
      <div class="font-mono font-bold text-sm ${up ? 'text-gain' : 'text-loss'}">
        ${up ? '+' : ''}${nwChgPct.toFixed(2)}%
      </div>
    </div>
    <div>
      <div class="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">Speed</div>
      <div class="font-mono font-bold text-accent-primary text-sm">
        ${mode === 'live' ? speed + '&times;' : mode.charAt(0).toUpperCase() + mode.slice(1)}
      </div>
    </div>
    <div>
      <div class="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">Ticks</div>
      <div class="font-mono font-bold text-text-primary text-sm">${historySize}</div>
    </div>
  `
}

// ── Stock price history chart ─────────────────────────────────────────────────

function _initChart() {
  const canvas = document.getElementById('tw-chart')
  if (!canvas) return

  const initPrice = getPrice(_selectedSym).price

  _chart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: ['Now'],
      datasets: [{
        label: _selectedSym,
        data: [initPrice],
        borderColor: '#00D4AA',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        fill: true,
        backgroundColor: 'rgba(0,212,170,0.07)',
        tension: 0.3,
        segment: {
          borderColor: ctx => ctx.p1.parsed.y >= ctx.p0.parsed.y ? '#00D4AA' : '#EF4444',
        },
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${_selectedSym}: ${pc(ctx.raw)}`,
          },
          backgroundColor: '#111827',
          borderColor: '#1F2937',
          borderWidth: 1,
          titleColor: '#9CA3AF',
          bodyColor: '#F9FAFB',
          padding: 10,
        },
      },
      scales: {
        x: {
          ticks: { color: '#6B7280', maxTicksLimit: 6, maxRotation: 0, font: { size: 10 } },
          grid:  { color: 'rgba(31,41,55,0.4)' },
        },
        y: {
          ticks:    { color: '#6B7280', callback: v => pc(v), font: { size: 10 } },
          grid:     { color: 'rgba(31,41,55,0.4)' },
          position: 'right',
        },
      },
    },
  })
}

function _updateChart() {
  if (!_chart) return
  const hist = getHistory()
  if (!hist.length) return

  // Extract this stock's price from each snapshot
  const points = hist
    .map(h => ({ date: h.simDate, price: h.prices?.[_selectedSym]?.price ?? null }))
    .filter(p => p.price !== null)

  if (!points.length) return

  const prev = points.length >= 2 ? points[points.length - 2].price : points[0].price
  const last = points[points.length - 1].price
  const up   = last >= prev  // color fill based on most recent tick direction

  _chart.data.labels              = points.map(p => _fmtDate(p.date))
  _chart.data.datasets[0].data    = points.map(p => p.price)
  _chart.data.datasets[0].label   = _selectedSym
  _chart.data.datasets[0].backgroundColor = up ? 'rgba(0,212,170,0.07)' : 'rgba(239,68,68,0.07)'
  _chart.update('none')
}

// ── Event delegation ──────────────────────────────────────────────────────────

function _handleClick(e) {
  const btn = e.target.closest('[data-action]')
  if (!btn || btn.disabled) return
  const { action, speed } = btn.dataset
  switch (action) {
    case 'speed':         setSpeed(Number(speed)); break
    case 'pause':         pauseTime();             break
    case 'rewind':        startRewind();           break
    case 'stop-rewind':   stopRewind();            break
    case 'start-rewind':  startRewind();           break
    case 'step-back':     stepBack();              break
    case 'step-fwd':      stepForward();           break
    case 'live':          returnToLive();          break
    case 'toggle-travel': _toggleTravel();         break
    case 'travel-go':     _doTravel();             break
  }
}

function _handleKey(e) {
  if (e.key === 'Enter' && e.target.id === 'tw-date-input') _doTravel()
}

function _handleChange(e) {
  if (e.target.id === 'tw-sym') {
    _selectedSym = e.target.value
    _updateChart()
    _updateStockPrice()
    _updatePriceTable()
  }
}

// ── Travel ────────────────────────────────────────────────────────────────────

function _toggleTravel() {
  _travelOpen  = !_travelOpen
  _travelError = ''
  _renderControls()
}

async function _doTravel() {
  const input = document.getElementById('tw-date-input')
  if (!input?.value) return
  const savedVal = input.value
  const [y, m, d] = savedVal.split('-').map(Number)
  _travelError = ''
  _renderControls()
  // Restore input after re-render wipes it
  const inp = document.getElementById('tw-date-input')
  if (inp) inp.value = savedVal

  const err = await travelToDate(y, m, d)
  if (err) {
    _travelError = err
    _renderControls()
    const inp2 = document.getElementById('tw-date-input')
    if (inp2) inp2.value = savedVal
  }
}
