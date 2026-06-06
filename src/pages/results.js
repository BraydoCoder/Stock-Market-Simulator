// results.js — end-of-session results screen
// Shown automatically when the active session's status flips to 'ended',
// or navigated to manually via #results.

import { supabase } from '../lib/supabase.js'
import { getActiveSessionId, leaveSession } from '../lib/session.js'
import { getUser } from '../utils/auth.js'
import { pc, pct } from '../utils/format.js'
import { getState } from '../state/store.js'

let container  = null
let rows       = []
let session    = null
let currentUid = null

export async function mountResults(el) {
  container = el
  renderLoading()

  if (!supabase) { renderNoSupabase(); return }

  const sessionId = getActiveSessionId()
  if (!sessionId) { renderNoSession(); return }

  currentUid = (await getUser())?.id ?? null

  const [{ data: sess }, { data: lb }] = await Promise.all([
    supabase.from('sessions').select('*').eq('id', sessionId).single(),
    supabase.from('leaderboard')
      .select('user_id, display_name, balance, total_value, xp, rank')
      .eq('session_id', sessionId)
      .order('rank', { ascending: true }),
  ])

  session = sess
  rows    = lb ?? []

  render()
}

export function unmountResults() {
  container  = null
  rows       = []
  session    = null
  currentUid = null
}

// ── Render states ─────────────────────────────────────────────────────────────

function renderLoading() {
  if (!container) return
  container.innerHTML = `<div class="flex items-center justify-center min-h-[60vh] text-text-muted text-sm">Loading results…</div>`
}

function renderNoSupabase() {
  if (!container) return
  container.innerHTML = emptyState('No Backend', 'Results require Supabase.', '#dashboard', 'Dashboard')
}

function renderNoSession() {
  if (!container) return
  container.innerHTML = emptyState('No Session', "You're not enrolled in a class session.", '#dashboard', 'Go to Dashboard')
}

function emptyState(title, body, href, label) {
  return `
    <div class="max-w-2xl mx-auto px-4 py-12 text-center">
      <div class="text-lg font-semibold text-text-primary mb-2">${title}</div>
      <p class="text-sm text-text-muted mb-6">${body}</p>
      <a href="${href}" class="inline-block px-5 py-2.5 rounded-xl bg-accent-primary text-bg text-sm font-semibold hover:bg-accent-primary/90 transition-colors">${label}</a>
    </div>
  `
}

// ── Main render ───────────────────────────────────────────────────────────────

function render() {
  if (!container || !session) return

  const startBal  = session.starting_balance ?? 10000
  const myRow     = rows.find(r => r.user_id === currentUid)
  const winner    = rows[0]
  const duration  = session.ends_at
    ? formatDuration(new Date(session.created_at), new Date(session.ends_at))
    : null

  container.innerHTML = `
    <div class="max-w-4xl mx-auto px-4 py-8 space-y-8">

      <!-- Hero banner -->
      <div class="relative bg-surface border border-border rounded-3xl p-8 text-center overflow-hidden">
        <!-- Decorative background glow -->
        <div class="absolute inset-0 bg-gradient-to-b from-accent-primary/5 to-transparent pointer-events-none"></div>
        <div class="relative">
          <h1 class="text-3xl font-display font-bold text-text-primary mb-1">Session Complete!</h1>
          <p class="text-text-muted text-sm">${session.name}${duration ? ` · ${duration}` : ''} · ${rows.length} participant${rows.length !== 1 ? 's' : ''}</p>

          ${winner ? `
          <div class="mt-6 inline-flex flex-col items-center gap-2 bg-surface-elevated border border-accent-primary/30 rounded-2xl px-8 py-4">
            <div class="text-xs text-accent-primary font-semibold uppercase tracking-widest">Winner</div>
            <div class="text-2xl font-display font-bold text-text-primary">${winner.display_name}</div>
            <div class="text-xl font-mono font-bold text-accent-primary">${pc(winner.total_value)}</div>
            <div class="text-sm ${pl(winner, startBal) >= 0 ? 'text-gain' : 'text-loss'}">
              ${pl(winner, startBal) >= 0 ? '+' : ''}${pc(pl(winner, startBal))} (${plPct(winner, startBal) >= 0 ? '+' : ''}${plPct(winner, startBal).toFixed(2)}%)
            </div>
          </div>
          ` : ''}
        </div>
      </div>

      <!-- Your performance (if enrolled) -->
      ${myRow ? myStatsHTML(myRow, startBal) : ''}

      <!-- Podium -->
      ${rows.length >= 3 ? podiumHTML(rows, startBal) : ''}

      <!-- Full standings table -->
      <div class="bg-surface border border-border rounded-2xl overflow-hidden">
        <div class="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 class="font-semibold text-text-primary">Final Standings</h2>
          <span class="text-xs text-text-muted">${rows.length} participants</span>
        </div>
        <div class="divide-y divide-border">
          ${rows.map(r => standingRow(r, startBal)).join('')}
        </div>
      </div>

      <!-- Actions -->
      <div class="flex flex-wrap gap-3 justify-center">
        <a href="#dashboard"
          class="px-6 py-3 rounded-xl bg-accent-primary text-bg font-semibold text-sm hover:bg-accent-primary/90 transition-colors">
          Back to Dashboard
        </a>
        <button id="leave-after-btn"
          class="px-6 py-3 rounded-xl bg-surface-elevated border border-border text-sm text-text-muted hover:text-text-primary transition-colors">
          Leave Session
        </button>
      </div>

    </div>
  `

  launchConfetti()
  bindEvents()
}

