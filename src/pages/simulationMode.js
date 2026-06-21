// simulationMode.js — Time Warp page (candlestick redesign)
import Chart from 'chart.js/auto'
import { pc } from '../utils/format.js'
import { getPrice, portfolioValue, getAllPrices, enablePriceSimulation, disablePriceSimulation } from '../api/prices.js'
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
  getDisplayDate,
} from '../lib/timeMachine.js'
import { getState } from '../state/store.js'

let container      = null
let _sub           = null
let _pricesHandler = null
let _chart         = null
let _volChart      = null
let _selectedSym   = 'AAPL'
let _rafPending    = false
let _liveHistory   = []   // [{label, price}]
let _travelError   = ''
let _aiPanelOpen   = false

// Calendar picker state
let _calTargetId  = null   // 'sim-start-date' | 'sim-end-date' | null

// Time warp summary state
let _warpSnap = null   // { netWorth, date, txCount, dividends } captured before travel
let _calViewYear  = new Date().getFullYear()
let _calViewMonth = new Date().getMonth()

// ── Mount / unmount ───────────────────────────────────────────────────────────

export function mountSimulationMode(el) {
  enablePriceSimulation()
  container    = el
  _rafPending  = false
  _liveHistory = []
  _travelError = ''

  _renderPage()
  _initCharts()

  container.addEventListener('click',   _handleClick)
  container.addEventListener('change',  _handleChange)
  container.addEventListener('keydown', _handleKey)
  container.addEventListener('input',   _handleInput)
  container.addEventListener('focusin', _handleFocusIn)
  document.addEventListener('click',    _handleOutsideClick)

  _sub = subscribeTimeMachine(_scheduleUpdate)
  _pricesHandler = () => _scheduleUpdate()
  window.addEventListener('prices-updated', _pricesHandler)
}

