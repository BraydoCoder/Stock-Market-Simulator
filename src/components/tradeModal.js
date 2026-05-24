import { getState, adjustBalance, buyShares, sellShares, recordTx, awardXP } from '../state/store.js'
import { getPrice } from '../api/prices.js'
import { getStock } from '../data/stocks.js'
import { pc, pct, shares as fmtShares, gainClass } from '../utils/format.js'
import { toast } from './toast.js'
import { FEE_RATE } from '../config.js'

let currentSymbol = null
let tab = 'buy'
let orderType = 'market'
let priceListener = null

export function openTradeModal(symbol) {
  currentSymbol = symbol
  tab = 'buy'
  orderType = 'market'
  renderModal()

  priceListener = () => {
    if (currentSymbol) refreshPrice()
  }
  window.addEventListener('prices-updated', priceListener)
}

function closeModal() {
  currentSymbol = null
  document.getElementById('modal-container').innerHTML = ''
  if (priceListener) {
    window.removeEventListener('prices-updated', priceListener)
    priceListener = null
  }
}

function renderModal() {
  const stock = getStock(currentSymbol)
  if (!stock) return

  const container = document.getElementById('modal-container')
  container.innerHTML = `
    <div id="trade-overlay" class="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div class="w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden" id="trade-modal">

        <!-- Header -->
        <div class="flex items-start justify-between p-5 border-b border-border">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="font-mono font-bold text-lg text-text-primary">${stock.symbol}</span>
              <span class="text-xs px-2 py-0.5 rounded-full bg-surface-elevated text-text-muted border border-border">${stock.sector}</span>
            </div>
            <div class="text-sm text-text-muted">${stock.name}</div>
          </div>
          <button id="modal-close" class="text-text-muted hover:text-text-primary transition-colors text-xl leading-none p-1">✕</button>
        </div>

        <!-- Price -->
        <div id="modal-price-section" class="px-5 py-4 border-b border-border">
          ${priceHTML()}
        </div>

        <!-- Tabs -->
        <div class="flex border-b border-border">
          <button data-tab="buy" class="tab-btn flex-1 py-3 text-sm font-semibold transition-colors ${tab === 'buy' ? 'text-gain border-b-2 border-gain' : 'text-text-muted hover:text-text-primary'}">
            Buy
          </button>
          <button data-tab="sell" class="tab-btn flex-1 py-3 text-sm font-semibold transition-colors ${tab === 'sell' ? 'text-loss border-b-2 border-loss' : 'text-text-muted hover:text-text-primary'}">
            Sell
          </button>
        </div>

        <!-- Body -->
        <div class="p-5 space-y-4" id="modal-body">
          ${bodyHTML()}
        </div>

      </div>
    </div>
  `

  bindEvents()
}

function priceHTML() {
  const p = getPrice(currentSymbol)
  const dir = p.price >= p.prev ? 'text-gain' : 'text-loss'
  return `
    <div class="flex items-end justify-between">
      <div>
        <div class="text-2xl font-bold font-mono text-text-primary">${pc(p.price)}</div>
        <div class="text-sm ${dir} font-medium mt-0.5">
          ${p.change >= 0 ? '+' : ''}${pc(p.change)} (${pct(p.changePct)})
        </div>
      </div>
      <div class="text-right text-xs text-text-muted">
        <div>Market Price</div>
        <div class="mt-0.5 text-text-secondary">${new Date().toLocaleTimeString()}</div>
      </div>
    </div>
  `
}

