// main.js — app entry point
// Boots the app: seeds prices, renders the navbar, then mounts the correct
// page based on the URL hash. Hash changes (clicking nav links) trigger
// unmount → mount so only one page is active at a time.
// If VITE_FINNHUB_API_KEY is set, real Finnhub prices are fetched immediately
// and refreshed every 60 seconds. Otherwise the simulation tick runs.

import './style.css'
import { initNavbar } from './components/navbar.js'
import { initPrices, tick, startFinnhubPolling } from './api/prices.js'
import { FINNHUB_API_KEY } from './config.js'
import { getState, subscribe } from './state/store.js'
import { STOCKS } from './data/stocks.js'
import { mountDashboard,    unmountDashboard    } from './pages/dashboard.js'
import { mountStockBrowser, unmountStockBrowser } from './pages/stockBrowser.js'
import { mountPortfolio,    unmountPortfolio    } from './pages/portfolio.js'
import { mountStockDetail,  unmountStockDetail  } from './pages/stockDetail.js'
import { mountAchievements, unmountAchievements } from './pages/achievements.js'
import { mountSettings,     unmountSettings     } from './pages/settings.js'
import { mountProfile,      unmountProfile      } from './pages/profile.js'
import { startTutorial } from './components/tutorial.js'
import { checkAchievements } from './utils/achievements.js'

// Expose STOCKS for use in achievement checks (avoids circular imports)
window.__STOCKS__ = { STOCKS }

let currentRoute = null

function getRoute() {
  const hash = window.location.hash || '#dashboard'
  if (hash.startsWith('#stock-'))        return { name: 'stock-detail', symbol: hash.slice(7) }
  if (hash.startsWith('#stocks'))        return { name: 'stocks' }
  if (hash.startsWith('#portfolio'))     return { name: 'portfolio' }
  if (hash.startsWith('#achievements'))  return { name: 'achievements' }
  if (hash.startsWith('#leaderboard'))   return { name: 'leaderboard' }
  if (hash.startsWith('#settings'))      return { name: 'settings' }
  if (hash.startsWith('#profile'))       return { name: 'profile' }
  return { name: 'dashboard' }
}

function unmountCurrent() {
  if (!currentRoute) return
  switch (currentRoute) {
    case 'dashboard':    unmountDashboard();    break
    case 'stocks':       unmountStockBrowser(); break
    case 'portfolio':    unmountPortfolio();    break
    case 'stock-detail': unmountStockDetail();  break
    case 'achievements': unmountAchievements(); break
    case 'settings':     unmountSettings();     break
    case 'profile':      unmountProfile();      break
  }
}

function mount(route) {
  unmountCurrent()
  currentRoute = route.name

  const main = document.getElementById('main-content')
  main.innerHTML = ''

  switch (route.name) {
    case 'dashboard':    mountDashboard(main);                         break
    case 'stocks':       mountStockBrowser(main);                      break
    case 'portfolio':    mountPortfolio(main);                         break
    case 'stock-detail': mountStockDetail(main, route.symbol);         break
    case 'achievements': mountAchievements(main, subscribe);           break
    case 'settings':     mountSettings(main);                          break
    case 'profile':      mountProfile(main);                           break
    case 'leaderboard':  renderLeaderboard(main);                      break
  }
}

function renderLeaderboard(main) {
  main.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 py-6">
      <h1 class="text-2xl font-display font-bold text-text-primary mb-6">Leaderboard</h1>
      <div class="bg-surface border border-border rounded-2xl p-10 text-center text-text-muted">
        <div class="text-5xl mb-4">🏆</div>
        <div class="text-lg font-semibold text-text-primary mb-2">Class Leaderboard</div>
        <div class="text-sm max-w-sm mx-auto">Real-time multiplayer rankings require the backend (Supabase). Coming in v2!</div>
        <a href="#profile" class="inline-block mt-6 px-5 py-2.5 rounded-xl bg-accent-primary text-bg text-sm font-semibold hover:bg-accent-primary/90 transition-colors">
          View Your Stats →
        </a>
      </div>
    </div>
  `
}

// Show the narrow-screen banner (PRD §19.7) when viewport is under 1024px.
function initNarrowBanner() {
  const banner  = document.getElementById('narrow-banner')
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
  // Boot price layer first — seeds mock prices immediately, then kicks off
  // real Finnhub fetches in the background if an API key is configured.
  initPrices()

  // If API key is present, start the 60-second refresh loop.
  // Otherwise, run the 3-second simulation tick.
  if (FINNHUB_API_KEY) {
    startFinnhubPolling()
    // Still run tick every 3s so orders/alerts/snapshots are checked regularly.
    setInterval(tick, 3000)
  } else {
    setInterval(tick, 3000)
  }

  initNavbar()
  initNarrowBanner()

  // Check achievements on every state change
  subscribe(() => checkAchievements())

  window.addEventListener('hashchange', () => mount(getRoute()))
  mount(getRoute())

  // Show tutorial on very first visit
  if (!getState().settings.tutorialDone) {
    setTimeout(startTutorial, 1200)
  }
}

init()
