// timeControls.js — floating time machine control bar

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
} from '../lib/timeMachine.js'

let _el          = null
let _sub         = null
let _travelOpen  = false
let _travelError = ''
let _rafPending  = false

// Throttle tick-driven re-renders to one per animation frame (~60 fps max).
// This prevents the 100× mode (33 ticks/s) from wiping buttons and form
// inputs faster than the user can interact with them.
function _scheduleRender() {
  if (_rafPending) return
  _rafPending = true
  requestAnimationFrame(() => { _rafPending = false; _render() })
}

export function mountTimeControls() {
  _el = document.createElement('div')
  _el.id = 'time-controls-root'
  document.body.appendChild(_el)
  _render()
  _sub = subscribeTimeMachine(_scheduleRender)
}

export function unmountTimeControls() {
  _sub?.()
  _el?.remove()
  _el = null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── Render ────────────────────────────────────────────────────────────────────

function _render() {
  if (!_el) return
  const savedDate = _el.querySelector('#tc-date-input')?.value
  const { speed, mode, historySize, histIdx, speeds, simDate, minDate } = getTimeMachineState()

  const isLive      = mode === 'live'
  const isPaused    = mode === 'paused'
  const isRewinding = mode === 'rewinding'
  const isTraveling = mode === 'traveling'
  const canBack     = histIdx === null ? historySize > 0 : histIdx > 0
  const canFwd      = histIdx !== null && histIdx < historySize - 1

  const ticksBack = histIdx !== null ? (historySize - 1 - histIdx) : 0
  const dateLabel = _fmtDate(simDate)

  const minVal = minDate ? _isoDate(minDate) : '2000-01-01'
  const curVal = _isoDate(simDate)

  _el.innerHTML = `
    <div class="fixed bottom-4 left-1/2 -translate-x-1/2 z-[90]
                flex flex-col items-center gap-2
                text-xs font-medium select-none">

      <!-- Travel panel (shown when  is toggled) -->
      ${_travelOpen ? `
        <div class="flex items-center gap-2 bg-surface border border-border rounded-xl px-3 py-2 shadow-xl whitespace-nowrap">
          <span class="text-text-muted">Travel to:</span>
          <input id="tc-date-input" type="date"
            value="${curVal}" min="${minVal}"
            class="bg-surface-elevated border border-border rounded-lg px-2 py-1 text-text-primary
                   outline-none focus:border-accent-primary transition-colors cursor-pointer text-xs" />
          <button id="tc-travel-go"
            class="px-3 py-1.5 rounded-lg bg-accent-primary text-bg font-bold
                   hover:bg-accent-primary/90 transition-colors cursor-pointer">
            Go &#8594;
          </button>
          ${_travelError ? `<span class="text-loss max-w-xs leading-tight">${_travelError}</span>` : ''}
        </div>
      ` : ''}

      <!-- Main controls bar -->
      <div class="flex items-center gap-1.5
                  bg-surface/95 backdrop-blur-sm border border-border
                  rounded-2xl px-3 py-2 shadow-2xl whitespace-nowrap">

        ${isTraveling ? _travelingUI(simDate) : isLive ? _liveUI(speed, speeds, historySize, dateLabel) : _scrubUI(isPaused, isRewinding, canBack, canFwd, ticksBack, dateLabel)}

        <!-- Divider -->
        <div class="w-px h-4 bg-border mx-0.5"></div>

        <!--  Travel button -->
        <button id="tc-toggle-travel"
          class="px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer
            ${_travelOpen
              ? 'bg-accent-secondary/20 border-accent-secondary text-accent-secondary'
              : 'border-border text-text-muted hover:text-text-primary hover:bg-surface-elevated'}">
          &#128197; Travel
        </button>

      </div>
    </div>
  `

  _bindEvents()
  if (savedDate) {
    const inp = _el.querySelector('#tc-date-input')
    if (inp) inp.value = savedDate
  }
}

function _liveUI(speed, speeds, historySize, dateLabel) {
  const hasHistory = historySize > 0
  return `
    <button id="tc-rewind" ${!hasHistory ? 'disabled' : ''}
      class="px-2.5 py-1.5 rounded-lg border transition-colors
        ${hasHistory ? 'border-border text-text-secondary hover:text-text-primary hover:bg-surface-elevated cursor-pointer' : 'border-border/30 text-text-muted opacity-40 cursor-not-allowed'}">
      &#9664;&#9664; Rewind
    </button>

    <button id="tc-pause"
      class="px-2.5 py-1.5 rounded-lg border border-border text-text-secondary
             hover:text-text-primary hover:bg-surface-elevated transition-colors cursor-pointer">
      &#9646;&#9646; Pause
    </button>

    <div class="w-px h-4 bg-border mx-0.5"></div>

    <div class="flex items-center gap-1.5 px-1">
      <span class="w-1.5 h-1.5 rounded-full bg-gain animate-pulse inline-block"></span>
      <span class="text-gain font-semibold">LIVE</span>
      <span class="text-text-muted">·</span>
      <span class="text-text-secondary font-mono">${dateLabel}</span>
    </div>

    <div class="w-px h-4 bg-border mx-0.5"></div>

    <div class="flex items-center gap-0.5">
      ${speeds.map(s => `
        <button data-speed="${s}"
          class="w-9 py-1.5 rounded-lg border text-center transition-colors cursor-pointer
            ${speed === s
              ? 'bg-accent-primary text-bg border-accent-primary font-bold'
              : 'border-border text-text-muted hover:text-text-primary hover:bg-surface-elevated'}">
          ${s}&times;
        </button>
      `).join('')}
    </div>
  `
}

function _scrubUI(isPaused, isRewinding, canBack, canFwd, ticksBack, dateLabel) {
  const backCls = canBack
    ? 'border-border text-text-secondary hover:text-text-primary hover:bg-surface-elevated cursor-pointer'
    : 'border-border/30 text-text-muted opacity-40 cursor-not-allowed'
  const fwdCls = canFwd
    ? 'border-border text-text-secondary hover:text-text-primary hover:bg-surface-elevated cursor-pointer'
    : 'border-border/30 text-text-muted opacity-40 cursor-not-allowed'

  return `
    <button id="tc-step-back" ${!canBack ? 'disabled' : ''}
      class="px-2.5 py-1.5 rounded-lg border transition-colors ${backCls}">
      &#9664; Back
    </button>

    ${isRewinding
      ? `<button id="tc-stop-rewind"
           class="px-2.5 py-1.5 rounded-lg border border-warning/40 bg-warning/10 text-warning hover:bg-warning/20 transition-colors cursor-pointer">
           &#9646;&#9646; Stop
         </button>`
      : `<button id="tc-start-rewind" ${!canBack ? 'disabled' : ''}
           class="px-2.5 py-1.5 rounded-lg border transition-colors ${canBack ? 'border-border text-text-secondary hover:bg-surface-elevated cursor-pointer' : 'border-border/30 text-text-muted opacity-40 cursor-not-allowed'}">
           &#9664;&#9664; Auto
         </button>`
    }

    <div class="w-px h-4 bg-border mx-0.5"></div>

    <div class="px-1 text-text-secondary font-mono">
      ${isRewinding ? '&#9664;&#9664;' : '&#9646;&#9646;'}
      <span class="ml-1">${dateLabel}</span>
      ${ticksBack > 0 ? `<span class="text-text-muted ml-1">(${ticksBack} tick${ticksBack !== 1 ? 's' : ''} back)</span>` : ''}
    </div>

    <div class="w-px h-4 bg-border mx-0.5"></div>

    <button id="tc-step-fwd" ${!canFwd ? 'disabled' : ''}
      class="px-2.5 py-1.5 rounded-lg border transition-colors ${fwdCls}">
      Fwd &#9654;
    </button>

    <button id="tc-live"
      class="px-3 py-1.5 rounded-lg bg-gain/15 border border-gain/30 text-gain
             hover:bg-gain/25 transition-colors font-semibold cursor-pointer">
      &#9679; Live
    </button>
  `
}

function _travelingUI(simDate) {
  return `
    <div class="flex items-center gap-2 px-2 py-1 text-accent-secondary">
      <span class="animate-pulse">&#9654;&#9654;</span>
      <span>Simulating to ${_fmtDate(simDate)}…</span>
    </div>
  `
}

// ── Events ────────────────────────────────────────────────────────────────────

function _bindEvents() {
  if (!_el) return

  _el.querySelector('#tc-rewind')?.addEventListener('click', startRewind)
  _el.querySelector('#tc-pause')?.addEventListener('click', pauseTime)
  _el.querySelector('#tc-stop-rewind')?.addEventListener('click', stopRewind)
  _el.querySelector('#tc-start-rewind')?.addEventListener('click', startRewind)
  _el.querySelector('#tc-step-back')?.addEventListener('click', stepBack)
  _el.querySelector('#tc-step-fwd')?.addEventListener('click', stepForward)
  _el.querySelector('#tc-live')?.addEventListener('click', returnToLive)

  _el.querySelectorAll('[data-speed]').forEach(btn =>
    btn.addEventListener('click', () => setSpeed(Number(btn.dataset.speed)))
  )

  _el.querySelector('#tc-toggle-travel')?.addEventListener('click', () => {
    _travelOpen = !_travelOpen
    _travelError = ''
    _render()
  })

  _el.querySelector('#tc-travel-go')?.addEventListener('click', async () => {
    const input = _el.querySelector('#tc-date-input')
    if (!input?.value) return
    const [y, m, d] = input.value.split('-').map(Number)
    _travelError = ''
    _render()
    const err = await travelToDate(y, m, d)
    if (err) { _travelError = err; _render() }
  })

  // Allow pressing Enter in the date input to trigger Go
  _el.querySelector('#tc-date-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') _el.querySelector('#tc-travel-go')?.click()
  })
}
