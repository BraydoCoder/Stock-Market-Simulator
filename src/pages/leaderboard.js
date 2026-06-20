// leaderboard.js — real-time class leaderboard via Supabase channel subscriptions.
// projectable=true renders a full-screen read-only view for classroom display.

import { supabase } from '../lib/supabase.js'
import { getActiveSessionId } from '../lib/session.js'
import { getUser } from '../utils/auth.js'
import { pc, gainClass } from '../utils/format.js'
import { getState } from '../state/store.js'
import { portfolioValue } from '../api/prices.js'

let container      = null
let channel        = null
let reactChannel   = null
let rows           = []
let prevRanks      = {}  // { user_id: rank } from last fetch, for rank-change arrows
let reactions      = {}  // { to_user_id: { emoji: count } }
let myReactions    = {}  // { to_user_id: emoji }
let visibilityMap  = {}  // { user_id: bool } — leaderboard_visible per portfolio row
let sessionId      = null
let currentUid     = null
let session        = null
let projectable    = false

const REACTION_EMOJIS = ['+1', 'Up', 'Wow', 'Hmm', 'Hot']

const LEVEL_TITLES = [
  '', 'Rookie Pilot', 'Market Watcher', 'Trade Starter', 'Chart Reader',
  'Bull Believer', 'Risk Taker', 'Portfolio Builder', 'Swing Trader',
  'Value Hunter', 'Market Analyst', 'Sector Scout', 'Index Beater',
  'Alpha Seeker', 'Momentum Trader', 'Portfolio Pro', 'Smart Money',
  'Deep Value', 'Market Timer', 'Quant Trader', 'Hedge Fund Boss',
  'Market Maker', 'Wolf of StockPilot', 'Trading Legend', 'Warren Buffett Jr.',
  'Pilot Grandmaster',
]

function levelFromXP(xp) {
  let level = 1, total = 0
  while (level < 25) {
    total += Math.floor(100 * Math.pow(1.5, level - 1))
    if (total > xp) break
    level++
  }
  return Math.min(level, 25)
}

export async function mountLeaderboard(el, isProjectable = false) {
  container   = el
  projectable = isProjectable
  sessionId   = getActiveSessionId()

  renderSkeleton()

  if (!supabase) { renderNoSupabase(); return }
  if (!sessionId) { renderNoSession(); return }

  currentUid = (await getUser())?.id ?? null

  const [{ data: sess }, { data: rxns }, { data: visRows }] = await Promise.all([
    supabase.from('sessions').select('name, status, starting_balance, join_code, leaderboard_hidden').eq('id', sessionId).single(),
    supabase.from('leaderboard_reactions').select('from_user_id, to_user_id, emoji').eq('session_id', sessionId),
    supabase.from('portfolios').select('user_id, leaderboard_visible').eq('session_id', sessionId),
  ])

  session = sess
  buildReactionMaps(rxns ?? [], currentUid)
  buildVisibilityMap(visRows ?? [])

  await fetchAndRender()
  subscribeRealtime()
}

export function unmountLeaderboard() {
  if (channel)      { supabase?.removeChannel(channel);      channel = null }
  if (reactChannel) { supabase?.removeChannel(reactChannel); reactChannel = null }
  container      = null
  rows           = []
  prevRanks      = {}
  reactions      = {}
  myReactions    = {}
  visibilityMap  = {}
  session        = null
  sessionId      = null
  currentUid     = null
}

// ── Data ──────────────────────────────────────────────────────────────────────

async function fetchAndRender() {
  if (!supabase || !sessionId) return

  // Re-fetch session to get latest leaderboard_hidden status
  const { data: sess } = await supabase
    .from('sessions')
    .select('name, status, starting_balance, join_code, leaderboard_hidden')
    .eq('id', sessionId)
    .single()
  if (sess) session = sess

  const { data, error } = await supabase
    .from('leaderboard')
    .select('user_id, display_name, avatar_seed, balance, total_value, xp, rank')
    .eq('session_id', sessionId)
    .order('rank', { ascending: true })
  if (error) { renderError(error.message); return }

  // Save previous ranks before overwriting
  const newPrevRanks = {}
  rows.forEach(r => { newPrevRanks[r.user_id] = r.rank })
  prevRanks = newPrevRanks

  rows = data ?? []

  // Refresh visibility map
  const { data: visRows } = await supabase.from('portfolios').select('user_id, leaderboard_visible').eq('session_id', sessionId)
  buildVisibilityMap(visRows ?? [])

  render()
}

