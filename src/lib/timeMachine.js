// timeMachine.js — simulation clock, speed control, rewind, and date travel
//
// Replaces setInterval(tick, 3000) in main.js.
// At 1× a tick fires every 3 s; at N× every (3000/N) ms.
// Each tick represents one business day of simulated market time.
// Price snapshots are recorded before each tick so the user can scrub
// backwards through history or jump to any date (past or future).

import { tick, captureSnapshot, restorePrices } from '../api/prices.js'

// ── Constants ─────────────────────────────────────────────────────────────────

const SPEEDS       = [1, 5, 25, 100]
const BASE_MS      = 3000      // ms per tick at 1×
const MAX_HISTORY  = 300       // ~15 min of 1× history (one snapshot per tick)
const MAX_TRAVEL   = Infinity  // no cap — user can travel to any future date

// ── State ─────────────────────────────────────────────────────────────────────

const history = []   // { ts, simDate, prices }[]  oldest → newest

let _speed      = 1
let _mode       = 'live'   // 'live' | 'paused' | 'rewinding' | 'traveling'
let _histIdx    = null     // null = live tip; index = rewind position
let _simDate    = _nextBizDay(new Date())  // current simulated calendar date
let _tickTimer  = null
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
    simDate:     getDisplayDate(),
    minDate:     history.length ? history[0].simDate : null,
  }
}

/** Returns the displayed simulated date: snapshot date when rewinding, live date otherwise. */
export function getDisplayDate() {
  if (_histIdx !== null && history[_histIdx]?.simDate) return history[_histIdx].simDate
  return _simDate
}

export function subscribeTimeMachine(fn) {
  _listeners.add(fn)
  return () => _listeners.delete(fn)
}

export function startTimeMachine() {
  // Take an immediate snapshot so pause/rewind work from the first second.
  _pushSnapshot()
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
  _histIdx = history.length - 1
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
    if (_histIdx === null || _histIdx <= 0) { stopRewind(); return }
    _histIdx--
    restorePrices(history[_histIdx].prices)
    _emit()
  }, 200)
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

/**
 * Jump to a specific simulated date.
 * Past dates within history → restore nearest snapshot.
 * Future dates → batch-simulate ticks forward (capped at MAX_TRAVEL days).
 * Returns an error string if the travel isn't possible, null on success.
 */
export async function travelToDate(year, month, day) {
  const target = new Date(year, month - 1, day)
  target.setHours(12, 0, 0, 0)

  const current = new Date(_simDate)
  current.setHours(12, 0, 0, 0)

  const diffMs   = target - current
  const diffDays = Math.round(diffMs / 86_400_000)

  if (Math.abs(diffDays) < 1) return null  // already there

  if (diffDays < 0) {
    // Past — find the closest snapshot by simDate
    const bestIdx = _closestSnapshot(target)
    if (bestIdx === null) return 'No history available for that date. Travel forward first to build history, or pick a future date.'
    clearTimeout(_tickTimer)
    _mode    = 'paused'
    _histIdx = bestIdx
    restorePrices(history[bestIdx].prices)
    _emit()
    return null
  }

  // Future — count business days between current and target
  const bizDays = _countBizDays(current, target)
  if (bizDays > MAX_TRAVEL) return `That's too far to simulate.`

  // Batch-simulate, yielding to the browser every 100 ticks so the UI stays responsive
  clearTimeout(_tickTimer)
  clearInterval(_rewindTimer)
  _mode = 'traveling'
  _emit()

  for (let i = 0; i < bizDays; i++) {
    _pushSnapshot()
    tick()
    _advanceSimDate()
    if (i % 100 === 99) {
      _emit()
      await new Promise(r => setTimeout(r, 0))
    }
  }

  _mode    = 'live'
  _histIdx = null
  _scheduleTick()
  _emit()
  return null
}

// ── Internals ─────────────────────────────────────────────────────────────────

function _scheduleTick() {
  clearTimeout(_tickTimer)
  if (_mode !== 'live') return
  _tickTimer = setTimeout(() => {
    _pushSnapshot()
    tick()
    _advanceSimDate()
    _emit()
    _scheduleTick()
  }, Math.round(BASE_MS / _speed))
}

function _pushSnapshot() {
  history.push({ ts: Date.now(), simDate: new Date(_simDate), prices: captureSnapshot() })
  if (history.length > MAX_HISTORY) history.shift()
}

function _advanceSimDate() {
  _simDate.setDate(_simDate.getDate() + 1)
  while (_simDate.getDay() === 0 || _simDate.getDay() === 6) {
    _simDate.setDate(_simDate.getDate() + 1)
  }
}

function _nextBizDay(d) {
  const date = new Date(d)
  while (date.getDay() === 0 || date.getDay() === 6) date.setDate(date.getDate() + 1)
  return date
}

function _countBizDays(from, to) {
  let count = 0
  const d = new Date(from)
  while (d < to) {
    d.setDate(d.getDate() + 1)
    if (d.getDay() !== 0 && d.getDay() !== 6) count++
  }
  return count
}

function _closestSnapshot(target) {
  if (!history.length) return null
  let bestIdx = null, bestDiff = Infinity
  history.forEach((snap, i) => {
    if (!snap.simDate) return
    const diff = Math.abs(snap.simDate - target)
    if (diff < bestDiff) { bestDiff = diff; bestIdx = i }
  })
  // Only accept if within 60 business days of a snapshot
  return bestDiff < 60 * 86_400_000 ? bestIdx : null
}
