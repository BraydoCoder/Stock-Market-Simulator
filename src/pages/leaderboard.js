// leaderboard.js — real-time class leaderboard via Supabase channel subscriptions.
// projectable=true renders a full-screen read-only view for classroom display.

import { supabase } from '../lib/supabase.js'
import { getActiveSessionId } from '../lib/session.js'
import { getUser } from '../utils/auth.js'
import { pc, gainClass } from '../utils/format.js'

let container   = null
let channel     = null
let reactChannel = null
let rows        = []
let reactions   = {}   // { to_user_id: { emoji: count } }
let myReactions = {}   // { to_user_id: emoji }
let sessionId   = null
let currentUid  = null
let session     = null
let projectable = false

const REACTION_EMOJIS = ['👍', '🚀', '😮', '😬', '🔥']

export async function mountLeaderboard(el, isProjectable = false) {
  container  = el
  projectable = isProjectable
  sessionId  = getActiveSessionId()

  renderSkeleton()

  if (!supabase) { renderNoSupabase(); return }
  if (!sessionId) { renderNoSession(); return }

  currentUid = (await getUser())?.id ?? null

  const [{ data: sess }, { data: rxns }] = await Promise.all([
    supabase.from('sessions').select('name, status, starting_balance, join_code').eq('id', sessionId).single(),
    supabase.from('leaderboard_reactions').select('from_user_id, to_user_id, emoji').eq('session_id', sessionId),
  ])

  session = sess
  buildReactionMaps(rxns ?? [], currentUid)

  await fetchAndRender()
  subscribeRealtime()
}

