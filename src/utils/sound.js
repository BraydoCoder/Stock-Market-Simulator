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

export const playBuy = () => _play('/sounds/buy.mp3')

// ── Background music ──────────────────────────────────────────────────────────

let _bg = null

function _getBg() {
  if (!_bg) {
    _bg = new Audio('/sounds/bg_music.mp3')
    _bg.loop    = true
    _bg.preload = 'auto'
  }
  return _bg
}

export function initBgMusic() {
  const { musicEnabled, musicVolume } = getState().settings
  const audio = _getBg()
  audio.volume = (musicVolume ?? 50) / 100
  if (!musicEnabled) return

  audio.play().catch(() => {
    // Autoplay blocked by browser — resume on first user interaction
    const onInteract = () => {
      if (getState().settings.musicEnabled) _getBg().play().catch(() => {})
      document.removeEventListener('click', onInteract)
      document.removeEventListener('keydown', onInteract)
    }
    document.addEventListener('click',   onInteract, { once: true })
    document.addEventListener('keydown', onInteract, { once: true })
  })
}

export function startBgMusic() {
  const audio = _getBg()
  audio.volume = (getState().settings.musicVolume ?? 50) / 100
  audio.play().catch(() => {})
}

export function stopBgMusic() {
  if (_bg) { _bg.pause(); _bg.currentTime = 0 }
}

export function setMusicVolume(vol) {
  _getBg().volume = vol / 100
}
