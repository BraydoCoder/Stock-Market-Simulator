// simulationMode.js — Time Warp page (candlestick redesign)
import Chart from 'chart.js/auto'
import { pc } from '../utils/format.js'
import { getPrice } from '../api/prices.js'
import { STOCKS, getStock } from '../data/stocks.js'
import { FINNHUB_API_KEY } from '../config.js'
import {
  getTimeMachineState,
  subscribeTimeMachine,
  setSpeed,
  pauseTime,
  stepBack,
  stepForward,
  returnToLive,
  travelToDate,
} from '../lib/timeMachine.js'

let container      = null
let _sub           = null
let _pricesHandler = null
let _chart         = null
let _volChart      = null
let _selectedSym   = 'AAPL'
let _rafPending    = false
let _liveHistory   = []   // [{label, price}]
let _travelError   = ''

// ── Mount / unmount ───────────────────────────────────────────────────────────

export function mountSimulationMode(el) {
  container    = el
  _rafPending  = false
  _liveHistory = []
  _travelError = ''

  _renderPage()
  _initCharts()

  container.addEventListener('click',   _handleClick)
  container.addEventListener('change',  _handleChange)
  container.addEventListener('keydown', _handleKey)

  _sub = subscribeTimeMachine(_scheduleUpdate)
  _pricesHandler = () => _scheduleUpdate()
  window.addEventListener('prices-updated', _pricesHandler)
}

export function unmountSimulationMode() {
  _sub?.()
  _sub = null
  if (_pricesHandler) { window.removeEventListener('prices-updated', _pricesHandler); _pricesHandler = null }
  if (_chart) { _chart.destroy(); _chart = null }
  container = null
}

// ── Throttled update ──────────────────────────────────────────────────────────

