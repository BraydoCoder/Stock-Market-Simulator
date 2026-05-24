// main.js — app entry point
// Boots the app: seeds prices, renders the navbar, then mounts the correct
// page based on the URL hash. Hash changes (clicking nav links) trigger
// unmount → mount so only one page is active at a time.

import './style.css'
import { initNavbar } from './components/navbar.js'
import { initPrices, tick } from './api/prices.js'
import { subscribe } from './state/store.js'
import { mountDashboard, unmountDashboard } from './pages/dashboard.js'
import { mountStockBrowser, unmountStockBrowser } from './pages/stockBrowser.js'
import { mountPortfolio, unmountPortfolio } from './pages/portfolio.js'

let currentRoute = null
let stateUnsub = null

function getRoute() {
  const hash = window.location.hash || '#dashboard'
  if (hash.startsWith('#stocks'))     return 'stocks'
  if (hash.startsWith('#portfolio'))  return 'portfolio'
  if (hash.startsWith('#leaderboard')) return 'leaderboard'
  return 'dashboard'
}

function unmountCurrent() {
  if (currentRoute === 'dashboard')  unmountDashboard()
  if (currentRoute === 'stocks')     unmountStockBrowser()
  if (currentRoute === 'portfolio')  unmountPortfolio()
  if (stateUnsub) { stateUnsub(); stateUnsub = null }
}

function mount(route) {
  unmountCurrent()
  currentRoute = route

  const main = document.getElementById('main-content')
  main.innerHTML = ''

  if (route === 'dashboard') {
    mountDashboard(main)
  } else if (route === 'stocks') {
    mountStockBrowser(main)
  } else if (route === 'portfolio') {
    stateUnsub = subscribe(() => {
      if (currentRoute === 'portfolio') mountPortfolio(main)
    })
    mountPortfolio(main)
  } else if (route === 'leaderboard') {
    renderLeaderboard(main)
  }
}

function renderLeaderboard(main) {
  main.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 py-6">
      <h1 class="text-2xl font-display font-bold text-text-primary mb-6">Leaderboard</h1>
      <div class="bg-surface border border-border rounded-2xl p-8 text-center text-text-muted">
        <div class="text-4xl mb-3">🏆</div>
        <div class="text-lg font-semibold text-text-primary mb-2">Coming Soon</div>
        <div class="text-sm">Multiplayer leaderboards require a backend. Check back in v2!</div>
      </div>
    </div>
  `
}

// Show the narrow-screen banner (PRD §19.7) when viewport is under 1024px.
// The user can dismiss it to continue anyway.
function initNarrowBanner() {
  const banner = document.getElementById('narrow-banner')
  const dismiss = document.getElementById('narrow-dismiss')
  if (!banner) return

  const check = () => {
    if (window.innerWidth < 1024 && !sessionStorage.getItem('narrow-dismissed')) {
      banner.classList.remove('hidden')
    } else {
      banner.classList.add('hidden')
    }
  }

  dismiss?.addEventListener('click', () => {
    sessionStorage.setItem('narrow-dismissed', '1')
    banner.classList.add('hidden')
  })

  window.addEventListener('resize', check)
  check()
}

function init() {
  initPrices()
  initNavbar()
  initNarrowBanner()

  window.addEventListener('hashchange', () => mount(getRoute()))
  mount(getRoute())

  setInterval(tick, 3000)
}

init()
