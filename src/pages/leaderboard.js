// leaderboard.js — real-time class leaderboard via Supabase channel subscriptions
// Falls back to a "join a session" prompt when Supabase is not configured or
// the user hasn't joined a session yet.

import { supabase } from '../lib/supabase.js'
import { getActiveSessionId } from '../lib/session.js'
import { getUser } from '../utils/auth.js'
import { pc, pct, gainClass } from '../utils/format.js'

let container  = null
let channel    = null   // realtime subscription handle
let rows       = []     // cached leaderboard rows
let sessionId  = null
let currentUid = null
let session    = null

export async function mountLeaderboard(el) {
  container = el
  sessionId  = getActiveSessionId()

  renderSkeleton()

  if (!supabase) { renderNoSupabase(); return }
  if (!sessionId) { renderNoSession(); return }

  currentUid = (await getUser())?.id ?? null

  // Load session info for the header
  const { data: sess } = await supabase
    .from('sessions')
    .select('name, status, starting_balance, join_code')
    .eq('id', sessionId)
    .single()
  session = sess

  await fetchAndRender()
  subscribeRealtime()
}

export function unmountLeaderboard() {
  if (channel) {
    supabase?.removeChannel(channel)
    channel = null
  }
  container  = null
  rows       = []
  session    = null
  sessionId  = null
  currentUid = null
}

// ── Data ──────────────────────────────────────────────────────────────────────

async function fetchAndRender() {
  if (!supabase || !sessionId) return

  const { data, error } = await supabase
    .from('leaderboard')
    .select('user_id, display_name, avatar_seed, balance, total_value, xp, rank')
    .eq('session_id', sessionId)
    .order('rank', { ascending: true })

  if (error) { renderError(error.message); return }

  rows = data ?? []
  render()
}