function _scheduleUpdate() {
  if (_rafPending) return
  _rafPending = true
  requestAnimationFrame(() => {
    _rafPending = false
    const p = getPrice(_selectedSym)
    if (p.price > 0) {
      const { simDate } = getTimeMachineState()
      const label = new Date(simDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      _liveHistory.push({ label, price: p.price })
      if (_liveHistory.length > 120) _liveHistory.shift()
    }
    _renderHeader()
    _updateCharts()
    _renderControls()
  })
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function _fmtDate(d) {
  if (!d) return ''
  return d instanceof Date
    ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function _isoDate(d) {
  if (!d) return ''
  const date = d instanceof Date ? d : new Date(d)
  const y  = date.getFullYear()
  const m  = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

function _getSentiment() {
  if (_liveHistory.length < 3) return { label: 'NEUTRAL', pct: 50, bull: false }
  const recent = _liveHistory.slice(-12)
  let downs = 0
  for (let i = 1; i < recent.length; i++) {
    if (recent[i].price < recent[i - 1].price) downs++
  }
  const pct = Math.round((downs / (recent.length - 1)) * 100)
  if (pct >= 60) return { label: 'BEARISH', pct, bull: false }
  if (pct <= 40) return { label: 'BULLISH', pct: 100 - pct, bull: true }
  return { label: 'NEUTRAL', pct: 50, bull: false }
}

function _riskColor(risk) {
  if (risk === 'Low')    return 'bg-gain/15 border-gain/40 text-gain'
  if (risk === 'High')   return 'bg-loss/15 border-loss/40 text-loss'
  return 'bg-warning/15 border-warning/40 text-warning'
}

// ── Static page shell (rendered once on mount) ────────────────────────────────

function _renderPage() {
  if (!container) return
  const symOptions = STOCKS.map(s =>
    `<option value="${s.symbol}" ${s.symbol === _selectedSym ? 'selected' : ''}>${s.symbol} — ${s.name}</option>`
  ).join('')

  container.innerHTML = `
    <div class="max-w-6xl mx-auto px-4 py-6 space-y-4">

      <!-- Page header -->
      <div>
        <h1 class="text-2xl font-display font-bold text-text-primary">Simulation Mode</h1>
        <p class="text-sm text-text-muted mt-1">
          Simulate market time — speed up, pause, or jump to any date.
          ${FINNHUB_API_KEY
            ? '<span class="text-gain font-medium">&#9679; Real prices active</span>'
            : '<span class="text-accent-primary font-medium">&#9679; Mock simulation</span>'}
        </p>
      </div>

      <!-- Top controls bar -->
      <div class="bg-surface border border-border rounded-2xl px-5 py-4 flex flex-wrap items-end gap-4">
        <!-- Stock -->
        <div class="flex flex-col gap-1">
          <span class="text-[10px] font-medium text-text-muted uppercase tracking-widest">Stock</span>
          <select id="sim-sym"
            class="bg-surface-elevated border border-border rounded-xl px-3 py-2 text-sm text-text-primary
                   outline-none focus:border-accent-primary transition-colors cursor-pointer min-w-[200px]">
            ${symOptions}
          </select>
        </div>

        <!-- Start date (read-only — shows when history started) -->
        <div class="flex flex-col gap-1">
          <span class="text-[10px] font-medium text-text-muted uppercase tracking-widest">Start Date</span>
          <div id="sim-start-date"
            class="bg-surface-elevated border border-border rounded-xl px-3 py-2 text-sm text-text-primary min-w-[140px]">
            &mdash;
          </div>
        </div>

        <!-- End date / travel target -->
        <div class="flex flex-col gap-1">
          <span class="text-[10px] font-medium text-text-muted uppercase tracking-widest">End Date</span>
          <input id="sim-end-date" type="date"
            class="bg-surface-elevated border border-border rounded-xl px-3 py-2 text-sm text-text-primary
                   outline-none focus:border-accent-secondary transition-colors cursor-pointer min-w-[160px]" />
        </div>

        <!-- Go button -->
        <button data-action="travel-go"
          class="px-4 py-2 rounded-xl bg-accent-secondary text-white font-bold text-sm
                 hover:bg-accent-secondary/80 transition-colors cursor-pointer self-end">
          Go &rarr;
        </button>

        <!-- Divider -->
        <div class="flex-1"></div>

        <!-- Speed pills -->
        <div id="sim-speed-bar" class="flex items-center gap-1.5 self-end"></div>

        <!-- Stop / Live button -->
        <div id="sim-stop-btn" class="self-end"></div>
      </div>

      <!-- Chart card -->
      <div class="bg-surface border border-border rounded-2xl overflow-hidden">

        <!-- Stock info header (updates in-place) -->
        <div id="sim-header" class="px-5 py-3 border-b border-border flex items-center gap-3 flex-wrap">
          <!-- populated by _renderHeader() -->
        </div>

        <!-- Price line chart -->
        <div style="position:relative;height:340px;">
          <canvas id="sim-chart"></canvas>
        </div>
      </div>

      <!-- Travel error -->
      <div id="sim-travel-error" class="hidden text-loss text-sm px-1"></div>

    </div>
  `

  _renderHeader()
  _renderControls()
}

// ── Header (stock info, risk, AI, price) ──────────────────────────────────────

function _renderHeader() {
  const el = document.getElementById('sim-header')
  if (!el) return
  const stock = getStock(_selectedSym)
  const { price, prev } = getPrice(_selectedSym)
  const delta    = price - prev
  const deltaPct = prev ? (delta / prev) * 100 : 0
  const up       = delta >= 0
  const risk     = stock?.risk ?? 'Medium'
  const sent     = _getSentiment()

  el.innerHTML = `
    <span class="font-bold text-text-primary text-base">${_selectedSym}</span>
    <span class="text-sm text-text-muted">${stock?.name ?? ''}</span>

    <!-- Risk badge -->
    <span class="text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide ${_riskColor(risk)}">
      ${risk} Risk
    </span>

    <!-- AI sentiment badge -->
    <span class="text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide
      ${sent.bull ? 'bg-gain/10 border-gain/30 text-gain' : sent.label === 'NEUTRAL' ? 'bg-border/20 border-border text-text-muted' : 'bg-loss/10 border-loss/30 text-loss'}">
      AI &mdash; ${sent.label} ${sent.pct}%
    </span>

    <div class="ml-auto flex items-baseline gap-2">
      <span class="font-mono font-bold text-text-primary text-xl">${pc(price)}</span>
      <span class="text-sm font-bold ${up ? 'text-gain' : 'text-loss'}">
        ${up ? '▲' : '▼'} ${up ? '+' : ''}${deltaPct.toFixed(2)}%
      </span>
    </div>
  `
}

// ── Controls (speed + stop, re-rendered on TM state change) ──────────────────

function _renderControls() {
  const speedBar = document.getElementById('sim-speed-bar')
  const stopBtn  = document.getElementById('sim-stop-btn')
  const startEl  = document.getElementById('sim-start-date')
  if (!speedBar || !stopBtn) return

  const { speed, mode, speeds, simDate, minDate } = getTimeMachineState()
  const isLive   = mode === 'live'
  const isPaused = mode === 'paused' || mode === 'rewinding'

  // Start date label
  if (startEl) {
    startEl.textContent = minDate ? _fmtDate(minDate) : _fmtDate(simDate)
  }

  // End date default (one year from simDate)
  const endInput = document.getElementById('sim-end-date')
  if (endInput && !endInput.value) {
    const d = new Date(simDate)
    d.setFullYear(d.getFullYear() + 1)
    endInput.value = _isoDate(d)
  }

  // Speed pills
  speedBar.innerHTML = speeds.map(s => {
    const active = speed === s && isLive
    return `<button data-action="speed" data-speed="${s}"
      class="px-2.5 py-1 rounded-lg border text-xs transition-colors cursor-pointer
        ${active
          ? 'bg-accent-primary text-bg border-accent-primary font-bold'
          : 'border-border text-text-secondary hover:text-text-primary hover:bg-surface-elevated'}">
      ${s}&times;
    </button>`
  }).join('')

  // Stop / Resume button (big red square like the screenshot)
  if (isPaused) {
    stopBtn.innerHTML = `
      <button data-action="live"
        class="w-10 h-10 rounded-xl bg-gain/15 border border-gain/40 text-gain flex items-center justify-center
               hover:bg-gain/25 transition-colors cursor-pointer text-sm font-bold" title="Resume live">
        &#9654;
      </button>`
  } else {
    stopBtn.innerHTML = `
      <button data-action="pause"
        class="w-10 h-10 rounded-xl bg-loss flex items-center justify-center
               hover:bg-loss/80 transition-colors cursor-pointer" title="Pause simulation">
        <span class="w-3 h-3 bg-white rounded-sm"></span>
      </button>`
  }
}

// ── Chart initialisation ──────────────────────────────────────────────────────

function _initCharts() {
  const canvas = document.getElementById('sim-chart')
  if (!canvas) return

  _chart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        data: [],
        borderColor: '#00D4AA',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        fill: true,
        backgroundColor: 'rgba(0,212,170,0.06)',
        tension: 0,
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
          callbacks: { label: ctx => ` ${_selectedSym}: ${pc(ctx.raw)}` },
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
          ticks: { color: '#6B7280', maxTicksLimit: 8, maxRotation: 0, font: { size: 10 } },
          grid:  { color: 'rgba(55,65,81,0.3)' },
        },
        y: {
          position: 'right',
          ticks: { color: '#6B7280', callback: v => pc(v), font: { size: 10 } },
          grid:  { color: 'rgba(55,65,81,0.3)' },
        },
      },
    },
  })
}

