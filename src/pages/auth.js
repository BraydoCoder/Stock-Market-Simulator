// auth.js — Login / Sign-up page
// Shown when Supabase is configured but the user is not logged in.
// On success, dispatches 'auth-ready' so main.js can continue boot.

import { signIn, signUp } from '../utils/auth.js'
import { supabase } from '../lib/supabase.js'

let container = null
let tab = 'login'  // 'login' | 'signup'

export function mountAuth(el) {
  container = el
  render()
}

export function unmountAuth() {
  container = null
  tab = 'login'
}

function render() {
  if (!container) return
  container.innerHTML = `
    <div class="min-h-screen bg-bg flex items-center justify-center px-4">
      <div class="w-full max-w-sm">

        <!-- Logo -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center gap-2 mb-3">
            <span class="text-3xl">✈</span>
            <span class="text-2xl font-display font-bold text-text-primary">StockPilot</span>
          </div>
          <p class="text-sm text-text-muted">The gamified stock market simulator</p>
        </div>

        <!-- Card -->
        <div class="bg-surface border border-border rounded-2xl p-6 shadow-xl">

          <!-- Tab toggles -->
          <div class="flex gap-1 bg-surface-elevated rounded-lg p-1 mb-6">
            <button id="tab-login" class="tab-btn flex-1 py-2 rounded-md text-sm font-medium transition-colors
              ${tab === 'login' ? 'bg-surface text-text-primary shadow' : 'text-text-muted hover:text-text-primary'}">
              Log In
            </button>
            <button id="tab-signup" class="tab-btn flex-1 py-2 rounded-md text-sm font-medium transition-colors
              ${tab === 'signup' ? 'bg-surface text-text-primary shadow' : 'text-text-muted hover:text-text-primary'}">
              Sign Up
            </button>
          </div>

          <!-- Form -->
          <form id="auth-form" class="space-y-4" novalidate>

            ${tab === 'signup' ? `
            <div>
              <label class="block text-xs text-text-muted mb-1.5">Display Name</label>
              <input id="field-name" type="text" placeholder="Ace Trader"
                class="w-full bg-bg border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary transition-colors" />
            </div>
            ` : ''}

            <div>
              <label class="block text-xs text-text-muted mb-1.5">Email</label>
              <input id="field-email" type="email" placeholder="you@school.edu"
                class="w-full bg-bg border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary transition-colors" />
            </div>

            <div>
              <label class="block text-xs text-text-muted mb-1.5">Password</label>
              <div class="relative">
                <input id="field-password" type="password" placeholder="••••••••"
                  class="w-full bg-bg border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary transition-colors pr-10" />
                <button type="button" id="pw-toggle"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary text-xs">
                  Show
                </button>
              </div>
            </div>

            <!-- Error banner -->
            <div id="auth-error" class="hidden text-xs text-loss bg-loss/10 border border-loss/30 rounded-lg px-3 py-2"></div>

            <!-- Submit -->
            <button type="submit" id="auth-submit"
              class="w-full py-2.5 rounded-xl bg-accent-primary text-bg text-sm font-semibold hover:bg-accent-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2">
              ${tab === 'login' ? 'Log In' : 'Create Account'}
            </button>

          </form>

          ${tab === 'signup' ? `
          <p class="text-[10px] text-text-muted text-center mt-4">
            By signing up you agree to use this app for educational purposes only.
          </p>
          ` : ''}

        </div>

        <!-- Join code hint -->
        <p class="text-center text-xs text-text-muted mt-6">
          Have a class join code? Log in first, then enter it on the dashboard.
        </p>

      </div>
    </div>
  `

  bindEvents()
}

function bindEvents() {
  const form      = container.querySelector('#auth-form')
  const errBanner = container.querySelector('#auth-error')
  const submitBtn = container.querySelector('#auth-submit')
  const pwToggle  = container.querySelector('#pw-toggle')
  const pwField   = container.querySelector('#field-password')

  container.querySelector('#tab-login')?.addEventListener('click',  () => { tab = 'login';  render() })
  container.querySelector('#tab-signup')?.addEventListener('click', () => { tab = 'signup'; render() })

  pwToggle?.addEventListener('click', () => {
    const isHidden = pwField.type === 'password'
    pwField.type   = isHidden ? 'text' : 'password'
    pwToggle.textContent = isHidden ? 'Hide' : 'Show'
  })

  form?.addEventListener('submit', async (e) => {
    e.preventDefault()
    errBanner.classList.add('hidden')
    errBanner.textContent = ''
    submitBtn.disabled = true
    submitBtn.textContent = tab === 'login' ? 'Logging in…' : 'Creating account…'

    const email    = container.querySelector('#field-email')?.value.trim()
    const password = container.querySelector('#field-password')?.value
    const name     = container.querySelector('#field-name')?.value.trim()

    if (!email || !password) {
      showError('Please fill in all fields.')
      submitBtn.disabled = false
      submitBtn.textContent = tab === 'login' ? 'Log In' : 'Create Account'
      return
    }

    try {
      if (tab === 'login') {
        await signIn({ email, password })
      } else {
        if (!name) { showError('Please enter a display name.'); reset(); return }
        const { user } = await signUp({ email, password, displayName: name })
        if (!user?.confirmed_at && !user?.email_confirmed_at) {
          showConfirmation()
          return
        }
      }
      window.dispatchEvent(new Event('auth-ready'))
    } catch (err) {
      showError(friendlyError(err.message))
      reset()
    }

    function reset() {
      submitBtn.disabled = false
      submitBtn.textContent = tab === 'login' ? 'Log In' : 'Create Account'
    }
  })
}

function showError(msg) {
  const errBanner = container?.querySelector('#auth-error')
  if (!errBanner) return
  errBanner.textContent = msg
  errBanner.classList.remove('hidden')
}

function showConfirmation() {
  if (!container) return
  container.innerHTML = `
    <div class="min-h-screen bg-bg flex items-center justify-center px-4">
      <div class="w-full max-w-sm text-center">
        <div class="text-5xl mb-4">✉</div>
        <h2 class="text-xl font-display font-bold text-text-primary mb-2">Check your email</h2>
        <p class="text-sm text-text-muted mb-6">
          We sent a confirmation link to your email address.<br>
          Click it and then come back to log in.
        </p>
        <button id="back-to-login"
          class="px-5 py-2.5 rounded-xl bg-accent-primary text-bg text-sm font-semibold hover:bg-accent-primary/90 transition-colors">
          Back to Log In
        </button>
      </div>
    </div>
  `
  container.querySelector('#back-to-login')?.addEventListener('click', () => {
    tab = 'login'
    render()
  })
}

function friendlyError(msg) {
  if (!msg) return 'Something went wrong. Please try again.'
  if (msg.includes('Invalid login credentials'))  return 'Incorrect email or password.'
  if (msg.includes('Email not confirmed'))         return 'Please confirm your email first.'
  if (msg.includes('User already registered'))     return 'An account with that email already exists.'
  if (msg.includes('Password should be'))          return 'Password must be at least 6 characters.'
  if (msg.includes('rate limit'))                  return 'Too many attempts. Please wait a moment.'
  return msg
}
