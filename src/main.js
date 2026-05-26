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
import { mountAuth,         unmountAuth         } from './pages/auth.js'
import { mountLeaderboard,  unmountLeaderboard  } from './pages/leaderboard.js'
import { mountTeacher,     unmountTeacher      } from './pages/teacher.js'
import { mountResults,     unmountResults      } from './pages/results.js'
import { startTutorial } from './components/tutorial.js'
import { checkAchievements } from './utils/achievements.js'
import { supabase } from './lib/supabase.js'
import { getSession } from './utils/auth.js'
import { startMarketEventListener, stopMarketEventListener } from './lib/marketEvents.js'
import { getActiveSessionId } from './lib/session.js'

// Expose STOCKS for use in achievement checks (avoids circular imports)
window.__STOCKS__ = { STOCKS }

let currentRoute = null

function getRoute() {
  const hash = window.location.hash || '#dashboard'
  if (hash.startsWith('#stock-'))        return { name: 'stock-detail', symbol: hash.slice(7) }
  if (hash.startsWith('#stocks'))        return { name: 'stocks' }
  if (hash.startsWith('#portfolio'))     return { name: 'portfolio' }
  if (hash.startsWith('#achievements'))  return { name: 'achievements' }
  if (hash.startsWith('#leaderboard-project')) return { name: 'leaderboard-project' }
  if (hash.startsWith('#leaderboard'))   return { name: 'leaderboard' }
  if (hash.startsWith('#teacher'))       return { name: 'teacher' }
  if (hash.startsWith('#results'))       return { name: 'results' }
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
    case 'leaderboard':          unmountLeaderboard();  break
    case 'leaderboard-project':  unmountLeaderboard();  break
    case 'teacher':      unmountTeacher();      break
    case 'results':      unmountResults();      break
    case 'auth':         unmountAuth();         break
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
    case 'leaderboard':          mountLeaderboard(main, false); break
    case 'leaderboard-project':  mountLeaderboard(main, true);  break
    case 'teacher':      mountTeacher(main);                           break
    case 'results':      mountResults(main);                           break
  }
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

let sessionWatcher = null

function watchSessionStatus() {
  if (!supabase) return
  const sessionId = getActiveSessionId()
  if (!sessionId) return

  if (sessionWatcher) supabase.removeChannel(sessionWatcher)

  sessionWatcher = supabase
    .channel(`session-status:${sessionId}`)
    .on('postgres_changes', {
      event:  'UPDATE',
      schema: 'public',
      table:  'sessions',
      filter: `id=eq.${sessionId}`,
    }, (payload) => {
      if (payload.new?.status === 'ended') {
        // Auto-redirect every student to the results screen
        window.location.hash = '#results'
      }
    })
    .subscribe()
}

export function applyTheme(theme) {
  document.documentElement.classList.toggle('light', theme === 'light')
}

function bootApp() {
  applyTheme(getState().settings.theme ?? 'dark')
  initPrices()
  if (FINNHUB_API_KEY) {
    startFinnhubPolling()
  }
  setInterval(tick, 3000)

  initNavbar()
  initNarrowBanner()

  subscribe(() => checkAchievements())

  window.addEventListener('hashchange', () => mount(getRoute()))
  mount(getRoute())

  if (!getState().settings.tutorialDone) {
    setTimeout(startTutorial, 1200)
  }

  // Start listening for teacher market events if already in a session
  if (supabase && getActiveSessionId()) {
    startMarketEventListener()
    watchSessionStatus()
  }

  // Re-start listeners whenever the user joins a new session from the dashboard
  window.addEventListener('session-joined', () => {
    stopMarketEventListener()
    startMarketEventListener()
    watchSessionStatus()
  })
}

async function init() {
  const main = document.getElementById('main-content')

  // If Supabase is configured, gate the app behind auth.
  if (supabase) {
    const session = await getSession()

    if (!session) {
      // Show auth page; wait for successful login before booting the app.
      currentRoute = 'auth'
      mountAuth(main)

      window.addEventListener('auth-ready', () => {
        unmountAuth()
        currentRoute = null
        bootApp()
      }, { once: true })
      return
    }

    // Already logged in — listen for future sign-outs to return to auth screen.
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        unmountCurrent()
        currentRoute = 'auth'
        mountAuth(main)
        window.addEventListener('auth-ready', () => {
          unmountAuth()
          currentRoute = null
          bootApp()
        }, { once: true })
      }
    })
  }

  bootApp()
}

init()