// ── Chart update ──────────────────────────────────────────────────────────────

function _updateCharts() {
  if (!_chart || !_liveHistory.length) return

  const prev = _liveHistory.length >= 2
    ? _liveHistory[_liveHistory.length - 2].price
    : _liveHistory[0].price
  const last = _liveHistory[_liveHistory.length - 1].price
  const up   = last >= prev

  _chart.data.labels           = _liveHistory.map(p => p.label)
  _chart.data.datasets[0].data = _liveHistory.map(p => p.price)
  _chart.data.datasets[0].backgroundColor = up ? 'rgba(0,212,170,0.06)' : 'rgba(239,68,68,0.06)'
  _chart.update('none')
}

// ── Event delegation ──────────────────────────────────────────────────────────

function _handleClick(e) {
  const btn = e.target.closest('[data-action]')
  if (!btn || btn.disabled) return
  const { action, speed } = btn.dataset
  switch (action) {
    case 'speed':      setSpeed(Number(speed)); break
    case 'pause':      pauseTime();             break
    case 'live':       returnToLive();          break
    case 'step-back':  stepBack();              break
    case 'step-fwd':   stepForward();           break
    case 'travel-go':  _doTravel();             break
  }
}

function _handleKey(e) {
  if (e.key === 'Enter' && e.target.id === 'sim-end-date') _doTravel()
}

function _handleChange(e) {
  if (e.target.id === 'sim-sym') {
    _selectedSym = e.target.value
    _liveHistory = []
    _renderHeader()
    _updateCharts()
  }
}

// ── Travel ────────────────────────────────────────────────────────────────────

async function _doTravel() {
  const input = document.getElementById('sim-end-date')
  if (!input?.value) return
  const [y, m, d] = input.value.split('-').map(Number)
  const errEl = document.getElementById('sim-travel-error')
  if (errEl) { errEl.textContent = ''; errEl.classList.add('hidden') }

  const err = await travelToDate(y, m, d)
  if (err && errEl) {
    errEl.textContent = err
    errEl.classList.remove('hidden')
  }
}
