// session.js — class session join/leave and Supabase portfolio sync
// All functions are null-safe: no-op when supabase is not configured.

import { supabase } from './supabase.js'
import { getUser } from '../utils/auth.js'
import { getState } from '../state/store.js'
import { portfolioValue } from '../api/prices.js'

// ── Join ──────────────────────────────────────────────────────────────────────

// Looks up a session by join code and enrolls the current user.
// Returns { session, portfolio } on success, throws on error.
export async function joinSession(joinCode) {
  if (!supabase) throw new Error('Supabase not configured')
  const user = await getUser()
  if (!user) throw new Error('Not logged in')

  // Resolve the session
  const { data: session, error: sessErr } = await supabase
    .from('sessions')
    .select('*')
    .eq('join_code', joinCode.trim().toUpperCase())
    .single()

  if (sessErr || !session) throw new Error('Invalid join code')
  if (session.status === 'ended') throw new Error('This session has ended')

  // Enroll (ignore conflict — already joined is fine)
  await supabase.from('session_participants').upsert(
    { session_id: session.id, user_id: user.id },
    { onConflict: 'session_id,user_id' }
  )

  // Create or retrieve portfolio row
  const { data: portfolio, error: portErr } = await supabase
    .from('portfolios')
    .upsert(
      {
        session_id:  session.id,
        user_id:     user.id,
        balance:     session.starting_balance,
        holdings:    {},
        total_value: session.starting_balance,
      },
      { onConflict: 'session_id,user_id', ignoreDuplicates: true }
    )
    .select()
    .single()

  if (portErr) throw new Error('Failed to create portfolio')

  // Persist the active session id locally so the app remembers it on reload
  localStorage.setItem('stockpilot_session_id', session.id)

  return { session, portfolio }
}

// ── Leave ─────────────────────────────────────────────────────────────────────

export function leaveSession() {
  localStorage.removeItem('stockpilot_session_id')
}

// ── Current session ───────────────────────────────────────────────────────────

export function getActiveSessionId() {
  return localStorage.getItem('stockpilot_session_id') ?? null
}

// Fetches the full session row for the currently stored session id, or null.
export async function getActiveSession() {
  const id = getActiveSessionId()
  if (!id || !supabase) return null
  const { data } = await supabase.from('sessions').select('*').eq('id', id).single()
  return data ?? null
}

// ── Sync ──────────────────────────────────────────────────────────────────────

// Pushes the current local portfolio state up to the portfolios table.
// Call this after every trade. Fire-and-forget — we don't block the UI on it.
export async function syncPortfolio() {
  if (!supabase) return
  const sessionId = getActiveSessionId()
  if (!sessionId) return
  const user = await getUser()
  if (!user) return

  const state = getState()
  const total = state.user.balance + portfolioValue(state.holdings)

  await supabase.from('portfolios').update({
    balance:     state.user.balance,
    holdings:    state.holdings,
    total_value: total,
    xp:          state.user.xp,
    badges:      state.achievements,
    updated_at:  new Date().toISOString(),
  }).eq('session_id', sessionId).eq('user_id', user.id)
}

// Writes a transaction row to Supabase after a trade executes.
export async function syncTransaction(tx) {
  if (!supabase) return
  const sessionId = getActiveSessionId()
  if (!sessionId) return
  const user = await getUser()
  if (!user) return

  // Look up the portfolio id
  const { data: port } = await supabase
    .from('portfolios')
    .select('id')
    .eq('session_id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (!port) return

  await supabase.from('transactions').insert({
    portfolio_id:  port.id,
    session_id:    sessionId,
    user_id:       user.id,
    symbol:        tx.symbol,
    side:          tx.type,
    shares:        tx.qty,
    price:         tx.price,
    fee:           tx.fee ?? 0,
    realized_gain: tx.realizedGain ?? null,
  })
}
