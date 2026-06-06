// teacher.js — teacher / admin panel
// Lets teachers create sessions, manage status, view participants,
// post announcements, and fire market events.
// Only renders usefully when the logged-in profile has role = 'teacher' or 'admin'.

import { supabase } from '../lib/supabase.js'
import { getUser } from '../utils/auth.js'
import { pc } from '../utils/format.js'
import { STOCKS } from '../data/stocks.js'

let container        = null
let profile          = null   // current user's profile row
let sessions         = []     // sessions owned by this teacher
let activeId         = null   // currently selected session id
let participants     = []     // portfolios for the active session
let annChannel       = null   // realtime channel for participants
let view             = 'sessions'  // 'sessions' | 'session-detail'
let autoEventTimer   = null   // setInterval handle for auto events

const PRESET_EVENTS = [
  { title: 'Fed Rate Hike', body: 'Federal Reserve raises rates 0.75%. Bond yields surge; tech stocks under pressure.' },
  { title: 'Bull Run', body: 'Strong jobs report sends markets soaring. Broad rally across all sectors.' },
  { title: 'Tech Selloff', body: 'NASDAQ drops 3% amid valuation concerns. Growth stocks take the hardest hit.' },
  { title: 'Oil Spike', body: 'OPEC cuts production by 2 million barrels/day. Energy surges; airlines and transport suffer.' },
  { title: 'Flash Crash', body: 'Algorithmic trading triggers a sudden 5% market-wide drop. Circuit breakers activated.' },
  { title: 'Earnings Surprise', body: 'Major tech firms beat expectations by 20%. Pre-market futures up sharply.' },
  { title: 'Banking Jitters', body: 'Regional bank failures spark panic selling in the financial sector.' },
  { title: 'Inflation Shock', body: 'CPI comes in at 8.5% — far above estimates. Rate-hike fears rattle markets.' },
  { title: 'Trade War Tariffs', body: 'New 25% tariffs announced on imports. Consumer goods and tech face headwinds.' },
  { title: 'Biotech Breakthrough', body: 'Major FDA drug approval announced after Phase 3 success. Healthcare stocks surge.' },
  { title: 'Crypto Contagion', body: 'Major stablecoin collapses. Risk-off sentiment spills into equities.' },
  { title: 'Supply Chain Relief', body: 'Port backlogs clear as shipping costs fall 40%. Consumer stocks rally.' },
]

export async function mountTeacher(el) {
  container = el
  renderLoading()

  if (!supabase) { renderNoSupabase(); return }

  const user = await getUser()
  if (!user) { renderNotLoggedIn(); return }

  const { data: prof } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  profile = prof

  if (!profile || !['teacher', 'admin'].includes(profile.role)) {
    renderNotTeacher()
    return
  }

  await loadSessions()
  render()
}

export function unmountTeacher() {
  if (annChannel)     { supabase?.removeChannel(annChannel); annChannel = null }
  if (autoEventTimer) { clearInterval(autoEventTimer); autoEventTimer = null }
  container    = null
  profile      = null
  sessions     = []
  participants = []
  activeId     = null
  view         = 'sessions'
}

// ── Data ──────────────────────────────────────────────────────────────────────

async function loadSessions() {
  const { data } = await supabase
    .from('sessions')
    .select('*')
    .eq('teacher_id', profile.id)
    .order('created_at', { ascending: false })
  sessions = data ?? []
}

async function loadParticipants(sessionId) {
  const { data } = await supabase
    .from('leaderboard')
    .select('user_id, display_name, balance, total_value, xp, rank')
    .eq('session_id', sessionId)
    .order('rank', { ascending: true })
  participants = data ?? []
}

async function loadAnnouncements(sessionId) {
  const { data } = await supabase
    .from('announcements')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(20)
  return data ?? []
}

async function loadMarketEvents(sessionId) {
  const { data } = await supabase
    .from('market_events')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(20)
  return data ?? []
}

function subscribeParticipants(sessionId) {
  if (annChannel) supabase.removeChannel(annChannel)
  annChannel = supabase
    .channel(`teacher:${sessionId}`)
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'portfolios',
      filter: `session_id=eq.${sessionId}`,
    }, async () => {
      await loadParticipants(sessionId)
      refreshParticipantTable()
    })
    .subscribe()
}

