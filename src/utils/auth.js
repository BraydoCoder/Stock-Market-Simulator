// auth.js — Supabase Auth helpers
// All functions are null-safe: if supabase is null (no env vars), they no-op
// so the app still works in offline/simulation mode.

import { supabase } from '../lib/supabase.js'

export async function getUser() {
  if (!supabase) return null
  const { data } = await supabase.auth.getUser()
  return data?.user ?? null
}

export async function getSession() {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data?.session ?? null
}

export async function signUp({ email, password, displayName }) {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  })
  if (error) throw error
  return data
}

export async function signIn({ email, password }) {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  if (!supabase) return
  await supabase.auth.signOut()
}

// Returns the profile row for the current user, or null.
export async function getProfile() {
  if (!supabase) return null
  const user = await getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  return data ?? null
}

export async function updateProfile(patch) {
  if (!supabase) return
  const user = await getUser()
  if (!user) return
  await supabase.from('profiles').update(patch).eq('id', user.id)
}