// ── Sections ──────────────────────────────────────────────────────────────────

function myStatsHTML(row, startBal) {
  const gain  = pl(row, startBal)
  const gainP = plPct(row, startBal)
  const rankLabel = row.rank === 1 ? '1st' : row.rank === 2 ? '2nd' : row.rank === 3 ? '3rd' : `#${row.rank}`

  const state = getState()
  const txs   = state.transactions
  const tradeCount = txs.length
  const badgesCount = state.achievements.length

  // Best/worst stock by realized P&L on sell transactions
  const plBySymbol = {}
  txs.forEach(t => {
    if (t.type === 'sell' && t.realizedPL != null) {
      plBySymbol[t.symbol] = (plBySymbol[t.symbol] ?? 0) + t.realizedPL
    }
  })
  const plEntries = Object.entries(plBySymbol)
  const bestEntry  = plEntries.length ? plEntries.reduce((a, b) => b[1] > a[1] ? b : a) : null
  const worstEntry = plEntries.length ? plEntries.reduce((a, b) => b[1] < a[1] ? b : a) : null
  const bestLabel  = bestEntry  ? `${bestEntry[0]} ${bestEntry[1] >= 0 ? '+' : ''}${pc(bestEntry[1])}` : '—'
  const worstLabel = worstEntry ? `${worstEntry[0]} ${worstEntry[1] >= 0 ? '+' : ''}${pc(worstEntry[1])}` : '—'

  return `
    <div class="bg-surface border border-accent-secondary/30 rounded-2xl p-5">
      <h2 class="font-semibold text-text-primary mb-4">Your Results</h2>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        ${statTile('Final Rank', rankLabel, '')}
        ${statTile('Portfolio Value', pc(row.total_value), '')}
        ${statTile('Total P&L', `${gain >= 0 ? '+' : ''}${pc(gain)}`, gain >= 0 ? 'text-gain' : 'text-loss')}
        ${statTile('Return', `${gainP >= 0 ? '+' : ''}${gainP.toFixed(2)}%`, gainP >= 0 ? 'text-gain' : 'text-loss')}
        ${statTile('Total Trades', tradeCount, '')}
        ${statTile('Best Stock', bestLabel, bestEntry && bestEntry[1] >= 0 ? 'text-gain' : 'text-loss')}
        ${statTile('Worst Stock', worstLabel, worstEntry && worstEntry[1] < 0 ? 'text-loss' : 'text-gain')}
        ${statTile('Badges Earned', `${badgesCount}`, 'text-accent-secondary')}
      </div>
      <div class="mt-3 flex items-center gap-2">
        <div class="flex-1 h-2 bg-surface-elevated rounded-full overflow-hidden">
          <div class="h-full ${gain >= 0 ? 'bg-gain' : 'bg-loss'} rounded-full transition-all duration-1000"
            style="width:${Math.min(Math.abs(gainP) * 5, 100)}%"></div>
        </div>
        <span class="text-xs text-text-muted">${(row.xp ?? 0).toLocaleString()} XP earned</span>
      </div>
    </div>
  `
}

function statTile(label, value, cls) {
  return `
    <div class="bg-surface-elevated rounded-xl p-3">
      <div class="text-[10px] text-text-muted uppercase tracking-wide mb-1">${label}</div>
      <div class="text-lg font-bold font-mono ${cls || 'text-text-primary'}">${value}</div>
    </div>
  `
}

