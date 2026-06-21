import { getState } from '../state/store.js'

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