export function unmountSimulationMode() {
  disablePriceSimulation()
  _sub?.()
  _sub = null
  if (_pricesHandler) { window.removeEventListener('prices-updated', _pricesHandler); _pricesHandler = null }
  document.removeEventListener('click', _handleOutsideClick)
  if (_chart) { _chart.destroy(); _chart = null }
  _calTargetId = null
  _warpSnap    = null
  document.getElementById('warp-summary')?.remove()
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
    _renderAIPrediction()
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
        <!-- Stock search -->
        <div class="flex flex-col gap-1 relative">
          <span class="text-[10px] font-medium text-text-muted uppercase tracking-widest">Stock</span>
          <div class="relative">
            <input id="sim-sym-search" type="text" autocomplete="off"
              value="${_selectedSym} — ${STOCKS.find(s => s.symbol === _selectedSym)?.name ?? ''}"
              placeholder="Search symbol or name…"
              class="bg-surface-elevated border border-border rounded-xl px-3 py-2 text-sm text-text-primary
                     outline-none focus:border-accent-primary transition-colors cursor-pointer min-w-[220px] pr-8" />
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-xs pointer-events-none">▾</span>
          </div>
          <div id="sim-sym-dropdown"
            class="hidden absolute top-full left-0 mt-1 z-50 bg-surface border border-border rounded-xl
                   shadow-xl overflow-y-auto max-h-56 min-w-[220px]">
            ${STOCKS.map(s => `
              <button data-sym="${s.symbol}" class="sym-opt w-full text-left px-3 py-2 text-sm hover:bg-surface-elevated
                flex items-center gap-2 transition-colors ${s.symbol === _selectedSym ? 'text-accent-primary font-semibold' : 'text-text-primary'}">
                <span class="font-mono font-bold w-14 shrink-0">${s.symbol}</span>
                <span class="text-text-muted text-xs truncate">${s.name}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Start date (editable) -->
        <div class="flex flex-col gap-1">
          <span class="text-[10px] font-medium text-text-muted uppercase tracking-widest">Start Date</span>
          <div class="relative flex items-center">
            <input id="sim-start-date" type="text" placeholder="YYYY-MM-DD"
              class="bg-surface-elevated border border-border rounded-xl pl-3 pr-9 py-2 text-sm text-text-primary
                     outline-none focus:border-accent-primary transition-colors min-w-[155px] font-mono" />
            <button data-action="open-cal" data-cal-for="sim-start-date"
              class="absolute right-2 text-text-muted hover:text-accent-primary transition-colors cursor-pointer text-base leading-none"
              title="Open calendar">&#128197;</button>
          </div>
        </div>

        <!-- End date / travel target -->
        <div class="flex flex-col gap-1">
          <span class="text-[10px] font-medium text-text-muted uppercase tracking-widest">End Date</span>
          <div class="relative flex items-center">
            <input id="sim-end-date" type="text" placeholder="YYYY-MM-DD"
              class="bg-surface-elevated border border-border rounded-xl pl-3 pr-9 py-2 text-sm text-text-primary
                     outline-none focus:border-accent-secondary transition-colors min-w-[155px] font-mono" />
            <button data-action="open-cal" data-cal-for="sim-end-date"
              class="absolute right-2 text-text-muted hover:text-accent-secondary transition-colors cursor-pointer text-base leading-none"
              title="Open calendar">&#128197;</button>
          </div>
        </div>

        <!-- Calendar popup (shared, floats near active input) -->
        <div id="sim-calendar" class="hidden fixed z-[200] bg-surface border border-border rounded-2xl shadow-2xl p-3 w-64 select-none"></div>

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

        <!-- AI Prediction button row -->
        <div class="px-5 py-3 border-t border-border flex items-center justify-between">
          <span class="text-xs text-text-muted">Get a simulated AI forecast for the next price move</span>
          <button data-action="toggle-ai"
            class="px-4 py-1.5 rounded-lg text-xs font-bold border transition-colors
              ${_aiPanelOpen ? 'bg-accent-primary text-bg border-accent-primary' : 'bg-surface-elevated border-border text-accent-primary hover:bg-accent-primary/10'}">
            ${_aiPanelOpen ? 'Hide Prediction' : 'Get AI Prediction'}
          </button>
        </div>
      </div>

      <!-- Travel error -->
      <div id="sim-travel-error" class="hidden text-loss text-sm px-1"></div>

      <!-- AI Prediction panel (hidden by default) -->
      <div id="sim-ai-panel" class="${_aiPanelOpen ? '' : 'hidden'} bg-surface border border-border rounded-2xl overflow-hidden">
        <!-- populated by _renderAIPrediction() -->
      </div>

    </div>
  `

  _renderHeader()
  _renderControls()
  _renderAIPrediction()
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

  // Start date input
  const startInput = document.getElementById('sim-start-date')
  if (startInput && !startInput.value) {
    startInput.value = _isoDate(minDate ?? simDate)
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

  // Start / Stop button
  if (isPaused) {
    stopBtn.innerHTML = `
      <button data-action="live"
        class="px-4 h-10 rounded-xl bg-gain/15 border border-gain/40 text-gain flex items-center gap-1.5
               hover:bg-gain/25 transition-colors cursor-pointer text-sm font-bold" title="Start simulation">
        &#9654; Start
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
  // Stock option in dropdown
  const opt = e.target.closest('.sym-opt')
  if (opt) {
    _selectSym(opt.dataset.sym)
    return
  }
  // Action buttons
  const btn = e.target.closest('[data-action]')
  if (!btn || btn.disabled) return
  const { action, speed } = btn.dataset
  switch (action) {
    case 'speed':      setSpeed(Number(speed)); break
    case 'pause':      pauseTime();             break
    case 'live':       returnToLive();          break
    case 'step-back':  stepBack();              break
    case 'step-fwd':   stepForward();           break
    case 'travel-go':  _doTravel();                  break
    case 'toggle-ai':  _toggleAI();                  break
    case 'open-cal':   _openCal(btn.dataset.calFor, btn); break
  }

  // Calendar navigation / date pick
  const calAction = e.target.closest('[data-cal-action]')?.dataset.calAction
  if (calAction === 'prev') { _calViewMonth--; if (_calViewMonth < 0) { _calViewMonth = 11; _calViewYear-- }; _renderCalPopup(); return }
  if (calAction === 'next') { _calViewMonth++; if (_calViewMonth > 11) { _calViewMonth = 0;  _calViewYear++ }; _renderCalPopup(); return }

  const calDate = e.target.closest('[data-cal-date]')?.dataset.calDate
  if (calDate && _calTargetId) {
    const input = document.getElementById(_calTargetId)
    if (input) { input.value = calDate; input.dispatchEvent(new Event('change')) }
    _closeCal()
    return
  }
}

function _handleKey(e) {
  if (e.key === 'Enter' && e.target.id === 'sim-end-date')   _doTravel()
  if (e.key === 'Enter' && e.target.id === 'sim-start-date') _doTravel()
  if (e.key === 'Escape' && e.target.id === 'sim-sym-search') _closeDropdown()
}

function _handleChange(e) { /* select removed — handled by _handleInput */ }

function _handleInput(e) {
  if (e.target.id !== 'sim-sym-search') return
  const q   = e.target.value.toLowerCase()
  const dd  = document.getElementById('sim-sym-dropdown')
  if (!dd) return
  dd.classList.remove('hidden')
  dd.querySelectorAll('.sym-opt').forEach(btn => {
    const sym  = btn.dataset.sym.toLowerCase()
    const name = btn.querySelector('.text-text-muted')?.textContent.toLowerCase() ?? ''
    btn.classList.toggle('hidden', !(sym.includes(q) || name.includes(q)))
  })
}

function _handleFocusIn(e) {
  if (e.target.id === 'sim-sym-search') {
    const dd = document.getElementById('sim-sym-dropdown')
    dd?.classList.remove('hidden')
    e.target.select()
  }
}

function _handleOutsideClick(e) {
  if (!container) return
  const search = document.getElementById('sim-sym-search')
  const dd     = document.getElementById('sim-sym-dropdown')
  if (search && !search.contains(e.target) && dd && !dd.contains(e.target)) {
    _closeDropdown()
  }

  // Close calendar if click is outside it and outside any open-cal button
  const cal = document.getElementById('sim-calendar')
  if (cal && !cal.classList.contains('hidden') && _calTargetId) {
    const input   = document.getElementById(_calTargetId)
    const trigger = container?.querySelector(`[data-cal-for="${_calTargetId}"]`)
    if (!cal.contains(e.target) && !trigger?.contains(e.target) && !input?.contains(e.target)) {
      _closeCal()
    }
  }
}

function _closeDropdown() {
  const dd = document.getElementById('sim-sym-dropdown')
  dd?.classList.add('hidden')
  const search = document.getElementById('sim-sym-search')
  if (search) {
    const stock = STOCKS.find(s => s.symbol === _selectedSym)
    search.value = `${_selectedSym} — ${stock?.name ?? ''}`
  }
}

function _selectSym(sym) {
  _selectedSym = sym
  _liveHistory = []
  _closeDropdown()
  _renderHeader()
  _updateCharts()
}

function _toggleAI() {
  _aiPanelOpen = !_aiPanelOpen
  const panel = document.getElementById('sim-ai-panel')
  const btn   = document.querySelector('[data-action="toggle-ai"]')
  if (panel) panel.classList.toggle('hidden', !_aiPanelOpen)
  if (btn) {
    btn.textContent = _aiPanelOpen ? 'Hide Prediction' : 'Get AI Prediction'
    btn.classList.toggle('bg-accent-primary', _aiPanelOpen)
    btn.classList.toggle('text-bg', _aiPanelOpen)
    btn.classList.toggle('border-accent-primary', _aiPanelOpen)
    btn.classList.toggle('bg-surface-elevated', !_aiPanelOpen)
    btn.classList.toggle('text-accent-primary', !_aiPanelOpen)
    btn.classList.toggle('border-border', !_aiPanelOpen)
  }
  if (_aiPanelOpen) _renderAIPrediction()
}

// ── AI Prediction ─────────────────────────────────────────────────────────────

function _aiHash(s, n) {
  let h = 0x811c9dc5
  const key = `${s}:${n}:${Math.floor(Date.now() / 60000)}`
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h / 0xFFFFFFFF
}

function _computeAI(sym, history) {
  const stock     = getStock(sym)
  const risk      = stock?.risk ?? 'Medium'
  const prices    = history.map(h => h.price)
  const n         = prices.length

  // Trend from recent slope
  let momentum = 0
  if (n >= 5) {
    const slice = prices.slice(-10)
    const rises = slice.filter((p, i) => i > 0 && p > slice[i - 1]).length
    momentum = (rises / (slice.length - 1)) - 0.5  // -0.5 to +0.5
  }

  // Volatility (std dev relative to mean)
  let volatility = 0
  if (n >= 3) {
    const mean = prices.reduce((s, v) => s + v, 0) / prices.length
    const variance = prices.reduce((s, v) => s + (v - mean) ** 2, 0) / prices.length
    volatility = Math.sqrt(variance) / mean
  }

  // Combine signals
  const seed = _aiHash(sym, 'dir')
  const noise = (seed - 0.5) * 0.15
  const score = momentum + noise

  const direction = score > 0.05 ? 'UP' : score < -0.05 ? 'DOWN' : 'SIDEWAYS'

  // Confidence based on strength of signal + volatility penalty
  const rawConf = Math.min(0.95, Math.max(0.35, 0.55 + Math.abs(score) * 2 - volatility * 0.8))
  const confidence = Math.round(rawConf * 100)

  // Target price range
  const currentPrice = n > 0 ? prices[n - 1] : (getPrice(sym).price)
  const riskMultiplier = risk === 'High' ? 0.07 : risk === 'Low' ? 0.03 : 0.05
  const targetMult = direction === 'UP' ? 1 + riskMultiplier : direction === 'DOWN' ? 1 - riskMultiplier : 1 + riskMultiplier * 0.3
  const targetPrice = currentPrice * targetMult

  // Support / resistance (rough estimate)
  const minP = n > 3 ? Math.min(...prices.slice(-20)) : currentPrice * 0.95
  const maxP = n > 3 ? Math.max(...prices.slice(-20)) : currentPrice * 1.05

  // Key factors
  const factors = []
  if (momentum > 0.1)   factors.push({ text: 'Strong upward price momentum over recent sessions', pos: true })
  else if (momentum > 0) factors.push({ text: 'Mild bullish momentum with above-average up days', pos: true })
  else if (momentum < -0.1) factors.push({ text: 'Persistent selling pressure across recent ticks', pos: false })
  else if (momentum < 0) factors.push({ text: 'Slight bearish drift — sellers outnumber buyers recently', pos: false })
  else factors.push({ text: 'Price action is consolidating in a tight range', pos: null })

  if (volatility > 0.03) factors.push({ text: `High volatility (${(volatility * 100).toFixed(1)}%) increases risk on both sides`, pos: null })
  else if (volatility > 0.01) factors.push({ text: `Moderate volatility — price swings are manageable`, pos: true })
  else factors.push({ text: `Low volatility — stable price environment`, pos: true })

  if (risk === 'High')        factors.push({ text: `${sym} carries High risk — larger moves are common`, pos: false })
  else if (risk === 'Low')    factors.push({ text: `${sym} is a Low risk stock — suitable for conservative positions`, pos: true })
  else                        factors.push({ text: `Medium risk profile — balanced opportunity and downside`, pos: null })

  const extraSeed = _aiHash(sym, 'factor4')
  const extraFactors = [
    { text: 'Institutional accumulation detected in recent volume patterns', pos: true },
    { text: 'Sector rotation favoring this sector in the current macro environment', pos: true },
    { text: 'RSI approaching overbought territory — potential pullback ahead', pos: false },
    { text: 'Moving average crossover suggests trend continuation', pos: true },
    { text: 'Earnings catalyst expected — options market pricing elevated IV', pos: null },
    { text: 'Macro headwinds from rising rates may compress valuation multiples', pos: false },
    { text: 'Analyst consensus revised upward across three major brokerages', pos: true },
    { text: 'Short interest declining — short squeeze potential increasing', pos: true },
  ]
  factors.push(extraFactors[Math.floor(extraSeed * extraFactors.length)])

  // Summary
  const summaries = {
    UP: [
      `${sym} is showing positive momentum backed by technical signals. The model targets ${pc(targetPrice)} in the near term, with key support at ${pc(minP)}. Risk-adjusted positioning is recommended given current ${risk.toLowerCase()} risk.`,
      `Bullish case for ${sym} remains intact. Price action suggests continued strength, with a model target of ${pc(targetPrice)}. Stop-loss levels near ${pc(minP)} offer risk management.`,
    ],
    DOWN: [
      `${sym} is exhibiting weakness with downward pressure building. The model projects a near-term move toward ${pc(targetPrice)}. Resistance at ${pc(maxP)} could cap any short-term bounce.`,
      `Bearish signals dominate the ${sym} chart. The model sees risk of a move to ${pc(targetPrice)} unless the price reclaims ${pc(maxP)}.`,
    ],
    SIDEWAYS: [
      `${sym} is in a consolidation phase. The model expects a range-bound move between ${pc(minP)} and ${pc(maxP)}. A breakout in either direction could trigger a significant move.`,
      `No clear trend for ${sym} — the model favors patience. Watch for a decisive break above ${pc(maxP)} or below ${pc(minP)} for a directional trade.`,
    ],
  }
  const summaryList = summaries[direction]
  const summary = summaryList[Math.floor(_aiHash(sym, 'sum') * summaryList.length)]

  return { direction, confidence, targetPrice, minP, maxP, factors, summary, volatility, risk }
}

function _renderAIPrediction() {
  if (!_aiPanelOpen) return
  const el = document.getElementById('sim-ai-panel')
  if (!el) return
  const ai = _computeAI(_selectedSym, _liveHistory)

  const dirColor = ai.direction === 'UP'
    ? 'text-gain border-gain/30 bg-gain/10'
    : ai.direction === 'DOWN'
      ? 'text-loss border-loss/30 bg-loss/10'
      : 'text-warning border-warning/30 bg-warning/10'
  const dirArrow = ai.direction === 'UP' ? '▲' : ai.direction === 'DOWN' ? '▼' : '▶'

  const confColor = ai.confidence >= 75 ? 'bg-gain' : ai.confidence >= 55 ? 'bg-warning' : 'bg-loss'

  el.innerHTML = `
    <div class="px-5 py-4 border-b border-border flex items-center gap-2">
      <span class="text-xs font-bold px-2 py-0.5 rounded-md bg-accent-primary/10 text-accent-primary uppercase tracking-wide">AI</span>
      <h2 class="font-semibold text-text-primary">Price Prediction — ${_selectedSym}</h2>
      <span class="ml-auto text-[10px] text-text-muted">Updates with each price tick</span>
    </div>

    <div class="p-5 grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- Left: Direction + Confidence -->
      <div class="flex flex-col gap-4">

        <!-- Direction -->
        <div class="flex flex-col items-start gap-1">
          <span class="text-[10px] text-text-muted uppercase tracking-wide">Direction</span>
          <div class="flex items-center gap-2">
            <span class="text-3xl font-bold font-mono px-4 py-2 rounded-xl border ${dirColor}">
              ${dirArrow} ${ai.direction}
            </span>
          </div>
        </div>

        <!-- Confidence -->
        <div class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-text-muted uppercase tracking-wide">Confidence</span>
            <span class="text-sm font-bold text-text-primary">${ai.confidence}%</span>
          </div>
          <div class="w-full h-2.5 bg-surface-elevated rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all duration-700 ${confColor}" style="width:${ai.confidence}%"></div>
          </div>
          <span class="text-[10px] text-text-muted">${ai.confidence >= 75 ? 'High conviction' : ai.confidence >= 55 ? 'Moderate conviction' : 'Low conviction — use caution'}</span>
        </div>

        <!-- Target + Range -->
        <div class="bg-surface-elevated border border-border rounded-xl p-3 space-y-2">
          <div class="flex justify-between text-xs">
            <span class="text-text-muted">Target Price</span>
            <span class="font-mono font-bold text-text-primary">${pc(ai.targetPrice)}</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-text-muted">Support</span>
            <span class="font-mono text-gain">${pc(ai.minP)}</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-text-muted">Resistance</span>
            <span class="font-mono text-loss">${pc(ai.maxP)}</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-text-muted">Volatility</span>
            <span class="font-mono text-text-secondary">${(ai.volatility * 100).toFixed(2)}%</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-text-muted">Risk Level</span>
            <span class="font-mono ${ai.risk === 'High' ? 'text-loss' : ai.risk === 'Low' ? 'text-gain' : 'text-warning'}">${ai.risk}</span>
          </div>
        </div>
      </div>

      <!-- Middle: Key Factors -->
      <div class="flex flex-col gap-3">
        <span class="text-[10px] text-text-muted uppercase tracking-wide">Key Factors</span>
        <div class="space-y-2">
          ${ai.factors.map((f, i) => {
            const bullet = f.pos === true ? 'text-gain' : f.pos === false ? 'text-loss' : 'text-warning'
            const sign   = f.pos === true ? '+' : f.pos === false ? '–' : '~'
            return `
              <div class="flex items-start gap-2 text-sm">
                <span class="shrink-0 font-bold text-xs mt-0.5 w-4 ${bullet}">${sign}</span>
                <span class="text-text-secondary leading-snug">${f.text}</span>
              </div>`
          }).join('')}
        </div>
      </div>

      <!-- Right: Summary -->
      <div class="flex flex-col gap-3">
        <span class="text-[10px] text-text-muted uppercase tracking-wide">AI Summary</span>
        <p class="text-sm text-text-secondary leading-relaxed">${ai.summary}</p>
        <div class="mt-auto pt-3 border-t border-border">
          <p class="text-[10px] text-text-muted leading-relaxed">
            This is a simulated AI model for educational purposes only. It is not financial advice.
            Real investment decisions require comprehensive research.
          </p>
        </div>
      </div>

    </div>
  `
}

// ── Calendar popup ────────────────────────────────────────────────────────────

function _openCal(inputId, triggerBtn) {
  const input = document.getElementById(inputId)
  const cal   = document.getElementById('sim-calendar')
  if (!input || !cal) return

  // If same calendar is already open, toggle it closed
  if (_calTargetId === inputId && !cal.classList.contains('hidden')) {
    _closeCal(); return
  }

  _calTargetId = inputId

  // Seed month/year from input value if valid, else today
  const parsed = input.value ? new Date(input.value + 'T00:00:00') : null
  if (parsed && !isNaN(parsed)) {
    _calViewYear  = parsed.getFullYear()
    _calViewMonth = parsed.getMonth()
  } else {
    const today   = new Date()
    _calViewYear  = today.getFullYear()
    _calViewMonth = today.getMonth()
  }

  _renderCalPopup()
  cal.classList.remove('hidden')

  // Position the popup below the trigger button
  const rect = triggerBtn.getBoundingClientRect()
  const popupW = 256
  let left = rect.left
  let top  = rect.bottom + 6
  // Keep within viewport
  if (left + popupW > window.innerWidth - 8) left = window.innerWidth - popupW - 8
  if (top + 280 > window.innerHeight - 8)    top  = rect.top - 280 - 6
  cal.style.left = left + 'px'
  cal.style.top  = top  + 'px'
}

function _closeCal() {
  const cal = document.getElementById('sim-calendar')
  cal?.classList.add('hidden')
  _calTargetId = null
}

function _renderCalPopup() {
  const cal = document.getElementById('sim-calendar')
  if (!cal) return

  const selectedVal = _calTargetId ? document.getElementById(_calTargetId)?.value : ''
  const today = new Date(); today.setHours(0,0,0,0)

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa']

  const firstDay = new Date(_calViewYear, _calViewMonth, 1).getDay()
  const daysInMonth = new Date(_calViewYear, _calViewMonth + 1, 0).getDate()

  // Build date cells
  let cells = ''
  // Empty leading cells
  for (let i = 0; i < firstDay; i++) cells += `<div></div>`
  for (let d = 1; d <= daysInMonth; d++) {
    const iso  = `${_calViewYear}-${String(_calViewMonth + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    const thisDate = new Date(_calViewYear, _calViewMonth, d)
    const isToday    = thisDate.getTime() === today.getTime()
    const isSelected = iso === selectedVal

    let cls = 'flex items-center justify-center rounded-lg text-xs h-8 cursor-pointer transition-colors '
    if (isSelected) cls += 'bg-accent-secondary text-white font-bold'
    else if (isToday) cls += 'border border-accent-primary text-accent-primary font-semibold hover:bg-accent-primary/10'
    else cls += 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'

    cells += `<div class="${cls}" data-cal-date="${iso}">${d}</div>`
  }

  cal.innerHTML = `
    <div class="flex items-center justify-between mb-2 px-1">
      <button data-cal-action="prev"
        class="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:bg-surface-elevated hover:text-text-primary transition-colors text-lg leading-none cursor-pointer">
        &#8249;
      </button>
      <span class="text-sm font-semibold text-text-primary">
        ${MONTHS[_calViewMonth]} ${_calViewYear}
      </span>
      <button data-cal-action="next"
        class="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:bg-surface-elevated hover:text-text-primary transition-colors text-lg leading-none cursor-pointer">
        &#8250;
      </button>
    </div>
    <div class="grid grid-cols-7 gap-0.5 mb-1">
      ${DAYS.map(d => `<div class="text-center text-[10px] font-medium text-text-muted h-6 flex items-center justify-center">${d}</div>`).join('')}
    </div>
    <div class="grid grid-cols-7 gap-0.5">
      ${cells}
    </div>
    <div class="mt-2 pt-2 border-t border-border flex justify-end">
      <button data-cal-date="${today.toISOString().slice(0,10)}"
        class="text-[10px] text-accent-primary hover:underline cursor-pointer px-1">Today</button>
    </div>
  `
}

// ── Travel ────────────────────────────────────────────────────────────────────

async function _doTravel() {
  const input = document.getElementById('sim-end-date')
  if (!input?.value) return
  const [y, m, d] = input.value.split('-').map(Number)
  const errEl = document.getElementById('sim-travel-error')
  if (errEl) { errEl.textContent = ''; errEl.classList.add('hidden') }

  // Snapshot state before travel so we can diff it after
  const state0 = getState()
  _warpSnap = {
    netWorth:  state0.user.balance + portfolioValue(state0.holdings),
    date:      new Date(getDisplayDate()),
    txCount:   state0.transactions.length,
    dividends: state0.transactions.filter(t => t.type === 'dividend').reduce((s, t) => s + (t.amount ?? 0), 0),
  }

  const err = await travelToDate(y, m, d, { pauseOnArrival: true })
  if (err && errEl) {
    errEl.textContent = err
    errEl.classList.remove('hidden')
    _warpSnap = null
    return
  }

  _showWarpSummary(new Date(y, m - 1, d))
}

function _showWarpSummary(endDate) {
  if (!_warpSnap) return
  const existing = document.getElementById('warp-summary')
  if (existing) existing.remove()

  const state     = getState()
  const endWorth  = state.user.balance + portfolioValue(state.holdings)
  const gain      = endWorth - _warpSnap.netWorth
  const gainPct   = _warpSnap.netWorth > 0 ? (gain / _warpSnap.netWorth) * 100 : 0
  const gainCls   = gain >= 0 ? 'text-gain' : 'text-loss'
  const newTrades = state.transactions.length - _warpSnap.txCount
  const newDivs   = state.transactions.filter(t => t.type === 'dividend').reduce((s, t) => s + (t.amount ?? 0), 0) - _warpSnap.dividends

  const fmt = (d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

  // Holdings performance
  const prices   = getAllPrices()
  const holdings = Object.entries(state.holdings)
  const holdRows = holdings.length ? holdings.map(([sym, h]) => {
    const p    = prices.get(sym)
    const pnl  = p ? (p.price - h.avgCost) / h.avgCost * 100 : 0
    const cls  = pnl >= 0 ? 'text-gain' : 'text-loss'
    return `<div class="flex items-center justify-between py-1.5 border-b border-border last:border-0">
      <span class="font-mono text-sm font-semibold text-text-primary">${sym}</span>
      <span class="text-xs ${cls}">${pnl >= 0 ? '+' : ''}${pnl.toFixed(1)}% on cost</span>
    </div>`
  }).join('') : `<div class="text-xs text-text-muted">No open positions</div>`

  const el = document.createElement('div')
  el.id = 'warp-summary'
  el.className = 'fixed inset-0 z-[300] flex items-center justify-center p-4'
  el.innerHTML = `
    <div class="absolute inset-0 bg-black/60" id="warp-summary-backdrop"></div>
    <div class="relative bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">

      <div class="flex items-start justify-between">
        <div>
          <div class="text-[10px] text-accent-secondary uppercase tracking-widest font-semibold mb-1">Time Warp Complete</div>
          <div class="text-lg font-bold text-text-primary">Simulation Summary</div>
          <div class="text-xs text-text-muted mt-0.5">${fmt(_warpSnap.date)} &rarr; ${fmt(endDate)}</div>
        </div>
        <button id="warp-close" class="text-text-muted hover:text-text-primary text-xl leading-none cursor-pointer">&#x2715;</button>
      </div>

      <!-- Portfolio change -->
      <div class="bg-surface-elevated rounded-xl p-4 space-y-2">
        <div class="text-xs text-text-muted uppercase tracking-wide font-medium mb-3">Portfolio Performance</div>
        <div class="flex justify-between text-sm">
          <span class="text-text-muted">Starting value</span>
          <span class="font-mono text-text-primary">${pc(_warpSnap.netWorth)}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-text-muted">Ending value</span>
          <span class="font-mono text-text-primary">${pc(endWorth)}</span>
        </div>
        <div class="flex justify-between text-sm border-t border-border pt-2 mt-2">
          <span class="text-text-muted">Net change</span>
          <span class="font-mono font-bold ${gainCls}">${gain >= 0 ? '+' : ''}${pc(gain)} (${gainPct >= 0 ? '+' : ''}${gainPct.toFixed(2)}%)</span>
        </div>
      </div>

      <!-- Holdings -->
      ${holdings.length ? `
      <div>
        <div class="text-xs text-text-muted uppercase tracking-wide font-medium mb-2">Open Positions</div>
        <div class="bg-surface-elevated rounded-xl px-4 py-2">${holdRows}</div>
      </div>` : ''}

      <!-- Stats -->
      <div class="flex gap-3">
        <div class="flex-1 bg-surface-elevated rounded-xl p-3 text-center">
          <div class="text-lg font-bold text-text-primary">${newTrades}</div>
          <div class="text-[10px] text-text-muted uppercase tracking-wide">Trades Made</div>
        </div>
        ${newDivs > 0 ? `
        <div class="flex-1 bg-surface-elevated rounded-xl p-3 text-center">
          <div class="text-lg font-bold text-gain">${pc(newDivs)}</div>
          <div class="text-[10px] text-text-muted uppercase tracking-wide">Dividends</div>
        </div>` : ''}
      </div>

      <!-- Actions -->
      <div class="flex gap-2 pt-1">
        <button id="warp-keep-trading"
          class="flex-1 py-2.5 rounded-xl bg-accent-primary text-bg text-sm font-bold hover:bg-accent-primary/90 transition-colors cursor-pointer">
          Keep Trading
        </button>
        <button id="warp-return-live"
          class="flex-1 py-2.5 rounded-xl border border-border text-text-secondary text-sm hover:bg-surface-elevated transition-colors cursor-pointer">
          Return to Live
        </button>
      </div>

    </div>
  `

  document.body.appendChild(el)

  const remove = () => el.remove()
  el.querySelector('#warp-close')?.addEventListener('click', remove)
  el.querySelector('#warp-summary-backdrop')?.addEventListener('click', remove)
  el.querySelector('#warp-keep-trading')?.addEventListener('click', remove)
  el.querySelector('#warp-return-live')?.addEventListener('click', () => { remove(); returnToLive() })
}
