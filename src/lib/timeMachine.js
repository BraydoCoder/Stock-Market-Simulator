// timeMachine.js — controls simulation speed and price history rewind
//
// Replaces the plain setInterval(tick, 3000) in main.js.
// At 1× a tick fires every 3 s; at N× every (3000/N) ms.
// Before each forward tick a price snapshot is pushed to a rolling history
// buffer so the user can scrub backwards through past price states.

import { tick, captureSnapshot, restorePrices } from '../api/prices.js'

// ── State ─────────────────────────────────────────────────────────────────────

const SPEEDS       = [1, 5, 25, 100]
const BASE_MS      = 3000     // interval at 1×
const MAX_HISTORY  = 150      // ~7.5 min of 1× history

const history = []            // { ts, prices }[]  oldest → newest

let _speed     = 1
let _mode      = 'live'       // 'live' | 'paused' | 'rewinding'
let _histIdx   = null         // null = live tip; number = rewind position
let _tickTimer = null
let _rewindTimer = null

const _listeners = new Set()
const _emit = () => _listeners.forEach(fn => fn(getTimeMachineState()))

// ── Public API ────────────────────────────────────────────────────────────────

export function getTimeMachineState() {
  return {
    speed:       _speed,
    mode:        _mode,
    historySize: history.length,
    histIdx:     _histIdx,
    speeds:      SPEEDS,
  }
}

export function subscribeTimeMachine(fn) {
  _listeners.add(fn)
  return () => _listeners.delete(fn)
}

export function startTimeMachine() {
  _scheduleTick()
}

export function setSpeed(n) {
  _speed = n
  if (_mode !== 'live') returnToLive()
  else { _scheduleTick(); _emit() }
}

export function pauseTime() {
  if (_mode !== 'live') return
  clearTimeout(_tickTimer)
  _mode    = 'paused'
  _histIdx = Math.max(history.length - 1, 0)
  _emit()
}

export function resumeTime() {
  clearInterval(_rewindTimer)
  _mode    = 'live'
  _histIdx = null
  _scheduleTick()
  _emit()
}

export function startRewind() {
  clearTimeout(_tickTimer)
  _mode    = 'rewinding'
  if (_histIdx === null) _histIdx = history.length - 1

  clearInterval(_rewindTimer)
  _rewindTimer = setInterval(() => {
    if (_histIdx === null || _histIdx <= 0) {
      stopRewind()
      return
    }
    _histIdx--
    restorePrices(history[_histIdx].prices)
    _emit()
  }, 220)
  _emit()
}

export function stopRewind() {
  clearInterval(_rewindTimer)
  if (_mode === 'rewinding') { _mode = 'paused'; _emit() }
}

export function stepBack() {
  if (_mode === 'live') pauseTime()
  if (_histIdx === null) _histIdx = history.length - 1
  if (_histIdx > 0) {
    _histIdx--
    restorePrices(history[_histIdx].prices)
    _emit()
  }
}

export function stepForward() {
  if (_histIdx === null) return
  if (_histIdx < history.length - 1) {
    _histIdx++
    restorePrices(history[_histIdx].prices)
    _emit()
  } else {
    returnToLive()
  }
}

export function returnToLive() {
  clearInterval(_rewindTimer)
  clearTimeout(_tickTimer)
  _mode    = 'live'
  _histIdx = null
  _scheduleTick()
  _emit()
}

// ── Internals ─────────────────────────────────────────────────────────────────

function _scheduleTick() {
  clearTimeout(_tickTimer)
  if (_mode !== 'live') return

  _tickTimer = setTimeout(() => {
    _pushSnapshot()
    tick()
    _emit()
    _scheduleTick()
  }, Math.round(BASE_MS / _speed))
}

function _pushSnapshot() {
  const last = history.at(-1)
  // Throttle: never snapshot more than once per real second so high speeds
  // don't flood the buffer with identical entries.
  if (last && Date.now() - last.ts < 1000) return
  history.push({ ts: Date.now(), prices: captureSnapshot() })
  if (history.length > MAX_HISTORY) history.shift()
}