function subscribeRealtime() {
  if (!supabase || !sessionId) return

  channel = supabase
    .channel(`leaderboard:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event:  '*',
        schema: 'public',
        table:  'portfolios',
        filter: `session_id=eq.${sessionId}`,
      },
      () => fetchAndRender()   // re-fetch full leaderboard on any portfolio change
    )
    .subscribe()
}

// ── Render ────────────────────────────────────────────────────────────────────

function renderSkeleton() {
  if (!container) return
  container.innerHTML = `
    <div class="max-w-4xl mx-auto px-4 py-6 space-y-5">
      <div class="h-8 w-48 bg-surface-elevated rounded-xl animate-pulse"></div>
      <div class="bg-surface border border-border rounded-2xl overflow-hidden">
        ${Array.from({ length: 6 }).map(() => `
          <div class="flex items-center gap-4 px-5 py-4 border-b border-border last:border-0">
            <div class="w-8 h-5 bg-surface-elevated rounded animate-pulse"></div>
            <div class="w-9 h-9 rounded-full bg-surface-elevated animate-pulse"></div>
            <div class="flex-1 space-y-1.5">
              <div class="h-3.5 w-32 bg-surface-elevated rounded animate-pulse"></div>
              <div class="h-2.5 w-20 bg-surface-elevated rounded animate-pulse"></div>
            </div>
            <div class="h-4 w-20 bg-surface-elevated rounded animate-pulse"></div>
          </div>
        `).join('')}
      </div>
    </div>
  `
}

function renderNoSupabase() {
  if (!container) return
  container.innerHTML = `
    <div class="max-w-4xl mx-auto px-4 py-6">
      <h1 class="text-2xl font-display font-bold text-text-primary mb-6">Leaderboard</h1>
      <div class="bg-surface border border-border rounded-2xl p-12 text-center">
        <div class="text-5xl mb-4">🏆</div>
        <div class="text-lg font-semibold text-text-primary mb-2">Class Leaderboard</div>
        <div class="text-sm text-text-muted max-w-sm mx-auto">
          Real-time rankings require Supabase. Add your keys to <code class="text-accent-primary">.env.local</code> to enable multiplayer.
        </div>
      </div>
    </div>
  `
}

function renderNoSession() {
  if (!container) return
  container.innerHTML = `
    <div class="max-w-4xl mx-auto px-4 py-6">
      <h1 class="text-2xl font-display font-bold text-text-primary mb-6">Leaderboard</h1>
      <div class="bg-surface border border-border rounded-2xl p-12 text-center">
        <div class="text-5xl mb-4">🎓</div>
        <div class="text-lg font-semibold text-text-primary mb-2">Not in a class session</div>
        <div class="text-sm text-text-muted max-w-sm mx-auto mb-6">
          Ask your teacher for a 6-digit join code, then enter it on the dashboard.
        </div>
        <a href="#dashboard"
          class="inline-block px-5 py-2.5 rounded-xl bg-accent-primary text-bg text-sm font-semibold hover:bg-accent-primary/90 transition-colors">
          Go to Dashboard →
        </a>
      </div>
    </div>
  `
}

function renderError(msg) {
  if (!container) return
  container.innerHTML = `
    <div class="max-w-4xl mx-auto px-4 py-6">
      <h1 class="text-2xl font-display font-bold text-text-primary mb-6">Leaderboard</h1>
      <div class="bg-surface border border-loss/30 rounded-2xl p-10 text-center">
        <div class="text-loss text-sm">Failed to load leaderboard: ${msg}</div>
        <button onclick="location.reload()" class="mt-4 px-4 py-2 rounded-lg bg-surface-elevated border border-border text-sm text-text-muted hover:text-text-primary">
          Retry
        </button>
      </div>
    </div>
  `
}

function render() {
  if (!container) return

  const startingBalance = session?.starting_balance ?? 10000
  const statusColor = session?.status === 'active' ? 'text-gain' : 'text-warning'
  const statusDot   = session?.status === 'active' ? 'bg-gain animate-pulse' : 'bg-warning'

  container.innerHTML = `
    <div class="max-w-4xl mx-auto px-4 py-6 space-y-5">

      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-display font-bold text-text-primary">Leaderboard</h1>
          ${session ? `
            <div class="flex items-center gap-2 mt-1">
              <span class="w-1.5 h-1.5 rounded-full ${statusDot}"></span>
              <span class="text-sm ${statusColor} capitalize">${session.status}</span>
              <span class="text-sm text-text-muted">· ${session.name}</span>
              <span class="text-xs text-text-muted font-mono border border-border bg-surface-elevated px-1.5 py-0.5 rounded">${session.join_code}</span>
            </div>
          ` : ''}
        </div>
        <div class="flex items-center gap-1.5 text-xs text-text-muted">
          <span class="w-1.5 h-1.5 rounded-full bg-gain animate-pulse"></span>
          Live
        </div>
      </div>

      ${rows.length === 0 ? `
        <div class="bg-surface border border-border rounded-2xl p-12 text-center">
          <div class="text-4xl mb-3">⏳</div>
          <div class="text-text-muted text-sm">Waiting for classmates to join…</div>
        </div>
      ` : `
        <!-- Podium (top 3) -->
        ${rows.length >= 3 ? podiumHTML(rows.slice(0, 3), startingBalance) : ''}

        <!-- Full table -->
        <div class="bg-surface border border-border rounded-2xl overflow-hidden">
          <div class="px-5 py-3 border-b border-border flex items-center justify-between">
            <span class="text-xs text-text-muted uppercase tracking-wide font-medium">${rows.length} participants</span>
            <span class="text-xs text-text-muted">Updates live</span>
          </div>
          <div class="divide-y divide-border">
            ${rows.map(r => rowHTML(r, startingBalance)).join('')}
          </div>
        </div>
      `}

    </div>
  `
}

function podiumHTML(top3, startingBalance) {
  const order = [top3[1], top3[0], top3[2]]   // 2nd, 1st, 3rd visually
  const heights = ['h-20', 'h-28', 'h-16']
  const medals  = ['🥈', '🥇', '🥉']
  const bases   = ['bg-surface-elevated', 'bg-accent-primary/10 border-accent-primary/30', 'bg-surface-elevated']

  return `
    <div class="bg-surface border border-border rounded-2xl p-6">
      <div class="flex items-end justify-center gap-4">
        ${order.map((r, i) => {
          if (!r) return ''
          const pl = ((r.total_value - startingBalance) / startingBalance * 100)
          const isMe = r.user_id === currentUid
          return `
            <div class="flex flex-col items-center gap-2 flex-1 max-w-[140px]">
              <div class="text-2xl">${medals[i]}</div>
              ${avatar(r, isMe, 'w-12 h-12 text-base')}
              <div class="text-xs font-semibold text-text-primary text-center truncate w-full">${r.display_name}</div>
              <div class="text-xs font-mono font-bold text-text-primary">${pc(r.total_value)}</div>
              <div class="text-[10px] ${gainClass(pl)}">${pl >= 0 ? '+' : ''}${pl.toFixed(2)}%</div>
              <div class="${heights[i]} ${bases[i]} border border-border rounded-t-xl w-full flex items-end justify-center pb-2">
                <span class="text-lg font-bold text-text-muted">${order[i] === top3[0] ? 1 : order[i] === top3[1] ? 2 : 3}</span>
              </div>
            </div>
          `
        }).join('')}
      </div>
    </div>
  `
}

function rowHTML(r, startingBalance) {
  const isMe = r.user_id === currentUid
  const pl   = r.total_value - startingBalance
  const plPct = (pl / startingBalance) * 100
  const rankEmoji = r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : `#${r.rank}`

  return `
    <div class="flex items-center gap-4 px-5 py-3.5 ${isMe ? 'bg-accent-primary/5 border-l-2 border-accent-primary' : 'hover:bg-surface-elevated/50'} transition-colors">
      <!-- Rank -->
      <div class="w-8 text-center text-sm font-bold ${r.rank <= 3 ? 'text-xl leading-none' : 'text-text-muted font-mono'}">${rankEmoji}</div>

      <!-- Avatar -->
      ${avatar(r, isMe, 'w-9 h-9 text-sm')}

      <!-- Name + XP -->
      <div class="flex-1 min-w-0">
        <div class="text-sm font-semibold text-text-primary truncate">
          ${r.display_name}${isMe ? ' <span class="text-[10px] text-accent-primary font-normal ml-1">you</span>' : ''}
        </div>
        <div class="text-[10px] text-text-muted">${(r.xp ?? 0).toLocaleString()} XP</div>
      </div>

      <!-- Value -->
      <div class="text-right">
        <div class="text-sm font-mono font-bold text-text-primary tabular-nums">${pc(r.total_value)}</div>
        <div class="text-[10px] ${gainClass(plPct)} tabular-nums">${pl >= 0 ? '+' : ''}${pc(pl)} (${plPct >= 0 ? '+' : ''}${plPct.toFixed(2)}%)</div>
      </div>
    </div>
  `
}

function avatar(r, isMe, sizeClass) {
  const initials = (r.display_name ?? '?')[0].toUpperCase()
  const ring = isMe ? 'border-accent-primary' : 'border-accent-secondary/40'
  return `
    <div class="${sizeClass} rounded-full bg-accent-secondary/20 border-2 ${ring} flex items-center justify-center font-bold text-accent-secondary shrink-0">
      ${initials}
    </div>
  `
}