// ── Render helpers ────────────────────────────────────────────────────────────

function renderLoading() {
  if (!container) return
  container.innerHTML = `<div class="flex items-center justify-center min-h-[60vh] text-text-muted text-sm">Loading…</div>`
}

function renderNoSupabase() {
  if (!container) return
  container.innerHTML = message('Supabase Not Configured', 'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local to enable the teacher panel.')
}

function renderNotLoggedIn() {
  if (!container) return
  container.innerHTML = message('Not Logged In', 'Please log in first.', '#dashboard', 'Go to Dashboard')
}

function renderNotTeacher() {
  if (!container) return
  container.innerHTML = message('Access Denied',
    `Your account (${profile?.display_name}) doesn't have teacher permissions. Ask an admin to update your role in Supabase.`,
    '#dashboard', 'Go to Dashboard')
}

function message(title, body, href, linkText) {
  return `
    <div class="max-w-4xl mx-auto px-4 py-6">
      <div class="bg-surface border border-border rounded-2xl p-12 text-center">
        <div class="text-lg font-semibold text-text-primary mb-2">${title}</div>
        <div class="text-sm text-text-muted max-w-sm mx-auto">${body}</div>
        ${href ? `<a href="${href}" class="inline-block mt-6 px-5 py-2.5 rounded-xl bg-accent-primary text-bg text-sm font-semibold hover:bg-accent-primary/90 transition-colors">${linkText}</a>` : ''}
      </div>
    </div>
  `
}