function bodyHTML() {
  const state = getState()
  const p = getPrice(currentSymbol)
  const holding = state.holdings[currentSymbol]
  const ownedShares = holding?.shares ?? 0
  const balance = state.user.balance

  if (tab === 'sell' && ownedShares < 0.000001) {
    return `<div class="text-center py-6 text-text-muted">You don't own any ${currentSymbol} shares.</div>`
  }

  return `
    <!-- Order type -->
    <div>
      <label class="text-xs text-text-muted uppercase tracking-wide mb-1.5 block">Order Type</label>
      <div class="flex gap-1 bg-surface-elevated rounded-lg p-1">
        ${['market', 'limit', 'stop-loss'].map(t => `
          <button data-order="${t}" class="order-btn flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-colors
            ${orderType === t ? 'bg-accent-primary text-bg font-semibold' : 'text-text-muted hover:text-text-primary'}">
            ${t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        `).join('')}
      </div>
    </div>

    ${orderType !== 'market' ? `
    <!-- Limit / stop price -->
    <div>
      <label class="text-xs text-text-muted uppercase tracking-wide mb-1.5 block">
        ${orderType === 'limit' ? 'Limit Price (PC$)' : 'Stop Price (PC$)'}
      </label>
      <input id="limit-price" type="number" min="0.01" step="0.01"
        value="${p.price.toFixed(2)}"
        class="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary transition-colors" />
      <div class="text-[10px] text-text-muted mt-1">
        ${orderType === 'limit' ? 'Order executes immediately at or below this price' : 'Order executes if price drops to this level'}
      </div>
    </div>
    ` : ''}

    <!-- Qty -->
    <div>
      <label class="text-xs text-text-muted uppercase tracking-wide mb-1.5 block">Quantity (shares)</label>
      <div class="flex items-center gap-2">
        <button id="qty-dec" class="w-8 h-8 rounded-lg bg-surface-elevated border border-border text-text-muted hover:text-text-primary transition-colors flex items-center justify-center font-bold">−</button>
        <input id="qty-input" type="number" min="0.0001" step="0.0001"
          value="1"
          class="flex-1 bg-surface-elevated border border-border rounded-lg px-3 py-2 text-sm text-text-primary text-center focus:outline-none focus:border-accent-primary transition-colors" />
        <button id="qty-inc" class="w-8 h-8 rounded-lg bg-surface-elevated border border-border text-text-muted hover:text-text-primary transition-colors flex items-center justify-center font-bold">+</button>
      </div>
      ${tab === 'sell' && ownedShares > 0 ? `
        <div class="flex gap-2 mt-2">
          ${[25, 50, 75, 100].map(p => `
            <button data-pct="${p}" class="pct-btn flex-1 py-1 rounded-md bg-surface-elevated border border-border text-[10px] text-text-muted hover:text-text-primary hover:border-accent-primary transition-colors">
              ${p}%
            </button>
          `).join('')}
        </div>
        <div class="text-[10px] text-text-muted mt-1.5">You own ${fmtShares(ownedShares)} shares</div>
      ` : ''}
    </div>

    <!-- Cost breakdown -->
    <div id="cost-breakdown" class="bg-surface-elevated rounded-xl p-3 space-y-1.5 text-xs">
      ${costHTML()}
    </div>

    <!-- Available -->
    <div class="text-xs text-text-muted">
      ${tab === 'buy'
        ? `Available: <span class="text-text-secondary font-medium">${pc(balance)}</span>`
        : `Holding: <span class="text-text-secondary font-medium">${fmtShares(ownedShares)} shares</span>
           ${holding ? `· avg cost <span class="font-medium">${pc(holding.avgCost)}</span>` : ''}`
      }
    </div>

    <!-- CTA -->
    <button id="confirm-trade" class="w-full py-3 rounded-xl font-bold text-sm transition-colors
      ${tab === 'buy'
        ? 'bg-gain hover:bg-gain/90 text-bg'
        : 'bg-loss hover:bg-loss/90 text-white'}">
      ${tab === 'buy' ? 'Buy' : 'Sell'} ${currentSymbol}
    </button>
  `
}

function costHTML() {
  const qty = parseFloat(document.getElementById('qty-input')?.value ?? 1) || 0
  const p = getPrice(currentSymbol)
  const execPrice = orderType === 'market' ? p.price : (parseFloat(document.getElementById('limit-price')?.value) || p.price)
  const subtotal = qty * execPrice
  const fee = Math.ceil(subtotal * FEE_RATE * 100) / 100
  const total = tab === 'buy' ? subtotal + fee : subtotal - fee

  return `
    <div class="flex justify-between text-text-muted">
      <span>${fmtShares(qty)} × ${pc(execPrice)}</span>
      <span class="text-text-secondary">${pc(subtotal)}</span>
    </div>
    <div class="flex justify-between text-text-muted">
      <span>Fee (0.5%)</span>
      <span class="text-warning">${tab === 'buy' ? '+' : '-'}${pc(fee)}</span>
    </div>
    <div class="border-t border-border pt-1.5 flex justify-between font-semibold text-text-primary">
      <span>${tab === 'buy' ? 'Total Cost' : 'You Receive'}</span>
      <span>${pc(total)}</span>
    </div>
  `
}

function refreshPrice() {
  const section = document.getElementById('modal-price-section')
  if (section) section.innerHTML = priceHTML()
  updateCost()
}

function updateCost() {
  const el = document.getElementById('cost-breakdown')
  if (el) el.innerHTML = costHTML()
}

function bindEvents() {
  document.getElementById('modal-close')?.addEventListener('click', closeModal)

  document.getElementById('trade-overlay')?.addEventListener('click', e => {
    if (e.target.id === 'trade-overlay') closeModal()
  })

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      tab = btn.dataset.tab
      renderModal()
    })
  })

  document.querySelectorAll('.order-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      orderType = btn.dataset.order
      const body = document.getElementById('modal-body')
      if (body) body.innerHTML = bodyHTML()
      bindBodyEvents()
    })
  })

  bindBodyEvents()
}

