// marketEvents.js — student-side market event subscription
// Listens for new market_events rows on the active session and:
//   1. Shows a dramatic full-width toast banner
//   2. Adds a notification to the bell
//   3. In simulation mode, applies price multipliers immediately

import { supabase } from './supabase.js'
import { getActiveSessionId } from './session.js'
import { FINNHUB_API_KEY } from '../config.js'
import { applyPriceShock } from '../api/prices.js'
import { addNotification } from '../state/store.js'
import { STOCKS } from '../data/stocks.js'

let channel     = null
let seenIds     = new Set()   // de-duplicate on reconnect

export function startMarketEventListener() {
  if (!supabase) return
  const sessionId = getActiveSessionId()
  if (!sessionId) return

  // Seed seenIds with events already in DB so we don't replay history on load
  supabase
    .from('market_events')
    .select('id')
    .eq('session_id', sessionId)
    .then(({ data }) => { (data ?? []).forEach(e => seenIds.add(e.id)) })

  channel = supabase
    .channel(`market-events:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event:  'INSERT',
        schema: 'public',
        table:  'market_events',
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => handleEvent(payload.new)
    )
    .subscribe()
}

export function stopMarketEventListener() {
  if (channel) {
    supabase?.removeChannel(channel)
    channel = null
  }
  seenIds.clear()
}

// ── Handler ───────────────────────────────────────────────────────────────────

function handleEvent(event) {
  if (seenIds.has(event.id)) return
  seenIds.add(event.id)

  // 1. Notification bell entry
  addNotification({
    type:    'market-event',
    message: `🚨 ${event.title}: ${event.body}`,
  })

  // 2. Dramatic banner toast
  showEventBanner(event)

  // 3. Apply price shock (simulation mode only — real prices come from Finnhub)
  if (!FINNHUB_API_KEY) {
    const affects = Array.isArray(event.affects) && event.affects.length > 0
      ? event.affects
      : STOCKS.map(s => ({ symbol: s.symbol, multiplier: event.global_multiplier ?? 1 }))

    applyPriceShock(affects)
  }
}

// ── Event banner ──────────────────────────────────────────────────────────────

function showEventBanner(event) {
  const existing = document.getElementById('market-event-banner')
  if (existing) existing.remove()

  const affects = Array.isArray(event.affects) && event.affects.length > 0
    ? event.affects
    : null

  const affectsHTML = affects
    ? `<div class="flex flex-wrap gap-1.5 mt-3">
        ${affects.map(a => {
          const up = a.multiplier >= 1
          return `<span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border
            ${up ? 'bg-gain/10 border-gain/30 text-gain' : 'bg-loss/10 border-loss/30 text-loss'}">
            ${a.symbol} ${up ? '▲' : '▼'} ${Math.abs((a.multiplier - 1) * 100).toFixed(0)}%
          </span>`
        }).join('')}
       </div>`
    : `<div class="text-xs text-warning mt-1.5 opacity-80">All stocks affected</div>`

  const banner = document.createElement('div')
  banner.id = 'market-event-banner'
  banner.className = [
    'fixed top-16 left-1/2 -translate-x-1/2 z-[300]',
    'w-full max-w-xl mx-auto px-4',
    'animate-slide-down',
  ].join(' ')

  banner.innerHTML = `
    <div class="bg-surface border-2 border-warning/60 rounded-2xl p-4 shadow-2xl backdrop-blur-sm">
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-lg">🚨</span>
            <span class="text-xs font-bold uppercase tracking-widest text-warning">Market Event</span>
          </div>
          <div class="font-display font-bold text-text-primary text-base">${event.title}</div>
          <div class="text-sm text-text-secondary mt-0.5">${event.body}</div>
          ${affectsHTML}
        </div>
        <button id="evt-banner-close" class="text-text-muted hover:text-text-primary text-xl leading-none shrink-0 mt-0.5">✕</button>
      </div>
      <!-- Auto-dismiss bar -->
      <div class="mt-3 h-0.5 bg-surface-elevated rounded-full overflow-hidden">
        <div id="evt-banner-bar" class="h-full bg-warning rounded-full" style="width:100%;transition:width 12s linear"></div>
      </div>
    </div>
  `

  document.body.appendChild(banner)

  // Start shrink animation on next frame
  requestAnimationFrame(() => {
    const bar = document.getElementById('evt-banner-bar')
    if (bar) bar.style.width = '0%'
  })

  const dismiss = () => {
    banner.style.opacity = '0'
    banner.style.transition = 'opacity 0.3s'
    setTimeout(() => banner.remove(), 300)
  }

  document.getElementById('evt-banner-close')?.addEventListener('click', dismiss)
  setTimeout(dismiss, 12_000)
}
