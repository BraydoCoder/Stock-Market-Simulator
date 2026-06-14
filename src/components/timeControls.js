// timeControls.js — floating time machine control bar
// Renders as a fixed pill at the bottom-center of the screen (z-90, sits behind
// the auth/welcome overlays which are z-200 so it's invisible on those screens).

import {
  getTimeMachineState,
  subscribeTimeMachine,
  setSpeed,
  pauseTime,
  resumeTime,
  startRewind,
  stopRewind,
  stepBack,
  stepForward,
  returnToLive,
} from '../lib/timeMachine.js'

let _el  = null
let _sub = null

export function mountTimeControls() {
  _el = document.createElement('div')
  _el.id = 'time-controls-root'
  document.body.appendChild(_el)
  _render()
  _sub = subscribeTimeMachine(_render)
}

export function unmountTimeControls() {
  _sub?.()
  _el?.remove()
  _el = null
}

// ── Render ────────────────────────────────────────────────────────────────────

function _render() {
  if (!_el) return
  const { speed, mode, historySize, histIdx, speeds } = getTimeMachineState()

  const isLive      = mode === 'live'
  const isPaused    = mode === 'paused'
  const isRewinding = mode === 'rewinding'
  const canBack     = histIdx === null ? historySize > 0 : histIdx > 0
  const canFwd      = histIdx !== null && histIdx < historySize - 1
  const ticksBack   = histIdx !== null ? (historySize - 1 - histIdx) : 0
  const secsBack    = ticksBack * 3

  const timeLabel = secsBack === 0
    ? 'start of history'
    : secsBack < 60
      ? `~${secsBack}s ago`
      : `~${Math.round(secsBack / 60)}m ago`

  _el.innerHTML = `
    <div class="fixed bottom-4 left-1/2 -translate-x-1/2 z-[90]
                flex items-center gap-1.5
                bg-surface/95 backdrop-blur-sm border border-border
                rounded-2xl px-3 py-2 shadow-2xl
                text-xs font-medium select-none whitespace-nowrap">

      ${isLive ? _liveControls(speed, speeds, historySize) : _rewindControls(isPaused, isRewinding, canBack, canFwd, timeLabel)}

    </div>
  `

  _bindEvents()
}

function _liveControls(speed, speeds, historySize) {
  return `
    <!-- Rewind button -->
    <button id="tc-rewind" ${historySize === 0 ? 'disabled' : ''}
      class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition-colors
        ${historySize > 0
          ? 'border-border text-text-secondary hover:text-text-primary hover:bg-surface-elevated cursor-pointer'
          : 'border-border/30 text-text-muted opacity-40 cursor-not-allowed'}">
      &#9664;&#9664; Rewind
    </button>

    <div class="w-px h-4 bg-border"></div>

    <!-- Live indicator -->
    <div class="flex items-center gap-1.5 px-1.5 py-1">
      <span class="w-1.5 h-1.5 rounded-full bg-gain animate-pulse inline-block"></span>
      <span class="text-gain font-semibold tracking-wide">LIVE</span>
    </div>

    <div class="w-px h-4 bg-border"></div>

    <!-- Pause -->
    <button id="tc-pause"
      class="px-2.5 py-1.5 rounded-lg border border-border text-text-secondary
             hover:text-text-primary hover:bg-surface-elevated transition-colors cursor-pointer">
      &#9646;&#9646; Pause
    </button>

    <div class="w-px h-4 bg-border"></div>

    <!-- Speed selector -->
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

function _rewindControls(isPaused, isRewinding, canBack, canFwd, timeLabel) {
  const backClass = canBack
    ? 'border-border text-text-secondary hover:text-text-primary hover:bg-surface-elevated cursor-pointer'
    : 'border-border/30 text-text-muted opacity-40 cursor-not-allowed'
  const fwdClass  = canFwd
    ? 'border-border text-text-secondary hover:text-text-primary hover:bg-surface-elevated cursor-pointer'
    : 'border-border/30 text-text-muted opacity-40 cursor-not-allowed'

  return `
    <!-- Step back -->
    <button id="tc-step-back" ${!canBack ? 'disabled' : ''}
      class="px-2.5 py-1.5 rounded-lg border transition-colors ${backClass}">
      &#9664; Back
    </button>

    <!-- Auto-rewind / stop -->
    ${isRewinding ? `
      <button id="tc-stop-rewind"
        class="px-2.5 py-1.5 rounded-lg border border-warning/40 bg-warning/10 text-warning
               hover:bg-warning/20 transition-colors cursor-pointer">
        &#9646;&#9646; Stop
      </button>
    ` : `
      <button id="tc-start-rewind" ${!canBack ? 'disabled' : ''}
        class="px-2.5 py-1.5 rounded-lg border transition-colors ${canBack ? 'border-border text-text-secondary hover:bg-surface-elevated cursor-pointer' : 'border-border/30 text-text-muted opacity-40 cursor-not-allowed'}">
        &#9664;&#9664; Auto
      </button>
    `}

    <div class="w-px h-4 bg-border"></div>

    <!-- Status label -->
    <div class="px-1.5 py-1 text-text-muted font-mono">
      ${isRewinding ? '&#9664;&#9664;' : '&#9646;&#9646;'} ${timeLabel}
    </div>

    <div class="w-px h-4 bg-border"></div>

    <!-- Step forward -->
    <button id="tc-step-fwd" ${!canFwd ? 'disabled' : ''}
      class="px-2.5 py-1.5 rounded-lg border transition-colors ${fwdClass}">
      Fwd &#9654;
    </button>

    <!-- Return to live -->
    <button id="tc-live"
      class="px-3 py-1.5 rounded-lg bg-gain/15 border border-gain/30 text-gain
             hover:bg-gain/25 transition-colors font-semibold cursor-pointer">
      &#9679; Live
    </button>
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
}