function buildVisibilityMap(visRows) {
  visibilityMap = {}
  visRows.forEach(v => { visibilityMap[v.user_id] = v.leaderboard_visible !== false })
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
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${sessionId}` },
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
  const myState = getState()
  const myVal   = myState.user.balance + portfolioValue(myState.holdings)
  const myName  = myState.user.displayName ?? 'You'
  const myXP    = myState.user.xp ?? 0

  // Simulated classmates (Option B — Challenge 2)
  const sims = [
    { name: 'Alex T.',   value: 11840, xp: 320 },
    { name: 'Jordan K.', value: 11250, xp: 210 },
    { name: 'Sam R.',    value: 10920, xp: 180 },
    { name: 'Casey M.',  value: 10650, xp: 150 },
    { name: 'Riley J.',  value: 10400, xp: 130 },
    { name: 'Morgan P.', value: 10110, xp: 90  },
    { name: 'Drew S.',   value:  9870, xp: 75  },
    { name: 'Quinn L.',  value:  9540, xp: 60  },
  ]

  const all = [{ name: myName, value: myVal, xp: myXP, isMe: true }, ...sims]
    .sort((a, b) => b.value - a.value)
    .map((p, i) => ({ ...p, rank: i + 1 }))

  const START = 10000
  const top3  = all.slice(0, 3)
  const rankColors = ['text-yellow-400', 'text-slate-300', 'text-amber-600']
  const rankLabels = ['1st', '2nd', '3rd']

  container.innerHTML = `
    <div class="max-w-4xl mx-auto px-4 py-6 space-y-5">

      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-display font-bold text-text-primary">Leaderboard</h1>
        <span class="text-xs text-text-muted px-2.5 py-1 rounded-full bg-surface-elevated border border-border">Demo Mode</span>
      </div>

      <!-- Educational note -->
      <div class="px-4 py-3 rounded-xl border border-accent-primary/20 bg-accent-primary/5 text-xs text-text-muted leading-relaxed">
        In real investing, short-term rankings matter less than long-term, consistent growth. The best strategy is patient diversification — not chasing the top spot.
      </div>

      <!-- Podium -->
      <div class="bg-surface border border-border rounded-2xl p-6">
        <div class="flex items-end justify-center gap-4">
          ${[top3[1], top3[0], top3[2]].map((p, i) => {
            if (!p) return ''
            const heights = ['h-20', 'h-28', 'h-16']
            const bases   = ['bg-surface-elevated', 'bg-accent-primary/10 border border-accent-primary/30', 'bg-surface-elevated']
            const pl = p.value - START
            const plPct = (pl / START * 100)
            return `
              <div class="flex flex-col items-center gap-2 flex-1 max-w-[140px]">
                <span class="text-xs font-bold uppercase tracking-wide ${rankColors[i]}">${rankLabels[i]}</span>
                <div class="w-10 h-10 rounded-full ${p.isMe ? 'bg-accent-primary/20 border-2 border-accent-primary' : 'bg-accent-secondary/20 border-2 border-accent-secondary/40'} flex items-center justify-center font-bold ${p.isMe ? 'text-accent-primary' : 'text-accent-secondary'} text-sm">
                  ${p.name[0].toUpperCase()}
                </div>
                <div class="text-xs font-semibold text-text-primary text-center truncate w-full">${p.name}</div>
                <div class="text-xs font-mono font-bold text-text-primary">${pc(p.value)}</div>
                <div class="text-[10px] ${pl >= 0 ? 'text-gain' : 'text-loss'}">${pl >= 0 ? '+' : ''}${plPct.toFixed(2)}%</div>
                <div class="${heights[i]} ${bases[i]} rounded-t-xl w-full"></div>
              </div>
            `
          }).join('')}
        </div>
      </div>

      <!-- Full table -->
      <div class="bg-surface border border-border rounded-2xl overflow-hidden">
        <div class="px-5 py-3 border-b border-border text-xs text-text-muted uppercase tracking-wide font-medium">${all.length} participants · Simulated</div>
        <div class="divide-y divide-border">
          ${all.map(p => {
            const pl    = p.value - START
            const plPct = (pl / START) * 100
            const barW  = Math.min(Math.abs(plPct) * 4, 100)
            const rnk   = p.rank === 1 ? '1st' : p.rank === 2 ? '2nd' : p.rank === 3 ? '3rd' : `#${p.rank}`
            return `
              <div class="px-5 py-3.5 ${p.isMe ? 'bg-accent-primary/5 border-l-2 border-accent-primary' : 'hover:bg-surface-elevated/50'} transition-colors">
                <div class="flex items-center gap-3">
                  <div class="w-8 text-center text-sm font-bold font-mono text-text-muted shrink-0">${rnk}</div>
                  <div class="w-9 h-9 rounded-full ${p.isMe ? 'bg-accent-primary/20 border-2 border-accent-primary' : 'bg-accent-secondary/20 border-2 border-accent-secondary/40'} flex items-center justify-center font-bold ${p.isMe ? 'text-accent-primary' : 'text-accent-secondary'} text-sm shrink-0">
                    ${p.name[0].toUpperCase()}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-semibold text-text-primary">${p.name}${p.isMe ? ' <span class="text-[10px] text-accent-primary font-normal">you</span>' : ''}</div>
                    <div class="text-[10px] text-text-muted">${p.xp.toLocaleString()} XP</div>
                  </div>
                  <div class="text-right shrink-0">
                    <div class="text-sm font-mono font-bold text-text-primary">${pc(p.value)}</div>
                    <div class="text-[10px] ${pl >= 0 ? 'text-gain' : 'text-loss'}">${pl >= 0 ? '+' : ''}${pc(pl)} (${plPct >= 0 ? '+' : ''}${plPct.toFixed(2)}%)</div>
                    <div class="w-24 h-1 bg-surface-elevated rounded-full overflow-hidden ml-auto mt-1">
                      <div class="h-full ${pl >= 0 ? 'bg-gain' : 'bg-loss'} rounded-full" style="width:${barW}%"></div>
                    </div>
                  </div>
                </div>
              </div>
            `
          }).join('')}
        </div>
      </div>

      <p class="text-center text-xs text-text-muted">Enable multiplayer by adding Supabase keys to <code class="text-accent-primary">.env.local</code></p>
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

  // Hidden by teacher — show message to non-projectable viewers
  if (session?.leaderboard_hidden) {
    container.innerHTML = `
      <div class="max-w-4xl mx-auto px-4 py-6">
        <h1 class="text-2xl font-display font-bold text-text-primary mb-6">Leaderboard</h1>
        <div class="bg-surface border border-border rounded-2xl p-12 text-center">
          <div class="text-lg font-semibold text-text-primary mb-2">Leaderboard Hidden</div>
          <div class="text-sm text-text-muted">Your teacher has temporarily hidden the leaderboard.</div>
        </div>
      </div>
    `
    return
  }

  // Filter out hidden rows (exclude own row so user always sees themselves)
  const myRow      = rows.find(r => r.user_id === currentUid)
  const visibleRows = rows.filter(r => r.user_id === currentUid || visibilityMap[r.user_id] !== false)
  const TOP_N = 20
  const myIsInTop = !myRow || (myRow.rank <= TOP_N)

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

      ${visibleRows.length === 0 ? `
        <div class="bg-surface border border-border rounded-2xl p-12 text-center">
          <div class="text-text-muted text-sm">Waiting for classmates to join...</div>
        </div>
      ` : `
        ${visibleRows.length >= 3 ? podiumHTML(visibleRows.slice(0, 3), startingBalance) : ''}
        <div class="bg-surface border border-border rounded-2xl overflow-hidden">
          <div class="px-5 py-3 border-b border-border flex items-center justify-between">
            <span class="text-xs text-text-muted uppercase tracking-wide font-medium">${visibleRows.length} participants</span>
            <span class="text-xs text-text-muted">Updates live</span>
          </div>
          <div class="divide-y divide-border" id="leaderboard-rows">
            ${visibleRows.map(r => rowHTML(r, startingBalance)).join('')}
          </div>
          ${!myIsInTop && myRow && visibilityMap[myRow.user_id] !== false ? `
            <div class="border-t-2 border-accent-primary/30 bg-accent-primary/5">
              <div class="px-5 py-2 text-[10px] text-accent-primary font-semibold uppercase tracking-wide">Your Position</div>
              ${rowHTML(myRow, startingBalance)}
            </div>
          ` : ''}
        </div>
      `}

    </div>
  `

  bindRowEvents()
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

function rankArrow(r) {
  const prev = prevRanks[r.user_id]
  if (prev == null || prev === r.rank) return '<span class="text-[10px] text-text-muted w-3 inline-block">—</span>'
  if (r.rank < prev) return '<span class="text-[10px] text-gain w-3 inline-block">↑</span>'
  return '<span class="text-[10px] text-loss w-3 inline-block">↓</span>'
}

function rowHTML(r, startingBalance) {
  const isMe  = r.user_id === currentUid
  const pl    = r.total_value - startingBalance
  const plPct = (pl / startingBalance) * 100
  const barW  = Math.min(Math.abs(plPct) * 4, 100)
  const rankLabel = r.rank === 1 ? '1st' : r.rank === 2 ? '2nd' : r.rank === 3 ? '3rd' : `#${r.rank}`
  const level = levelFromXP(r.xp ?? 0)
  const title = LEVEL_TITLES[level] ?? 'Pilot'
  const rxnMap = reactions[r.user_id] ?? {}
  const myRxn  = myReactions[r.user_id] ?? null
  const canReact = currentUid && currentUid !== r.user_id

  const reactionBar = `
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
  `

  const selfVisible = visibilityMap[r.user_id] !== false
  const hideSelfBtn = isMe ? `
    <button class="hide-self-btn text-[10px] ${selfVisible ? 'text-text-muted hover:text-warning' : 'text-warning hover:text-text-muted'} transition-colors ml-1"
      data-user-id="${r.user_id}" title="${selfVisible ? 'Hide your rank from classmates' : 'Show your rank to classmates'}">
      ${selfVisible ? '(hide rank)' : '(hidden — show)'}
    </button>` : ''

  return `
    <div class="px-5 py-3.5 ${isMe ? 'bg-accent-primary/5 border-l-2 border-accent-primary' : 'hover:bg-surface-elevated/50'} transition-colors">
      <div class="flex items-center gap-3">
        <div class="w-4 flex-shrink-0">${rankArrow(r)}</div>
        <div class="w-8 text-center text-sm font-bold font-mono text-text-muted shrink-0">${rankLabel}</div>
        ${avatar(r, isMe, 'w-9 h-9 text-sm')}
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-sm font-semibold text-text-primary truncate">
              ${r.display_name}${isMe ? ' <span class="text-[10px] text-accent-primary font-normal">you</span>' : ''}
            </span>
            ${hideSelfBtn}
          </div>
          <div class="text-[10px] text-text-muted">${title} · Lv.${level} · ${(r.xp ?? 0).toLocaleString()} XP</div>
          ${reactionBar}
        </div>
        <div class="text-right shrink-0 space-y-1">
          <div class="text-sm font-mono font-bold text-text-primary tabular-nums">${pc(r.total_value)}</div>
          <div class="text-[10px] ${gainClass(plPct)} tabular-nums">${pl >= 0 ? '+' : ''}${pc(pl)} (${plPct >= 0 ? '+' : ''}${plPct.toFixed(2)}%)</div>
          <div class="w-24 h-1 bg-surface-elevated rounded-full overflow-hidden ml-auto">
            <div class="h-full ${pl >= 0 ? 'bg-gain' : 'bg-loss'} rounded-full transition-all duration-500" style="width:${barW}%"></div>
          </div>
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
    bindRowEvents()
  })
}

function bindRowEvents() {
  container?.querySelectorAll('.reaction-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const toUserId = btn.dataset.reactTo
      const emoji    = btn.dataset.emoji
      if (!currentUid || currentUid === toUserId) return
      await sendReaction(toUserId, emoji)
    })
  })

  container?.querySelectorAll('.hide-self-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const uid = btn.dataset.userId
      const newVisible = visibilityMap[uid] === false
      const { error } = await supabase.from('portfolios')
        .update({ leaderboard_visible: newVisible })
        .eq('session_id', sessionId)
        .eq('user_id', uid)
      if (!error) {
        visibilityMap[uid] = newVisible
        await fetchAndRender()
      }
    })
  })
}