function downloadCSV(sess) {
  const rows = [['Rank', 'Name', 'Total Value (PC$)', 'P&L (PC$)', 'P&L %', 'XP']]
  participants.forEach(p => {
    const pl = p.total_value - sess.starting_balance
    const plPct = (pl / sess.starting_balance) * 100
    rows.push([p.rank, p.display_name, p.total_value.toFixed(2), pl.toFixed(2), plPct.toFixed(2) + '%', p.xp ?? 0])
  })
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `${sess.name.replace(/\s+/g, '_')}_results.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Main render ───────────────────────────────────────────────────────────────

function render() {
  if (!container) return
  if (view === 'session-detail' && activeId) {
    renderDetail()
  } else {
    renderSessionList()
  }
}

function renderSessionList() {
  if (!container) return
  container.innerHTML = `
    <div class="max-w-5xl mx-auto px-4 py-6 space-y-6">

      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-display font-bold text-text-primary">Teacher Panel</h1>
          <p class="text-sm text-text-muted mt-0.5">Welcome, ${profile.display_name}</p>
        </div>
        <button id="new-session-btn"
          class="px-4 py-2.5 rounded-xl bg-accent-primary text-bg text-sm font-semibold hover:bg-accent-primary/90 transition-colors">
          + New Session
        </button>
      </div>

      <!-- Create session form (hidden by default) -->
      <div id="create-form" class="hidden bg-surface border border-accent-primary/30 rounded-2xl p-5 space-y-4">
        <h2 class="font-semibold text-text-primary">Create New Session</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="text-xs text-text-muted mb-1.5 block">Session Name</label>
            <input id="sess-name" type="text" placeholder="Period 3 — Spring 2026"
              class="w-full bg-bg border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary transition-colors" />
          </div>
          <div>
            <label class="text-xs text-text-muted mb-1.5 block">Starting Balance (PC$)</label>
            <input id="sess-balance" type="number" value="10000" min="1000" step="1000"
              class="w-full bg-bg border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-primary transition-colors" />
          </div>
          <div>
            <label class="text-xs text-text-muted mb-1.5 block">End Date/Time (optional)</label>
            <input id="sess-ends-at" type="datetime-local"
              class="w-full bg-bg border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-primary transition-colors" />
          </div>
        </div>
        <div class="flex gap-3">
          <button id="create-confirm-btn"
            class="px-5 py-2.5 rounded-xl bg-accent-primary text-bg text-sm font-semibold hover:bg-accent-primary/90 transition-colors">
            Create
          </button>
          <button id="create-cancel-btn"
            class="px-5 py-2.5 rounded-xl bg-surface-elevated border border-border text-sm text-text-muted hover:text-text-primary transition-colors">
            Cancel
          </button>
        </div>
        <div id="create-error" class="hidden text-xs text-loss"></div>
      </div>

      <!-- Session list -->
      ${sessions.length === 0
        ? `<div class="bg-surface border border-border rounded-2xl p-12 text-center text-text-muted text-sm">No sessions yet. Create one to get started.</div>`
        : `<div class="space-y-3">
            ${sessions.map(s => sessionCard(s)).join('')}
           </div>`}

    </div>
  `
  bindListEvents()
}

function sessionCard(s) {
  const statusColor = { waiting: 'text-text-muted', active: 'text-gain', paused: 'text-warning', ended: 'text-loss' }[s.status] ?? 'text-text-muted'
  const dot = { waiting: 'bg-text-muted', active: 'bg-gain animate-pulse', paused: 'bg-warning', ended: 'bg-loss' }[s.status] ?? 'bg-text-muted'
  const created = new Date(s.created_at).toLocaleDateString()
  return `
    <div class="bg-surface border border-border rounded-2xl p-5 flex items-center justify-between gap-4 hover:border-accent-primary/50 transition-colors cursor-pointer session-card" data-id="${s.id}">
      <div class="flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl bg-accent-primary/10 border border-accent-primary/30 flex items-center justify-center text-xs font-bold text-accent-primary">S</div>
        <div>
          <div class="font-semibold text-text-primary">${s.name}</div>
          <div class="flex items-center gap-2 mt-0.5">
            <span class="w-1.5 h-1.5 rounded-full ${dot}"></span>
            <span class="text-xs ${statusColor} capitalize">${s.status}</span>
            <span class="text-xs text-text-muted">· Code: <span class="font-mono font-bold text-text-secondary">${s.join_code}</span></span>
            <span class="text-xs text-text-muted">· ${pc(s.starting_balance)} start · Created ${created}</span>
          </div>
        </div>
      </div>
      <span class="text-accent-primary text-sm shrink-0">Manage →</span>
    </div>
  `
}

async function renderDetail() {
  if (!container || !activeId) return
  const sess = sessions.find(s => s.id === activeId)
  if (!sess) return

  await loadParticipants(activeId)
  const announcements = await loadAnnouncements(activeId)
  const events = await loadMarketEvents(activeId)

  const statusOptions = ['waiting', 'active', 'paused', 'ended']
  const startingBal = sess.starting_balance

  container.innerHTML = `
    <div class="max-w-5xl mx-auto px-4 py-6 space-y-6">

      <!-- Header -->
      <div class="flex items-center gap-3">
        <button id="back-btn" class="text-text-muted hover:text-text-primary transition-colors text-sm">← Back</button>
        <div class="flex-1">
          <h1 class="text-xl font-display font-bold text-text-primary">${sess.name}</h1>
          <div class="flex items-center gap-2 mt-0.5 text-xs text-text-muted">
            Code: <span class="font-mono font-bold text-text-secondary bg-surface-elevated border border-border px-1.5 py-0.5 rounded">${sess.join_code}</span>
            <button id="copy-code-btn" class="text-accent-primary hover:underline">Copy</button>
            <span>· ${pc(sess.starting_balance)} starting balance</span>
          </div>
        </div>
      </div>

      <!-- Status control -->
      <div class="bg-surface border border-border rounded-2xl p-5">
        <h2 class="font-semibold text-text-primary mb-3">Session Status</h2>
        <div class="flex gap-2 flex-wrap">
          ${statusOptions.map(st => `
            <button data-status="${st}"
              class="status-btn px-4 py-2 rounded-xl text-sm font-semibold border transition-colors
              ${sess.status === st
                ? 'bg-accent-primary text-bg border-accent-primary'
                : 'bg-surface-elevated border-border text-text-muted hover:text-text-primary hover:border-accent-primary/50'}">
              ${st.charAt(0).toUpperCase() + st.slice(1)}
            </button>
          `).join('')}
        </div>
        <p class="text-xs text-text-muted mt-3">
          <strong class="text-text-secondary">waiting</strong> — lobby, students can join ·
          <strong class="text-text-secondary">active</strong> — trading open ·
          <strong class="text-text-secondary">paused</strong> — trading locked ·
          <strong class="text-text-secondary">ended</strong> — session complete
        </p>
      </div>

      <!-- Two-column grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <!-- Participants -->
        <div class="bg-surface border border-border rounded-2xl overflow-hidden">
          <div class="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 class="font-semibold text-text-primary">Participants <span class="text-text-muted text-sm font-normal">(${participants.length})</span></h2>
            <div class="flex items-center gap-2">
              <button id="leaderboard-toggle-btn"
                class="px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors
                ${sess.leaderboard_hidden
                  ? 'bg-warning/10 border-warning/40 text-warning hover:bg-warning/20'
                  : 'bg-surface-elevated border-border text-text-secondary hover:text-text-primary hover:border-accent-primary/50'}">
                ${sess.leaderboard_hidden ? 'Show Leaderboard' : 'Hide Leaderboard'}
              </button>
              ${participants.length > 0 ? `
                <button id="export-csv-btn" class="px-3 py-1.5 rounded-lg bg-surface-elevated border border-border text-xs font-semibold text-text-secondary hover:text-text-primary hover:border-accent-primary/50 transition-colors">
                  Export CSV
                </button>` : ''}
            </div>
          </div>
          <div id="participant-table" class="divide-y divide-border max-h-72 overflow-y-auto">
            ${participantRows(startingBal)}
          </div>
        </div>

        <!-- Announcements -->
        <div class="bg-surface border border-border rounded-2xl overflow-hidden">
          <div class="px-5 py-4 border-b border-border">
            <h2 class="font-semibold text-text-primary">Announcements</h2>
          </div>
          <div class="p-4 border-b border-border">
            <textarea id="ann-text" rows="2" placeholder="Post an announcement to all students…"
              class="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary transition-colors resize-none"></textarea>
            <div class="flex items-center gap-2 mt-2">
              <button id="ann-submit"
                class="px-4 py-2 rounded-lg bg-accent-primary text-bg text-xs font-semibold hover:bg-accent-primary/90 transition-colors">
                Post
              </button>
              <label class="flex items-center gap-1.5 text-xs text-text-muted cursor-pointer">
                <input id="ann-pin" type="checkbox" class="rounded" /> Pin to top
              </label>
            </div>
          </div>
          <div class="divide-y divide-border max-h-48 overflow-y-auto">
            ${announcements.length === 0
              ? `<div class="px-5 py-4 text-sm text-text-muted">No announcements yet.</div>`
              : announcements.map(a => `
                  <div class="px-5 py-3 ${a.pinned ? 'bg-accent-primary/5' : ''}">
                    ${a.pinned ? `<span class="text-[10px] text-accent-primary font-semibold uppercase tracking-wide">Pinned · </span>` : ''}
                    <span class="text-sm text-text-primary">${a.message}</span>
                    <div class="text-[10px] text-text-muted mt-0.5">${new Date(a.created_at).toLocaleString()}</div>
                  </div>
                `).join('')}
          </div>
        </div>

      </div>

      <!-- Market Events -->
      <div class="bg-surface border border-border rounded-2xl overflow-hidden">
        <div class="px-5 py-4 border-b border-border">
          <h2 class="font-semibold text-text-primary">Market Events</h2>
          <p class="text-xs text-text-muted mt-0.5">Broadcast surprise events — students see them as notifications. In simulation mode, price multipliers are applied automatically.</p>
        </div>
        <div class="p-5 border-b border-border space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="text-xs text-text-muted mb-1.5 block">Event Title</label>
              <input id="evt-title" type="text" placeholder="Fed Rate Hike Shock"
                class="w-full bg-bg border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary transition-colors" />
            </div>
            <div>
              <label class="text-xs text-text-muted mb-1.5 block">Body / Flavour Text</label>
              <input id="evt-body" type="text" placeholder="The Fed raised rates 0.75%. Tech stocks in freefall."
                class="w-full bg-bg border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary transition-colors" />
            </div>
          </div>
          <!-- Affected stocks -->
          <div>
            <label class="text-xs text-text-muted mb-2 block">Affected Stocks (optional — leave blank for market-wide)</label>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2" id="evt-stocks">
              ${STOCKS.slice(0, 12).map(s => `
                <label class="flex items-center gap-2 text-xs cursor-pointer">
                  <input type="checkbox" class="evt-stock-chk rounded" value="${s.symbol}" />
                  <span class="font-mono font-semibold text-text-primary">${s.symbol}</span>
                  <input type="number" step="0.05" value="0.9" min="0.1" max="2"
                    class="evt-mult w-16 bg-bg border border-border rounded px-1.5 py-0.5 text-xs text-text-muted focus:outline-none focus:border-accent-primary" />
                  <span class="text-text-muted">×</span>
                </label>
              `).join('')}
            </div>
            <p class="text-[10px] text-text-muted mt-1.5">Multiplier: 0.9 = −10%, 1.1 = +10%, etc. Only used in simulation mode.</p>
          </div>
          <button id="evt-submit"
            class="px-5 py-2.5 rounded-xl bg-warning text-bg text-sm font-semibold hover:bg-warning/90 transition-colors">
            Fire Event
          </button>
          <div id="evt-error" class="hidden text-xs text-loss"></div>
        </div>

        <!-- Past events -->
        <div class="divide-y divide-border max-h-48 overflow-y-auto">
          ${events.length === 0
            ? `<div class="px-5 py-4 text-sm text-text-muted">No events fired yet.</div>`
            : events.map(e => `
                <div class="px-5 py-3">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-semibold text-warning">${e.title}</span>
                    <span class="text-[10px] text-text-muted">${new Date(e.created_at).toLocaleString()}</span>
                  </div>
                  <div class="text-xs text-text-muted mt-0.5">${e.body}</div>
                </div>
              `).join('')}
        </div>
      </div>

      <!-- Auto Events -->
      <div class="bg-surface border border-border rounded-2xl p-5 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="font-semibold text-text-primary">Auto Events</h2>
            <p class="text-xs text-text-muted mt-0.5">Randomly fire preset market events at a set interval — keeps the session dynamic without manual input.</p>
          </div>
          <button id="auto-evt-toggle"
            class="px-4 py-2 rounded-xl border text-sm font-semibold transition-colors
            ${autoEventTimer
              ? 'bg-warning/10 border-warning/40 text-warning hover:bg-warning/20'
              : 'bg-surface-elevated border-border text-text-muted hover:text-text-primary hover:border-accent-primary/50'}">
            ${autoEventTimer ? 'Stop' : 'Start'}
          </button>
        </div>
        <div class="flex items-center gap-3 flex-wrap">
          <label class="text-xs text-text-muted">Interval:</label>
          <select id="auto-evt-interval"
            class="bg-bg border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent-primary ${autoEventTimer ? 'opacity-50 pointer-events-none' : ''}">
            <option value="60000">1 minute</option>
            <option value="300000" selected>5 minutes</option>
            <option value="600000">10 minutes</option>
            <option value="900000">15 minutes</option>
          </select>
          ${autoEventTimer ? `<span class="text-xs text-warning">Running — next random event will fire automatically</span>` : ''}
        </div>
        <div class="text-xs text-text-muted">
          ${PRESET_EVENTS.length} preset events available: ${PRESET_EVENTS.map(e => `<span class="font-medium text-text-secondary">${e.title}</span>`).join(', ')}
        </div>
      </div>

    </div>
  `

  bindDetailEvents(sess)
  subscribeParticipants(activeId)
}

function participantRows(startingBal) {
  if (participants.length === 0) {
    return `<div class="px-5 py-6 text-sm text-text-muted">No participants yet.</div>`
  }
  return participants.map(p => {
    const pl = p.total_value - startingBal
    const plPct = (pl / startingBal) * 100
    return `
      <div class="flex items-center gap-3 px-5 py-3">
        <span class="w-8 text-center text-xs font-bold text-text-muted">#${p.rank}</span>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium text-text-primary truncate">${p.display_name}</div>
          <div class="text-[10px] text-text-muted">${(p.xp ?? 0).toLocaleString()} XP</div>
        </div>
        <div class="text-right mr-2">
          <div class="text-sm font-mono font-bold text-text-primary">${pc(p.total_value)}</div>
          <div class="text-[10px] ${pl >= 0 ? 'text-gain' : 'text-loss'}">${pl >= 0 ? '+' : ''}${plPct.toFixed(2)}%</div>
        </div>
        <button data-reset-student="${p.user_id}" data-student-name="${p.display_name}"
          class="reset-student-btn shrink-0 px-2 py-1 rounded-lg border border-loss/30 text-[10px] text-loss hover:bg-loss/10 transition-colors">
          Reset
        </button>
      </div>
    `
  }).join('')
}

function refreshParticipantTable() {
  const sess = sessions.find(s => s.id === activeId)
  const table = container?.querySelector('#participant-table')
  if (table && sess) table.innerHTML = participantRows(sess.starting_balance)
}

// ── Events ────────────────────────────────────────────────────────────────────

function bindListEvents() {
  container.querySelector('#new-session-btn')?.addEventListener('click', () => {
    container.querySelector('#create-form')?.classList.toggle('hidden')
  })

  container.querySelector('#create-cancel-btn')?.addEventListener('click', () => {
    container.querySelector('#create-form')?.classList.add('hidden')
  })

  container.querySelector('#create-confirm-btn')?.addEventListener('click', async () => {
    const name    = container.querySelector('#sess-name')?.value.trim()
    const balance = parseFloat(container.querySelector('#sess-balance')?.value) || 10000
    const errEl   = container.querySelector('#create-error')

    if (!name) { errEl.textContent = 'Session name is required.'; errEl.classList.remove('hidden'); return }

    const btn = container.querySelector('#create-confirm-btn')
    btn.disabled = true; btn.textContent = 'Creating…'
    errEl.classList.add('hidden')

    const endsAtVal = container.querySelector('#sess-ends-at')?.value
    const { data, error } = await supabase.from('sessions').insert({
      teacher_id:       profile.id,
      name,
      join_code:        'XXXXXX',   // trigger will overwrite this
      starting_balance: balance,
      ...(endsAtVal ? { ends_at: new Date(endsAtVal).toISOString() } : {}),
    }).select().single()

    if (error) {
      errEl.textContent = error.message
      errEl.classList.remove('hidden')
      btn.disabled = false; btn.textContent = 'Create'
      return
    }

    sessions.unshift(data)
    view = 'sessions'
    renderSessionList()
  })

  container.querySelectorAll('.session-card').forEach(card => {
    card.addEventListener('click', async () => {
      activeId = card.dataset.id
      view = 'session-detail'
      await renderDetail()
    })
  })
}

function bindDetailEvents(sess) {
  container.querySelector('#export-csv-btn')?.addEventListener('click', () => downloadCSV(sess))

  container.querySelector('#leaderboard-toggle-btn')?.addEventListener('click', async () => {
    const newVal = !sess.leaderboard_hidden
    const { error } = await supabase.from('sessions').update({ leaderboard_hidden: newVal }).eq('id', sess.id)
    if (!error) {
      sess.leaderboard_hidden = newVal
      const btn = container.querySelector('#leaderboard-toggle-btn')
      if (btn) {
        btn.textContent = newVal ? 'Show Leaderboard' : 'Hide Leaderboard'
        btn.className = `px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${newVal ? 'bg-warning/10 border-warning/40 text-warning hover:bg-warning/20' : 'bg-surface-elevated border-border text-text-secondary hover:text-text-primary hover:border-accent-primary/50'}`
      }
    }
  })

  container.querySelectorAll('.reset-student-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const userId = btn.dataset.resetStudent
      const name   = btn.dataset.studentName
      if (!confirm(`Reset ${name}'s portfolio to PC$${sess.starting_balance.toLocaleString()}? This cannot be undone.`)) return
      btn.disabled = true; btn.textContent = '…'
      const { error } = await supabase.rpc('reset_student_portfolio', {
        p_session_id: sess.id,
        p_user_id:    userId,
      })
      btn.disabled = false; btn.textContent = 'Reset'
      if (error) alert('Reset failed: ' + error.message)
      else await renderDetail()
    })
  })

  container.querySelector('#back-btn')?.addEventListener('click', () => {
    if (annChannel) { supabase.removeChannel(annChannel); annChannel = null }
    view = 'sessions'
    renderSessionList()
  })

  container.querySelector('#copy-code-btn')?.addEventListener('click', () => {
    navigator.clipboard.writeText(sess.join_code)
      .then(() => { const b = container.querySelector('#copy-code-btn'); if (b) { b.textContent = 'Copied!'; setTimeout(() => { if (b) b.textContent = 'Copy' }, 1500) } })
  })

  // Status change buttons
  container.querySelectorAll('.status-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const newStatus = btn.dataset.status
      if (newStatus === sess.status) return
      if (newStatus === 'ended' && !confirm('End this session? Students will no longer be able to trade.')) return

      const { error } = await supabase
        .from('sessions')
        .update({ status: newStatus })
        .eq('id', sess.id)

      if (!error) {
        sess.status = newStatus
        const idx = sessions.findIndex(s => s.id === sess.id)
        if (idx >= 0) sessions[idx].status = newStatus
        // Re-highlight buttons
        container.querySelectorAll('.status-btn').forEach(b => {
          const active = b.dataset.status === newStatus
          b.className = `status-btn px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${active ? 'bg-accent-primary text-bg border-accent-primary' : 'bg-surface-elevated border-border text-text-muted hover:text-text-primary hover:border-accent-primary/50'}`
        })
      }
    })
  })

  // Announcement
  container.querySelector('#ann-submit')?.addEventListener('click', async () => {
    const text = container.querySelector('#ann-text')?.value.trim()
    const pinned = container.querySelector('#ann-pin')?.checked ?? false
    if (!text) return

    const btn = container.querySelector('#ann-submit')
    btn.disabled = true; btn.textContent = 'Posting…'

    await supabase.from('announcements').insert({
      session_id: sess.id,
      teacher_id: profile.id,
      message:    text,
      pinned,
    })

    btn.disabled = false; btn.textContent = 'Post'
    container.querySelector('#ann-text').value = ''
    // Refresh announcements section by re-rendering the detail page
    await renderDetail()
  })

  // Auto events toggle
  container.querySelector('#auto-evt-toggle')?.addEventListener('click', async () => {
    if (autoEventTimer) {
      clearInterval(autoEventTimer)
      autoEventTimer = null
      await renderDetail()
      return
    }
    const intervalMs = parseInt(container.querySelector('#auto-evt-interval')?.value || '300000')
    const fireRandom = async () => {
      const evt = PRESET_EVENTS[Math.floor(Math.random() * PRESET_EVENTS.length)]
      await supabase.from('market_events').insert({
        session_id: sess.id,
        teacher_id: profile.id,
        title:      evt.title,
        body:       evt.body,
        affects:    [],
      })
    }
    await fireRandom()
    autoEventTimer = setInterval(fireRandom, intervalMs)
    await renderDetail()
  })

  // Market event
  container.querySelector('#evt-submit')?.addEventListener('click', async () => {
    const title = container.querySelector('#evt-title')?.value.trim()
    const body  = container.querySelector('#evt-body')?.value.trim()
    const errEl = container.querySelector('#evt-error')
    errEl.classList.add('hidden')

    if (!title || !body) {
      errEl.textContent = 'Title and body are required.'
      errEl.classList.remove('hidden')
      return
    }

    // Collect checked stocks + their multipliers
    const affects = []
    container.querySelectorAll('.evt-stock-chk:checked').forEach(chk => {
      const row  = chk.closest('label')
      const mult = parseFloat(row.querySelector('.evt-mult')?.value) || 1
      affects.push({ symbol: chk.value, multiplier: mult })
    })

    const btn = container.querySelector('#evt-submit')
    btn.disabled = true; btn.textContent = 'Firing…'

    const { error } = await supabase.from('market_events').insert({
      session_id: sess.id,
      teacher_id: profile.id,
      title,
      body,
      affects,
    })

    btn.disabled = false; btn.textContent = 'Fire Event'

    if (error) {
      errEl.textContent = error.message
      errEl.classList.remove('hidden')
      return
    }

    container.querySelector('#evt-title').value = ''
    container.querySelector('#evt-body').value = ''
    await renderDetail()
  })
}
