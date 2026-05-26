// settings.js — user preferences: display name, audio, price alerts, danger zone
import { getState, updateSettings, setDisplayName, addPriceAlert, removePriceAlert, resetPortfolio, subscribe, toggleWatchlist } from '../state/store.js'
import { applyTheme } from '../main.js'
import { STOCKS } from '../data/stocks.js'
import { pc } from '../utils/format.js'
import { toast } from '../components/toast.js'
import { startTutorial } from '../components/tutorial.js'

let container = null
let unsub = null

export function mountSettings(el) {
  container = el
  unsub = subscribe(() => render())
  render()
}

export function unmountSettings() {
  if (unsub) { unsub(); unsub = null }
  container = null
}

function render() {
  if (!container) return
  const state = getState()
  const s = state.settings

  container.innerHTML = `
    <div class="max-w-2xl mx-auto px-4 py-6 space-y-6">

      <h1 class="text-2xl font-display font-bold text-text-primary">Settings</h1>

      <!-- Profile -->
      <section class="bg-surface border border-border rounded-2xl p-5 space-y-4">
        <h2 class="font-semibold text-text-primary">Profile</h2>
        <div>
          <label class="text-xs text-text-muted uppercase tracking-wide mb-1.5 block">Display Name</label>
          <div class="flex gap-2">
            <input id="display-name-input" type="text" maxlength="24"
              value="${state.user.displayName}"
              class="flex-1 bg-surface-elevated border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary transition-colors" />
            <button id="save-name-btn" class="px-4 py-2 rounded-lg bg-accent-primary text-bg text-sm font-semibold hover:bg-accent-primary/90 transition-colors">Save</button>
          </div>
        </div>
      </section>

      <!-- Appearance -->
      <section class="bg-surface border border-border rounded-2xl p-5 space-y-4">
        <h2 class="font-semibold text-text-primary">Appearance</h2>
        <div>
          <label class="text-xs text-text-muted uppercase tracking-wide mb-2 block">Theme</label>
          <div class="flex gap-2">
            ${['dark','light'].map(t => `
              <button data-theme="${t}"
                class="theme-btn flex-1 py-2 rounded-lg border text-sm font-medium transition-colors
                ${(s.theme ?? 'dark') === t
                  ? 'bg-accent-primary text-bg border-accent-primary'
                  : 'bg-surface-elevated border-border text-text-muted hover:text-text-primary'}">
                ${t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- Audio -->
      <section class="bg-surface border border-border rounded-2xl p-5 space-y-4">
        <h2 class="font-semibold text-text-primary">Audio</h2>

        <div class="flex items-center justify-between">
          <span class="text-sm text-text-secondary">Sound Effects</span>
          <button id="sfx-toggle" class="relative w-11 h-6 rounded-full transition-colors ${s.soundEnabled ? 'bg-accent-primary' : 'bg-surface-elevated border border-border'}">
            <div class="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${s.soundEnabled ? 'translate-x-5' : 'translate-x-0.5'}"></div>
          </button>
        </div>

        <div>
          <label class="text-xs text-text-muted uppercase tracking-wide mb-1.5 flex justify-between">
            <span>SFX Volume</span>
            <span id="sfx-vol-label">${s.sfxVolume ?? 70}%</span>
          </label>
          <input id="sfx-volume" type="range" min="0" max="100" value="${s.sfxVolume ?? 70}"
            class="w-full accent-accent-primary" />
        </div>
      </section>

      <!-- Price Alerts -->
      <section class="bg-surface border border-border rounded-2xl p-5 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold text-text-primary">Price Alerts</h2>
          <button id="add-alert-btn" class="px-3 py-1.5 rounded-lg bg-accent-primary/10 border border-accent-primary/30 text-accent-primary text-xs font-semibold hover:bg-accent-primary hover:text-bg transition-colors">
            + Add Alert
          </button>
        </div>

        ${state.priceAlerts.length === 0
          ? `<div class="text-sm text-text-muted">No price alerts set. Add one to get notified when a stock crosses a threshold.</div>`
          : `<div class="divide-y divide-border">
              ${state.priceAlerts.map(alert => `
                <div class="flex items-center justify-between py-3">
                  <div>
                    <span class="font-mono font-semibold text-text-primary">${alert.symbol}</span>
                    <span class="text-text-muted text-xs ml-2">${alert.direction === 'above' ? '↑ above' : '↓ below'} ${pc(alert.threshold)}</span>
                    ${!alert.active ? '<span class="text-[10px] text-text-muted ml-2">(triggered)</span>' : ''}
                  </div>
                  <button data-remove-alert="${alert.id}"
                    class="text-xs text-loss hover:text-loss/80 transition-colors">Remove</button>
                </div>
              `).join('')}
             </div>`}

        <!-- Add alert form (hidden by default) -->
        <div id="alert-form" class="hidden space-y-3 pt-3 border-t border-border">
          <div>
            <label class="text-xs text-text-muted uppercase tracking-wide mb-1.5 block">Stock Symbol</label>
            <select id="alert-symbol" class="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary">
              ${STOCKS.map(s => `<option value="${s.symbol}">${s.symbol} — ${s.name}</option>`).join('')}
            </select>
          </div>
          <div class="flex gap-2">
            <div class="flex-1">
              <label class="text-xs text-text-muted uppercase tracking-wide mb-1.5 block">Direction</label>
              <select id="alert-direction" class="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary">
                <option value="above">Price goes ABOVE</option>
                <option value="below">Price goes BELOW</option>
              </select>
            </div>
            <div class="flex-1">
              <label class="text-xs text-text-muted uppercase tracking-wide mb-1.5 block">Threshold (PC$)</label>
              <input id="alert-threshold" type="number" min="0.01" step="0.01" placeholder="0.00"
                class="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary" />
            </div>
          </div>
          <button id="save-alert-btn" class="w-full py-2 rounded-lg bg-accent-primary text-bg text-sm font-semibold hover:bg-accent-primary/90 transition-colors">Save Alert</button>
        </div>
      </section>

      <!-- Watchlist -->
      <section class="bg-surface border border-border rounded-2xl p-5 space-y-4">
        <h2 class="font-semibold text-text-primary">Watchlist</h2>
        ${state.watchlist.length === 0
          ? `<div class="text-sm text-text-muted">No stocks on your watchlist. Add them from any stock page.</div>`
          : `<div class="divide-y divide-border">
              ${state.watchlist.map(sym => {
                const stock = STOCKS.find(s => s.symbol === sym)
                return `
                  <div class="flex items-center justify-between py-3">
                    <div>
                      <span class="font-mono font-semibold text-text-primary">${sym}</span>
                      <span class="text-text-muted text-xs ml-2">${stock?.name ?? ''}</span>
                    </div>
                    <button data-remove-watch="${sym}" class="text-xs text-loss hover:text-loss/80 transition-colors">Remove</button>
                  </div>
                `
              }).join('')}
             </div>`}
      </section>

      <!-- Danger Zone -->
      <section class="bg-surface border border-loss/30 rounded-2xl p-5 space-y-3">
        <h2 class="font-semibold text-loss">Danger Zone</h2>

        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm font-medium text-text-primary">Replay Tutorial</div>
            <div class="text-xs text-text-muted">Walk through the guided tour again.</div>
          </div>
          <button id="replay-tutorial-btn" class="px-4 py-2 rounded-lg border border-border text-sm text-text-secondary hover:text-text-primary hover:border-accent-primary transition-colors">
            Replay
          </button>
        </div>

        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm font-medium text-text-primary">Reset Portfolio</div>
            <div class="text-xs text-text-muted">Wipes all holdings and transactions. Restores PC$10,000.</div>
          </div>
          <button id="reset-btn" class="px-4 py-2 rounded-lg border border-loss/40 text-loss text-sm hover:bg-loss/10 transition-colors">
            Reset
          </button>
        </div>
      </section>

    </div>
  `

  bindEvents()
}

function bindEvents() {
  // Display name
  container.querySelector('#save-name-btn')?.addEventListener('click', () => {
    const val = container.querySelector('#display-name-input')?.value.trim()
    if (!val) { toast('Name cannot be empty', 'error'); return }
    setDisplayName(val)
    toast('Display name updated!', 'success')
  })

  // Audio
  container.querySelector('#sfx-toggle')?.addEventListener('click', () => {
    updateSettings({ soundEnabled: !getState().settings.soundEnabled })
  })

  const sfxSlider = container.querySelector('#sfx-volume')
  sfxSlider?.addEventListener('input', () => {
    container.querySelector('#sfx-vol-label').textContent = sfxSlider.value + '%'
    updateSettings({ sfxVolume: Number(sfxSlider.value) })
  })

  // Price alerts
  container.querySelector('#add-alert-btn')?.addEventListener('click', () => {
    const form = container.querySelector('#alert-form')
    form?.classList.toggle('hidden')
  })

  container.querySelectorAll('[data-remove-alert]').forEach(btn => {
    btn.addEventListener('click', () => {
      removePriceAlert(btn.dataset.removeAlert)
      toast('Alert removed', 'info')
    })
  })

  container.querySelector('#save-alert-btn')?.addEventListener('click', () => {
    const symbol    = container.querySelector('#alert-symbol')?.value
    const direction = container.querySelector('#alert-direction')?.value
    const threshold = parseFloat(container.querySelector('#alert-threshold')?.value)
    if (!symbol || !direction || isNaN(threshold) || threshold <= 0) {
      toast('Please fill in all alert fields', 'error'); return
    }
    addPriceAlert({ symbol, direction, threshold })
    toast(`Alert set: ${symbol} ${direction} ${pc(threshold)}`, 'success')
    container.querySelector('#alert-form')?.classList.add('hidden')
  })

  // Theme
  container.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.theme
      updateSettings({ theme })
      applyTheme(theme)
    })
  })

  // Watchlist remove
  container.querySelectorAll('[data-remove-watch]').forEach(btn => {
    btn.addEventListener('click', () => {
      toggleWatchlist(btn.dataset.removeWatch)
    })
  })

  // Danger zone
  container.querySelector('#replay-tutorial-btn')?.addEventListener('click', startTutorial)

  container.querySelector('#reset-btn')?.addEventListener('click', () => {
    if (confirm('Reset your portfolio to PC$10,000? All holdings and transactions will be deleted. This cannot be undone.')) {
      resetPortfolio()
      toast('Portfolio reset!', 'info')
    }
  })
}
