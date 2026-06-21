import { getState } from '../state/store.js'

// ── SFX ───────────────────────────────────────────────────────────────────────

const _cache = {}

function _get(src) {
  if (!_cache[src]) {
    const a = new Audio(src)
    a.preload = 'auto'
    _cache[src] = a
  }
  return _cache[src]
}

function _play(src) {
  const { soundEnabled, sfxVolume } = getState().settings
  if (!soundEnabled) return
  const audio = _get(src)
  audio.volume = (sfxVolume ?? 70) / 100
  audio.currentTime = 0
  audio.play().catch(() => {})
}

export const playBuy  = () => _play('/sounds/buy.mp3')
export const playSell = () => _play('/sounds/sell.mp3')

// ── Background music ──────────────────────────────────────────────────────────

let _bg = null
let _pendingStart = false

function _getBg() {
  if (!_bg) {
    _bg = new Audio('/sounds/bg_music.mp3')
    _bg.loop    = true
    _bg.preload = 'auto'
  }
  return _bg
}

// Called once on app boot. If musicEnabled, tries to play immediately;
// if the browser blocks autoplay, queues it for the first user interaction.
export function initBgMusic() {
  const { musicEnabled, musicVolume } = getState().settings
  if (!musicEnabled) return

  const audio = _getBg()
  audio.volume = (musicVolume ?? 50) / 100

  audio.play().then(() => {
    _pendingStart = false
  }).catch(() => {
    // Autoplay blocked — start on first interaction
    _pendingStart = true
    const onInteract = () => {
      if (_pendingStart && getState().settings.musicEnabled) {
        _getBg().play().catch(() => {})
        _pendingStart = false
      }
      document.removeEventListener('click',   onInteract)
      document.removeEventListener('keydown', onInteract)
    }
    document.addEventListener('click',   onInteract)
    document.addEventListener('keydown', onInteract)
  })
}

export function startBgMusic() {
  _pendingStart = false
  const audio = _getBg()
  audio.volume = (getState().settings.musicVolume ?? 50) / 100
  audio.play().catch(() => {})
}

export function stopBgMusic() {
  _pendingStart = false
  if (_bg) { _bg.pause(); _bg.currentTime = 0 }
}

export function setMusicVolume(vol) {
  _getBg().volume = vol / 100
}
