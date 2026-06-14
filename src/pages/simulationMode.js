// simulationMode.js — Time Warp: integrated time machine controls + net worth chart
import Chart from 'chart.js/auto'
import { pc } from '../utils/format.js'
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
  })
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function _fmtDate(d) {
  if (!d) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function _isoDate(d) {
  if (!d) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

// ── Static page shell (rendered once on mount) ────────────────────────────────

function _renderPage() {
  if (!container) return
  container.innerHTML = `
    <div class="max-w-5xl mx-auto px-4 py-6 space-y-5">

      <!-- Header -->
      <div>
        <h1 class="text-2xl font-display font-bold text-text-primary">Time Warp</h1>
        <p class="text-sm text-text-muted mt-1">Control simulated time — speed up, pause, rewind, or jump to any date.</p>
      </div>

      <!-- Controls card (re-rendered on each tick) -->
      <div id="tw-controls-wrap" class="bg-surface border border-border rounded-2xl overflow-hidden">
        <div id="tw-controls" class="px-4 py-3"></div>
        <div id="tw-travel-panel"></div>
      </div>

      <!-- Portfolio Performance chart -->
      <div class="bg-surface border border-border rounded-2xl p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold text-text-primary">Portfolio Performance</h2>
          <span class="text-xs text-text-muted">Net worth over simulated time</span>
        </div>
        <div style="position:relative;height:280px;">
          <canvas id="tw-chart"></canvas>
        </div>
      </div>

      <!-- Stats row -->
      <div id="tw-stats" class="grid grid-cols-2 sm:grid-cols-4 gap-3"></div>

    </div>
  `
  _renderControls()
  _renderStats()
}

// ── Controls (re-rendered on each TM event) ───────────────────────────────────

function _renderControls() {
  const wrap = document.getElementById('tw-controls')
  const travelWrap = document.getElementById('tw-travel-panel')
  if (!wrap) return

  const { speed, mode, historySize, histIdx, speeds, simDate, minDate } = getTimeMachineState()
  const isLive      = mode === 'live'
  const isPaused    = mode === 'paused'
  const isRewinding = mode === 'rewinding'
  const isTraveling = mode === 'traveling'
  const canBack     = histIdx === null ? historySize > 0 : histIdx > 0
  const canFwd      = histIdx !== null && histIdx < historySize - 1
  const ticksBack   = histIdx !== null ? (historySize - 1 - histIdx) : 0
  const dateLabel   = _fmtDate(simDate)
  const minVal      = minDate ? _isoDate(minDate) : '2000-01-01'
  const curVal      = _isoDate(simDate)

  if (isTraveling) {
    wrap.innerHTML = `
      <div class="flex items-center gap-3 text-sm text-accent-secondary">
        <span class="animate-pulse text-base">&#9654;&#9654;</span>
        <span>Simulating to ${dateLabel}…</span>
        <span class="text-text-muted text-xs">(${historySize} ticks recorded)</span>
      </div>
    `
    if (travelWrap) travelWrap.innerHTML = ''
    return
  }

  if (isLive) {
    wrap.innerHTML = `
      <div class="flex flex-wrap items-center gap-2">

        <!-- Live indicator + date -->
        <div class="flex items-center gap-2 mr-2">
          <span class="w-2 h-2 rounded-full bg-gain animate-pulse inline-block"></span>
          <span class="text-gain text-xs font-bold">LIVE</span>
          <span class="text-text-secondary text-xs font-mono">${dateLabel}</span>
        </div>

        <div class="w-px h-4 bg-border"></div>

        <!-- Speed -->
        <div class="flex items-center gap-1">
          ${speeds.map(s => `
            <button data-speed="${s}"
              class="tw-speed w-9 py-1 rounded-lg border text-xs text-center transition-colors cursor-pointer
                ${speed === s ? 'bg-accent-primary text-bg border-accent-primary font-bold' : 'border-border text-text-muted hover:text-text-primary hover:bg-surface-elevated'}">
              ${s}&times;
            </button>
          `).join('')}
        </div>

        <div class="w-px h-4 bg-border"></div>

        <!-- Pause + Rewind -->
        <button id="tw-pause"
          class="px-3 py-1 rounded-lg border border-border text-text-secondary text-xs hover:text-text-primary hover:bg-surface-elevated transition-colors cursor-pointer">
          &#9646;&#9646; Pause
        </button>
        <button id="tw-rewind" ${!canBack ? 'disabled' : ''}
          class="px-3 py-1 rounded-lg border text-xs transition-colors
            ${canBack ? 'border-border text-text-secondary hover:text-text-primary hover:bg-surface-elevated cursor-pointer' : 'border-border/30 text-text-muted opacity-40 cursor-not-allowed'}">
          &#9664;&#9664; Rewind
        </button>

        <div class="w-px h-4 bg-border"></div>

        <!-- Travel toggle -->
        <button id="tw-travel-btn"
          class="px-3 py-1 rounded-lg border text-xs transition-colors cursor-pointer
            ${_travelOpen ? 'bg-accent-secondary/15 border-accent-secondary text-accent-secondary' : 'border-border text-text-muted hover:text-text-primary hover:bg-surface-elevated'}">
          &#128197; Travel
        </button>

      </div>
    `
  } else {
    wrap.innerHTML = `
      <div class="flex flex-wrap items-center gap-2">

        <!-- Status + date -->
        <div class="flex items-center gap-2 mr-2">
          <span class="text-text-muted text-xs">${isRewinding ? '&#9664;&#9664;' : '&#9646;&#9646;'}</span>
          <span class="text-text-secondary text-xs font-mono">${dateLabel}</span>
          ${ticksBack > 0 ? `<span class="text-text-muted text-[10px]">(${ticksBack} tick${ticksBack !== 1 ? 's' : ''} back)</span>` : ''}
        </div>

        <div class="w-px h-4 bg-border"></div>

        <!-- Step controls -->
        <button id="tw-step-back" ${!canBack ? 'disabled' : ''}
          class="px-3 py-1 rounded-lg border text-xs transition-colors
            ${canBack ? 'border-border text-text-secondary hover:bg-surface-elevated cursor-pointer' : 'border-border/30 text-text-muted opacity-40 cursor-not-allowed'}">
          &#9664; Back
        </button>

        ${isRewinding
          ? `<button id="tw-stop-rewind"
               class="px-3 py-1 rounded-lg border border-warning/40 bg-warning/10 text-warning text-xs hover:bg-warning/20 transition-colors cursor-pointer">
               &#9646;&#9646; Stop
             </button>`
          : `<button id="tw-start-rewind" ${!canBack ? 'disabled' : ''}
               class="px-3 py-1 rounded-lg border text-xs transition-colors
                 ${canBack ? 'border-border text-text-secondary hover:bg-surface-elevated cursor-pointer' : 'border-border/30 text-text-muted opacity-40 cursor-not-allowed'}">
               &#9664;&#9664; Auto
             </button>`
        }

        <button id="tw-step-fwd" ${!canFwd ? 'disabled' : ''}
          class="px-3 py-1 rounded-lg border text-xs transition-colors
            ${canFwd ? 'border-border text-text-secondary hover:bg-surface-elevated cursor-pointer' : 'border-border/30 text-text-muted opacity-40 cursor-not-allowed'}">
          Fwd &#9654;
        </button>

        <div class="w-px h-4 bg-border"></div>

        <!-- Live button -->
        <button id="tw-live"
          class="px-3 py-1 rounded-lg bg-gain/15 border border-gain/30 text-gain text-xs font-semibold hover:bg-gain/25 transition-colors cursor-pointer">
          &#9679; Live
        </button>

        <div class="w-px h-4 bg-border"></div>

        <!-- Travel toggle -->
        <button id="tw-travel-btn"
          class="px-3 py-1 rounded-lg border text-xs transition-colors cursor-pointer
            ${_travelOpen ? 'bg-accent-secondary/15 border-accent-secondary text-accent-secondary' : 'border-border text-text-muted hover:text-text-primary hover:bg-surface-elevated'}">
          &#128197; Travel
        </button>

      </div>
    `
  }

  // Travel panel
  if (travelWrap) {
    if (_travelOpen) {
      travelWrap.innerHTML = `
        <div class="border-t border-border px-4 py-3 flex flex-wrap items-center gap-3">
          <span class="text-xs text-text-muted">Travel to:</span>
          <input id="tw-date-input" type="date" value="${curVal}" min="${minVal}"
            class="bg-surface-elevated border border-border rounded-lg px-2.5 py-1.5 text-sm text-text-primary
                   outline-none focus:border-accent-primary transition-colors cursor-pointer" />
          <button id="tw-travel-go"
            class="px-4 py-1.5 rounded-lg bg-accent-primary text-bg text-xs font-bold hover:bg-accent-primary/90 transition-colors cursor-pointer">
            Go &#8594;
          </button>
          ${_travelError ? `<span class="text-loss text-xs">${_travelError}</span>` : ''}
        </div>
      `
    } else {
      travelWrap.innerHTML = ''
    }
  }

  _renderStats()
  _bindControlEvents()
}

function _renderStats() {
  const el = document.getElementById('tw-stats')
  if (!el) return
  const { speed, mode, historySize, simDate } = getTimeMachineState()
  const hist    = getHistory()
  const last    = hist[hist.length - 1]
  const first   = hist[0]
  const nw      = last?.netWorth ?? 10000
  const nwStart = first?.netWorth ?? 10000
  const nwChg   = nw - nwStart
  const nwChgPct = nwStart ? (nwChg / nwStart) * 100 : 0
  const up      = nwChg >= 0

  el.innerHTML = `
    <div class="bg-surface border border-border rounded-xl p-4">
      <div class="text-[10px] text-text-muted uppercase tracking-wider mb-1">Net Worth</div>
      <div class="font-mono font-bold text-text-primary text-lg">${pc(nw)}</div>
    </div>
    <div class="bg-surface border border-border rounded-xl p-4">
      <div class="text-[10px] text-text-muted uppercase tracking-wider mb-1">Total Return</div>
      <div class="font-mono font-bold text-lg ${up ? 'text-gain' : 'text-loss'}">
        ${up ? '+' : ''}${nwChgPct.toFixed(2)}%
      </div>
    </div>
    <div class="bg-surface border border-border rounded-xl p-4">
      <div class="text-[10px] text-text-muted uppercase tracking-wider mb-1">Speed</div>
      <div class="font-mono font-bold text-accent-primary text-lg">${mode === 'live' ? speed + '×' : mode.toUpperCase()}</div>
    </div>
    <div class="bg-surface border border-border rounded-xl p-4">
      <div class="text-[10px] text-text-muted uppercase tracking-wider mb-1">Ticks Recorded</div>
      <div class="font-mono font-bold text-text-primary text-lg">${historySize}</div>
    </div>
  `
}

// ── Chart ─────────────────────────────────────────────────────────────────────

function _initChart() {
  const canvas = document.getElementById('tw-chart')
  if (!canvas) return

  const hist   = getHistory()
  const labels = hist.map(h => _fmtDate(h.simDate))
  const data   = hist.map(h => h.netWorth ?? 10000)

  _chart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: labels.length ? labels : ['Now'],
      datasets: [{
        label: 'Net Worth',
        data: data.length ? data : [10000],
        borderColor: '#00D4AA',
        borderWidth: 2,
        pointRadius: 0,
        fill: true,
        backgroundColor: 'rgba(0,212,170,0.08)',
        tension: 0.3,
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
          callbacks: { label: ctx => ` Net Worth: ${pc(ctx.raw)}` },
          backgroundColor: '#111827',
          borderColor: '#1F2937',
          borderWidth: 1,
          titleColor: '#9CA3AF',
          bodyColor: '#F9FAFB',
        },
      },
      scales: {
        x: {
          ticks: { color: '#6B7280', maxTicksLimit: 8, maxRotation: 0 },
          grid: { color: '#1F293744' },
        },
        y: {
          ticks: { color: '#6B7280', callback: v => pc(v) },
          grid: { color: '#1F293744' },
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

  _chart.data.labels = hist.map(h => _fmtDate(h.simDate))
  _chart.data.datasets[0].data = hist.map(h => h.netWorth ?? 10000)

  // Color line based on overall gain/loss
  const first = hist[0]?.netWorth ?? 10000
  const last  = hist[hist.length - 1]?.netWorth ?? 10000
  _chart.data.datasets[0].borderColor = last >= first ? '#00D4AA' : '#EF4444'
  _chart.data.datasets[0].backgroundColor = last >= first ? 'rgba(0,212,170,0.08)' : 'rgba(239,68,68,0.08)'

  _chart.update('none')
}

// ── Events ────────────────────────────────────────────────────────────────────

function _bindControlEvents() {
  const $ = id => document.getElementById(id)

  $('tw-pause')?.addEventListener('click', pauseTime)
  $('tw-rewind')?.addEventListener('click', startRewind)
  $('tw-stop-rewind')?.addEventListener('click', stopRewind)
  $('tw-start-rewind')?.addEventListener('click', startRewind)
  $('tw-step-back')?.addEventListener('click', stepBack)
  $('tw-step-fwd')?.addEventListener('click', stepForward)
  $('tw-live')?.addEventListener('click', returnToLive)

  document.querySelectorAll('.tw-speed').forEach(btn =>
    btn.addEventListener('click', () => setSpeed(Number(btn.dataset.speed)))
  )

  $('tw-travel-btn')?.addEventListener('click', () => {
    _travelOpen  = !_travelOpen
    _travelError = ''
    _renderControls()
  })

  $('tw-travel-go')?.addEventListener('click', async () => {
    const input = $('tw-date-input')
    if (!input?.value) return
    const savedVal = input.value
    const [y, m, d] = savedVal.split('-').map(Number)
    _travelError = ''
    _renderControls()
    const err = await travelToDate(y, m, d)
    if (err) {
      _travelError = err
      _renderControls()
      const inp = $('tw-date-input')
      if (inp) inp.value = savedVal
    }
  })

  $('tw-date-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') $('tw-travel-go')?.click()
  })
}