export function unmountLeaderboard() {
  if (channel)      { supabase?.removeChannel(channel);      channel = null }
  if (reactChannel) { supabase?.removeChannel(reactChannel); reactChannel = null }
  container  = null
  rows       = []
  reactions  = {}
  myReactions = {}
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

function buildReactionMaps(rxns, myUid) {
  reactions  = {}
  myReactions = {}
  rxns.forEach(r => {
    if (!reactions[r.to_user_id]) reactions[r.to_user_id] = {}
    reactions[r.to_user_id][r.emoji] = (reactions[r.to_user_id][r.emoji] ?? 0) + 1
    if (r.from_user_id === myUid) myReactions[r.to_user_id] = r.emoji
  })
}

function subscribeRealtime() {
  if (!supabase || !sessionId) return

  channel = supabase
    .channel(`leaderboard:${sessionId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'portfolios', filter: `session_id=eq.${sessionId}` },
      () => fetchAndRender())
    .subscribe()

  reactChannel = supabase
    .channel(`reactions:${sessionId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'leaderboard_reactions', filter: `session_id=eq.${sessionId}` },
      async () => {
        const { data } = await supabase.from('leaderboard_reactions').select('from_user_id, to_user_id, emoji').eq('session_id', sessionId)
        buildReactionMaps(data ?? [], currentUid)
        refreshReactions()
      })
    .subscribe()
}

async function sendReaction(toUserId, emoji) {
  if (!supabase || !currentUid || currentUid === toUserId) return
  const existing = myReactions[toUserId]
  if (existing === emoji) {
    // Toggle off
    await supabase.from('leaderboard_reactions')
      .delete()
      .eq('session_id', sessionId)
      .eq('from_user_id', currentUid)
      .eq('to_user_id', toUserId)
  } else {
    await supabase.from('leaderboard_reactions').upsert(
      { session_id: sessionId, from_user_id: currentUid, to_user_id: toUserId, emoji },
      { onConflict: 'session_id,from_user_id,to_user_id' }
    )
  }
}

// ── Render states ─────────────────────────────────────────────────────────────

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
        <div class="text-lg font-semibold text-text-primary mb-2">Not in a class session</div>
        <div class="text-sm text-text-muted max-w-sm mx-auto mb-6">
          Ask your teacher for a 6-digit join code, then enter it on the dashboard.
        </div>
        <a href="#dashboard" class="inline-block px-5 py-2.5 rounded-xl bg-accent-primary text-bg text-sm font-semibold hover:bg-accent-primary/90 transition-colors">
          Go to Dashboard
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
        <button onclick="location.reload()" class="mt-4 px-4 py-2 rounded-lg bg-surface-elevated border border-border text-sm text-text-muted hover:text-text-primary">Retry</button>
      </div>
    </div>
  `
}

// ── Main render ───────────────────────────────────────────────────────────────

function render() {
  if (!container) return

  const startingBalance = session?.starting_balance ?? 10000
  const statusColor = session?.status === 'active' ? 'text-gain' : 'text-warning'
  const statusDot   = session?.status === 'active' ? 'bg-gain animate-pulse' : 'bg-warning'

  if (projectable) {
    renderProjectable(startingBalance, statusColor, statusDot)
    return
  }

  container.innerHTML = `
    <div class="max-w-4xl mx-auto px-4 py-6 space-y-5">

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
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1.5 text-xs text-text-muted">
            <span class="w-1.5 h-1.5 rounded-full bg-gain animate-pulse"></span>
            Live
          </div>
          <a href="#leaderboard-project" target="_blank"
            class="px-3 py-1.5 rounded-lg bg-surface-elevated border border-border text-xs text-text-muted hover:text-text-primary transition-colors">
            Project view
          </a>
        </div>
      </div>

      ${rows.length === 0 ? `
        <div class="bg-surface border border-border rounded-2xl p-12 text-center">
          <div class="text-text-muted text-sm">Waiting for classmates to join...</div>
        </div>
      ` : `
        ${rows.length >= 3 ? podiumHTML(rows.slice(0, 3), startingBalance) : ''}
        <div class="bg-surface border border-border rounded-2xl overflow-hidden">
          <div class="px-5 py-3 border-b border-border flex items-center justify-between">
            <span class="text-xs text-text-muted uppercase tracking-wide font-medium">${rows.length} participants</span>
            <span class="text-xs text-text-muted">Updates live</span>
          </div>
          <div class="divide-y divide-border" id="leaderboard-rows">
            ${rows.map(r => rowHTML(r, startingBalance)).join('')}
          </div>
        </div>
      `}

    </div>
  `

  bindReactionEvents()
}

function renderProjectable(startingBalance, statusColor, statusDot) {
  container.innerHTML = `
    <div class="min-h-screen bg-bg flex flex-col">
      <div class="flex items-center justify-between px-8 py-5 border-b border-border">
        <div>
          <div class="text-xl font-display font-bold text-text-primary">${session?.name ?? 'Class Leaderboard'}</div>
          <div class="flex items-center gap-2 mt-0.5">
            <span class="w-2 h-2 rounded-full ${statusDot}"></span>
            <span class="text-sm ${statusColor} capitalize">${session?.status ?? ''}</span>
          </div>
        </div>
        <div class="flex items-center gap-2 text-sm text-text-muted">
          <span class="w-1.5 h-1.5 rounded-full bg-gain animate-pulse"></span>
          Live
        </div>
      </div>

      <div class="flex-1 px-8 py-6 overflow-y-auto">
        ${rows.length === 0
          ? `<div class="text-center py-20 text-text-muted">Waiting for participants...</div>`
          : `<div class="space-y-3 max-w-3xl mx-auto">
              ${rows.map(r => projectableRow(r, startingBalance)).join('')}
             </div>`}
      </div>
    </div>
  `
}

function projectableRow(r, startingBalance) {
  const pl    = r.total_value - startingBalance
  const plPct = (pl / startingBalance) * 100
  const rankLabel = r.rank === 1 ? '1st' : r.rank === 2 ? '2nd' : r.rank === 3 ? '3rd' : `#${r.rank}`
  const barW  = Math.min(Math.abs(plPct) * 3, 100)

  return `
    <div class="bg-surface border border-border rounded-2xl px-6 py-4 flex items-center gap-5">
      <div class="w-16 text-center font-display font-bold text-2xl ${r.rank <= 3 ? 'text-accent-primary' : 'text-text-muted'}">${rankLabel}</div>
      <div class="w-12 h-12 rounded-full bg-accent-secondary/20 border-2 border-accent-secondary/40 flex items-center justify-center font-bold text-accent-secondary text-lg shrink-0">
        ${r.display_name[0].toUpperCase()}
      </div>
      <div class="flex-1 min-w-0">
        <div class="font-semibold text-text-primary text-lg truncate">${r.display_name}</div>
        <div class="mt-1.5 h-2 bg-surface-elevated rounded-full overflow-hidden w-full">
          <div class="h-full ${pl >= 0 ? 'bg-gain' : 'bg-loss'} rounded-full transition-all duration-700" style="width:${barW}%"></div>
        </div>
      </div>
      <div class="text-right shrink-0">
        <div class="text-xl font-mono font-bold text-text-primary">${pc(r.total_value)}</div>
        <div class="text-sm ${gainClass(plPct)}">${pl >= 0 ? '+' : ''}${plPct.toFixed(2)}%</div>
      </div>
    </div>
  `
}

// ── Row helpers ───────────────────────────────────────────────────────────────

function podiumHTML(top3, startingBalance) {
  const order   = [top3[1], top3[0], top3[2]]
  const heights = ['h-20', 'h-28', 'h-16']
  const ranks   = ['2nd', '1st', '3rd']
  const bases   = ['bg-surface-elevated', 'bg-accent-primary/10 border-accent-primary/30', 'bg-surface-elevated']

  return `
    <div class="bg-surface border border-border rounded-2xl p-6">
      <div class="flex items-end justify-center gap-4">
        ${order.map((r, i) => {
          if (!r) return ''
          const plP = ((r.total_value - startingBalance) / startingBalance * 100)
          const isMe = r.user_id === currentUid
          return `
            <div class="flex flex-col items-center gap-2 flex-1 max-w-[140px]">
              <span class="text-xs font-bold text-text-muted uppercase tracking-wide">${ranks[i]}</span>
              ${avatar(r, isMe, 'w-12 h-12 text-base')}
              <div class="text-xs font-semibold text-text-primary text-center truncate w-full">${r.display_name}</div>
              <div class="text-xs font-mono font-bold text-text-primary">${pc(r.total_value)}</div>
              <div class="text-[10px] ${gainClass(plP)}">${plP >= 0 ? '+' : ''}${plP.toFixed(2)}%</div>
              <div class="${heights[i]} ${bases[i]} border border-border rounded-t-xl w-full flex items-end justify-center pb-2">
                <span class="text-lg font-bold text-text-muted">${i === 1 ? 1 : i === 0 ? 2 : 3}</span>
              </div>
            </div>
          `
        }).join('')}
      </div>
    </div>
  `
}