function bindBodyEvents() {
  const qtyInput = document.getElementById('qty-input')
  if (!qtyInput) return

  qtyInput.addEventListener('input', updateCost)

  document.getElementById('qty-dec')?.addEventListener('click', () => {
    const v = Math.max(0.0001, (parseFloat(qtyInput.value) || 1) - 1)
    qtyInput.value = v <= 1 ? Math.max(0.0001, v) : Math.floor(v)
    updateCost()
  })

  document.getElementById('qty-inc')?.addEventListener('click', () => {
    qtyInput.value = Math.floor((parseFloat(qtyInput.value) || 0) + 1)
    updateCost()
  })

  document.querySelectorAll('.pct-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const ownedShares = getState().holdings[currentSymbol]?.shares ?? 0
      const pct = parseInt(btn.dataset.pct)
      qtyInput.value = (ownedShares * pct / 100).toFixed(4)
      updateCost()
    })
  })

  document.getElementById('limit-price')?.addEventListener('input', updateCost)

  document.getElementById('confirm-trade')?.addEventListener('click', executeTrade)
}

function executeTrade() {
  const qty = parseFloat(document.getElementById('qty-input')?.value) || 0
  if (qty <= 0) { toast('Enter a valid quantity', 'error'); return }

  const p = getPrice(currentSymbol)
  const execPrice = orderType === 'market'
    ? p.price
    : (parseFloat(document.getElementById('limit-price')?.value) || p.price)

  if (execPrice <= 0) { toast('Invalid price', 'error'); return }

  const subtotal = qty * execPrice
  const fee = Math.ceil(subtotal * FEE_RATE * 100) / 100
  const state = getState()

  if (tab === 'buy') {
    const total = subtotal + fee
    if (total > state.user.balance) {
      toast(`Insufficient balance — need ${pc(total)}`, 'error')
      return
    }
    adjustBalance(-total)
    buyShares(currentSymbol, qty, execPrice)
    recordTx({ type: 'buy', symbol: currentSymbol, qty, price: execPrice, fee, total })
    const leveled = awardXP(Math.max(1, Math.round(subtotal / 100)))
    toast(`Bought ${fmtShares(qty)} ${currentSymbol} @ ${pc(execPrice)}`, 'success')
    if (leveled) setTimeout(() => toast(`Level up! You're now level ${getState().user.level}!`, 'info'), 500)
  } else {
    const holding = state.holdings[currentSymbol]
    if (!holding || qty > holding.shares + 0.000001) {
      toast(`Not enough shares — you own ${fmtShares(holding?.shares ?? 0)}`, 'error')
      return
    }
    const proceeds = subtotal - fee
    adjustBalance(proceeds)
    sellShares(currentSymbol, qty)
    recordTx({ type: 'sell', symbol: currentSymbol, qty, price: execPrice, fee, total: proceeds })
    const leveled = awardXP(Math.max(1, Math.round(subtotal / 200)))
    toast(`Sold ${fmtShares(qty)} ${currentSymbol} @ ${pc(execPrice)}`, 'success')
    if (leveled) setTimeout(() => toast(`Level up! You're now level ${getState().user.level}!`, 'info'), 500)
  }

  closeModal()
}