function podiumHTML(allRows, startBal) {
  const top3  = allRows.slice(0, 3)
  const order = [top3[1], top3[0], top3[2]]
  const heights = ['h-20', 'h-28', 'h-16']
  const rankLabels = ['2nd', '1st', '3rd']
  const ranks   = [2, 1, 3]

  return `
    <div class="bg-surface border border-border rounded-2xl p-6">
      <h2 class="font-semibold text-text-primary mb-6 text-center">Podium</h2>
      <div class="flex items-end justify-center gap-6">
        ${order.map((r, i) => {
          if (!r) return ''
          const isMe = r.user_id === currentUid
          const gain = plPct(r, startBal)
          return `
            <div class="flex flex-col items-center gap-2 flex-1 max-w-[130px]">
              <div class="text-xs font-bold text-text-muted">${rankLabels[i]}</div>
              <div class="w-12 h-12 rounded-full bg-accent-secondary/20 border-2 ${isMe ? 'border-accent-primary' : 'border-accent-secondary/40'} flex items-center justify-center font-bold text-accent-secondary text-base">
                ${r.display_name[0].toUpperCase()}
              </div>
              <div class="text-xs font-semibold text-text-primary text-center truncate w-full">${r.display_name}${isMe ? ' (you)' : ''}</div>
              <div class="text-xs font-mono font-bold text-text-primary">${pc(r.total_value)}</div>
              <div class="text-[10px] ${gain >= 0 ? 'text-gain' : 'text-loss'}">${gain >= 0 ? '+' : ''}${gain.toFixed(2)}%</div>
              <div class="${heights[i]} bg-surface-elevated border border-border rounded-t-xl w-full flex items-end justify-center pb-2">
                <span class="text-xl font-bold text-text-muted">${ranks[i]}</span>
              </div>
            </div>
          `
        }).join('')}
      </div>
    </div>
  `
}

function standingRow(r, startBal) {
  const isMe  = r.user_id === currentUid
  const gain  = pl(r, startBal)
  const gainP = plPct(r, startBal)
  const rankStr = r.rank === 1 ? '1st' : r.rank === 2 ? '2nd' : r.rank === 3 ? '3rd' : `#${r.rank}`

  return `
    <div class="flex items-center gap-4 px-5 py-3.5 ${isMe ? 'bg-accent-primary/5 border-l-2 border-accent-primary' : 'hover:bg-surface-elevated/50'} transition-colors">
      <div class="w-8 text-center text-xs font-bold text-text-muted">${rankStr}</div>
      <div class="w-9 h-9 rounded-full bg-accent-secondary/20 border-2 ${isMe ? 'border-accent-primary' : 'border-accent-secondary/40'} flex items-center justify-center font-bold text-accent-secondary text-sm shrink-0">
        ${r.display_name[0].toUpperCase()}
      </div>
      <div class="flex-1 min-w-0">
        <div class="text-sm font-semibold text-text-primary truncate">
          ${r.display_name}${isMe ? ' <span class="text-[10px] text-accent-primary font-normal ml-1">you</span>' : ''}
        </div>
        <div class="text-[10px] text-text-muted">${(r.xp ?? 0).toLocaleString()} XP</div>
      </div>
      <div class="text-right">
        <div class="text-sm font-mono font-bold text-text-primary tabular-nums">${pc(r.total_value)}</div>
        <div class="text-[10px] ${gainP >= 0 ? 'text-gain' : 'text-loss'} tabular-nums">
          ${gain >= 0 ? '+' : ''}${pc(gain)} (${gainP >= 0 ? '+' : ''}${gainP.toFixed(2)}%)
        </div>
      </div>
    </div>
  `
}

// ── Confetti ──────────────────────────────────────────────────────────────────

function launchConfetti() {
  const colors = ['#00D4AA', '#6366F1', '#F59E0B', '#10B981', '#EF4444']
  const canvas  = document.createElement('canvas')
  canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999'
  canvas.width  = window.innerWidth
  canvas.height = window.innerHeight
  document.body.appendChild(canvas)

  const ctx = canvas.getContext('2d')
  const pieces = Array.from({ length: 120 }, () => ({
    x:    Math.random() * canvas.width,
    y:    Math.random() * -canvas.height,
    w:    6 + Math.random() * 8,
    h:    10 + Math.random() * 6,
    color: colors[Math.floor(Math.random() * colors.length)],
    angle: Math.random() * Math.PI * 2,
    spin:  (Math.random() - 0.5) * 0.15,
    vy:   2 + Math.random() * 3,
    vx:   (Math.random() - 0.5) * 2,
  }))

  let frame = 0
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    pieces.forEach(p => {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.angle)
      ctx.fillStyle = p.color
      ctx.globalAlpha = Math.max(0, 1 - frame / 180)
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
      ctx.restore()
      p.x += p.vx; p.y += p.vy; p.angle += p.spin
    })
    frame++
    if (frame < 210) requestAnimationFrame(draw)
    else canvas.remove()
  }
  requestAnimationFrame(draw)
}

// ── Events ────────────────────────────────────────────────────────────────────

function bindEvents() {
  container.querySelector('#leave-after-btn')?.addEventListener('click', () => {
    if (!confirm('Leave this session? You can rejoin with the same code.')) return
    leaveSession()
    window.location.hash = '#dashboard'
  })
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const pl    = (r, s) => Math.round((r.total_value - s) * 100) / 100
const plPct = (r, s) => (r.total_value - s) / s * 100

function formatDuration(start, end) {
  const ms  = end - start
  const min = Math.floor(ms / 60000)
  if (min < 60) return `${min}m`
  const hr = Math.floor(min / 60)
  const rm = min % 60
  return rm > 0 ? `${hr}h ${rm}m` : `${hr}h`
}