function rowHTML(r, startingBalance) {
  const isMe  = r.user_id === currentUid
  const pl    = r.total_value - startingBalance
  const plPct = (pl / startingBalance) * 100
  const rankLabel = r.rank === 1 ? '1st' : r.rank === 2 ? '2nd' : r.rank === 3 ? '3rd' : `#${r.rank}`
  const rxnMap = reactions[r.user_id] ?? {}
  const myRxn  = myReactions[r.user_id] ?? null
  const canReact = currentUid && currentUid !== r.user_id

  const reactionBar = !projectable ? `
    <div class="flex items-center gap-1 mt-1 flex-wrap" data-reaction-row="${r.user_id}">
      ${REACTION_EMOJIS.map(e => {
        const count = rxnMap[e] ?? 0
        const mine  = myRxn === e
        return `<button data-react-to="${r.user_id}" data-emoji="${e}"
          class="reaction-btn flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition-colors
          ${mine ? 'bg-accent-primary/20 border-accent-primary/50 text-accent-primary' : 'bg-surface-elevated border-border text-text-muted hover:border-accent-primary/40'}
          ${!canReact ? 'opacity-40 cursor-default' : 'cursor-pointer'}">
          <span>${e}</span>${count > 0 ? `<span class="tabular-nums">${count}</span>` : ''}
        </button>`
      }).join('')}
    </div>
  ` : ''

  return `
    <div class="px-5 py-3.5 ${isMe ? 'bg-accent-primary/5 border-l-2 border-accent-primary' : 'hover:bg-surface-elevated/50'} transition-colors">
      <div class="flex items-center gap-4">
        <div class="w-10 text-center text-sm font-bold font-mono text-text-muted">${rankLabel}</div>
        ${avatar(r, isMe, 'w-9 h-9 text-sm')}
        <div class="flex-1 min-w-0">
          <div class="text-sm font-semibold text-text-primary truncate">
            ${r.display_name}${isMe ? ' <span class="text-[10px] text-accent-primary font-normal ml-1">you</span>' : ''}
          </div>
          <div class="text-[10px] text-text-muted">${(r.xp ?? 0).toLocaleString()} XP</div>
          ${reactionBar}
        </div>
        <div class="text-right shrink-0">
          <div class="text-sm font-mono font-bold text-text-primary tabular-nums">${pc(r.total_value)}</div>
          <div class="text-[10px] ${gainClass(plPct)} tabular-nums">${pl >= 0 ? '+' : ''}${pc(pl)} (${plPct >= 0 ? '+' : ''}${plPct.toFixed(2)}%)</div>
        </div>
      </div>
    </div>
  `
}

function avatar(r, isMe, sizeClass) {
  const ring = isMe ? 'border-accent-primary' : 'border-accent-secondary/40'
  return `
    <div class="${sizeClass} rounded-full bg-accent-secondary/20 border-2 ${ring} flex items-center justify-center font-bold text-accent-secondary shrink-0">
      ${(r.display_name ?? '?')[0].toUpperCase()}
    </div>
  `
}

function refreshReactions() {
  if (!container) return
  container.querySelectorAll('[data-reaction-row]').forEach(row => {
    const toUserId = row.dataset.reactionRow
    const rxnMap   = reactions[toUserId] ?? {}
    const myRxn    = myReactions[toUserId] ?? null
    const canReact = currentUid && currentUid !== toUserId
    row.innerHTML = REACTION_EMOJIS.map(e => {
      const count = rxnMap[e] ?? 0
      const mine  = myRxn === e
      return `<button data-react-to="${toUserId}" data-emoji="${e}"
        class="reaction-btn flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition-colors
        ${mine ? 'bg-accent-primary/20 border-accent-primary/50 text-accent-primary' : 'bg-surface-elevated border-border text-text-muted hover:border-accent-primary/40'}
        ${!canReact ? 'opacity-40 cursor-default' : 'cursor-pointer'}">
        <span>${e}</span>${count > 0 ? `<span class="tabular-nums">${count}</span>` : ''}
      </button>`
    }).join('')
    bindReactionEvents()
  })
}

function bindReactionEvents() {
  container?.querySelectorAll('.reaction-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const toUserId = btn.dataset.reactTo
      const emoji    = btn.dataset.emoji
      if (!currentUid || currentUid === toUserId) return
      await sendReaction(toUserId, emoji)
    })
  })
}
