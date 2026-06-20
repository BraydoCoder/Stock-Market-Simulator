// dashboard.js — merged dashboard + portfolio
import { getState, subscribe, xpProgress, resetPortfolio, cancelOrder } from '../state/store.js'
import { getAllPrices, portfolioValue } from '../api/prices.js'
import { getStock, STOCKS } from '../data/stocks.js'
import { pc, pct, gainClass, relativeTime } from '../utils/format.js'
import { openTradeModal } from '../components/tradeModal.js'
import { STARTING_BALANCE } from '../config.js'
import { joinSession, leaveSession, getActiveSession } from '../lib/session.js'
import { supabase } from '../lib/supabase.js'
import Chart from 'chart.js/auto'

let unsub          = null
let priceHandler   = null
let activeSession  = null
let container      = null
let doughnutChart  = null
let netWorthChart  = null
let txFilter       = 'all'
let sortHolding    = 'value'

export async function mountDashboard(el) {
  container     = el
  activeSession = await getActiveSession()
  render()
  unsub        = subscribe(() => render())
  priceHandler = () => render()
  window.addEventListener('prices-updated', priceHandler)
}

export function unmountDashboard() {
  if (unsub)         { unsub(); unsub = null }
  if (priceHandler)  { window.removeEventListener('prices-updated', priceHandler); priceHandler = null }
  destroyCharts()
  container     = null
  activeSession = null
}

function destroyCharts() {
  if (doughnutChart) { doughnutChart.destroy(); doughnutChart = null }
  if (netWorthChart) { netWorthChart.destroy(); netWorthChart = null }
}

// ── Render ────────────────────────────────────────────────────────────────────

function render() {
  if (!container) return
  destroyCharts()

  const state    = getState()
  const prices   = getAllPrices()
  const portVal  = portfolioValue(state.holdings)
  const totalVal = state.user.balance + portVal
  const gain     = totalVal - STARTING_BALANCE
  const gainPct  = (gain / STARTING_BALANCE) * 100
  const { pct: xpPct, hi } = xpProgress()

  const holdings = Object.entries(state.holdings)
    .map(([sym, h]) => {
      const p      = prices.get(sym) ?? { price: 0, changePct: 0 }
      const value  = h.shares * p.price
      const pl     = (p.price - h.avgCost) * h.shares
      const plPct  = h.avgCost > 0 ? ((p.price - h.avgCost) / h.avgCost * 100) : 0
      const weight = totalVal > 0 ? (value / totalVal) * 100 : 0
      return { sym, h, p, value, pl, plPct, weight }
    })
    .sort((a, b) => {
      if (sortHolding === 'value') return b.value - a.value
      if (sortHolding === 'pl')    return b.pl - a.pl
      if (sortHolding === 'pct')   return b.plPct - a.plPct
      return a.sym.localeCompare(b.sym)
    })

  const txs        = state.transactions.filter(tx => txFilter === 'all' || tx.type === txFilter)
  const openOrders = state.orders.filter(o => o.status === 'pending')
  const totalFees  = state.transactions.reduce((sum, t) => sum + (t.fee ?? 0), 0)

  const allocation = {}
  holdings.forEach(({ sym, value }) => { allocation[sym] = value })
  if (state.user.balance > 0) allocation['Cash'] = state.user.balance

  const best  = holdings.length ? holdings.reduce((a, b) => b.plPct > a.plPct ? b : a) : null
  const worst = holdings.length ? holdings.reduce((a, b) => b.plPct < a.plPct ? b : a) : null
  const maxWeight  = holdings.length ? Math.max(...holdings.map(h => h.weight)) : 0
  const divScore   = divScoreCalc(holdings.length, maxWeight)

  const warnings = []
  if (holdings.length > 0 && maxWeight > 30) {
    const top = holdings.find(h => h.weight === maxWeight)
    warnings.push(`${top.sym} makes up ${maxWeight.toFixed(1)}% of your portfolio — consider diversifying.`)
  }
  if (gainPct < -10) {
    warnings.push(`Your portfolio is down ${Math.abs(gainPct).toFixed(1)}%. Review your positions.`)
  }

  const topMovers = [...prices.entries()]
    .sort((a, b) => Math.abs(b[1].changePct) - Math.abs(a[1].changePct))
    .slice(0, 6)

  container.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 py-6 space-y-6">

      <!-- Header -->
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 class="text-2xl font-display font-bold text-text-primary">
            Welcome back, ${state.user.displayName}
          </h1>
          <p class="text-text-muted text-sm mt-0.5">Level ${state.user.level} · ${state.user.xp.toLocaleString()} XP</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-text-muted">${hi.toLocaleString()} XP to next level</span>
          <div class="w-32 h-1.5 bg-surface-elevated rounded-full overflow-hidden">
            <div class="h-full bg-accent-secondary rounded-full transition-all duration-700" style="width:${xpPct}%"></div>
          </div>
        </div>
      </div>

      <!-- Stat cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        ${statCard('Total Value',   pc(totalVal),    gain,   'Portfolio net worth')}
        ${statCard('Cash',          pc(state.user.balance), null, 'Available to trade')}
        ${statCard('Invested',      pc(portVal),     null,   'Current market value')}
        ${statCard(`Total Return`,  `${gain >= 0 ? '+' : ''}${pc(gain)} (${gainPct >= 0 ? '+' : ''}${gainPct.toFixed(2)}%)`, gain, `vs starting ${pc(STARTING_BALANCE)}`)}
      </div>

      <!-- Warnings -->
      ${warnings.length ? `
        <div class="space-y-2">
          ${warnings.map(w => `
            <div class="flex items-start gap-3 px-4 py-3 rounded-xl border border-warning/30 bg-warning/5 text-sm text-warning">
              <span class="shrink-0 font-bold mt-0.5">!</span><span>${w}</span>
            </div>`).join('')}
        </div>` : ''}

      <!-- Class session -->
      ${sessionWidget()}

      <!-- Best / Worst -->
      ${holdings.length >= 2 ? `
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-surface border border-gain/30 rounded-2xl p-4">
            <div class="text-[10px] text-text-muted uppercase tracking-wide mb-1">Best Performer</div>
            <div class="text-base font-bold font-mono text-gain">${best.sym}</div>
            <div class="text-xs text-gain mt-0.5">${best.plPct >= 0 ? '+' : ''}${best.plPct.toFixed(2)}% · ${best.pl >= 0 ? '+' : ''}${pc(best.pl)}</div>
          </div>
          <div class="bg-surface border border-loss/30 rounded-2xl p-4">
            <div class="text-[10px] text-text-muted uppercase tracking-wide mb-1">Worst Performer</div>
            <div class="text-base font-bold font-mono ${gainClass(worst.pl)}">${worst.sym}</div>
            <div class="text-xs ${gainClass(worst.pl)} mt-0.5">${worst.plPct >= 0 ? '+' : ''}${worst.plPct.toFixed(2)}% · ${worst.pl >= 0 ? '+' : ''}${pc(worst.pl)}</div>
          </div>
        </div>` : ''}

      <!-- Holdings + sidebar -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- Holdings table -->
        <div class="lg:col-span-2 bg-surface border border-border rounded-2xl overflow-hidden">
          <div class="flex items-center justify-between px-5 py-4 border-b border-border gap-2 flex-wrap">
            <h2 class="font-semibold text-text-primary">Holdings</h2>
            <div class="flex gap-1">
              ${[['value','Value'],['pl','P&L'],['pct','%'],['sym','A–Z']].map(([k, l]) => `
                <button data-sort-h="${k}" class="sort-h-btn px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors
                  ${sortHolding === k ? 'bg-accent-primary text-bg border-accent-primary' : 'bg-surface border-border text-text-muted hover:text-text-primary'}">
                  ${l}
                </button>`).join('')}
            </div>
          </div>

          ${holdings.length === 0
            ? `<div class="px-5 py-12 text-center text-sm text-text-muted">
                No holdings yet. <a href="#stocks" class="text-accent-primary hover:underline">Browse stocks</a> to get started.
               </div>`
            : `<div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="text-[10px] text-text-muted uppercase tracking-wide border-b border-border">
                      <th class="text-left px-5 py-2.5">Stock</th>
                      <th class="text-right px-3 py-2.5">Shares</th>
                      <th class="text-right px-3 py-2.5 hidden sm:table-cell">Avg Cost</th>
                      <th class="text-right px-3 py-2.5">Price</th>
                      <th class="text-right px-3 py-2.5">Value</th>
                      <th class="text-right px-3 py-2.5 hidden md:table-cell">Weight</th>
                      <th class="text-right px-5 py-2.5">P&L</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-border">
                    ${holdings.map(({ sym, h, p, value, pl, plPct, weight }) => `
                      <tr class="hover:bg-surface-elevated/50 transition-colors group cursor-pointer" data-trade="${sym}">
                        <td class="px-5 py-3.5">
                          <div class="flex items-center gap-2">
                            <div class="w-1.5 h-8 rounded-full ${pl >= 0 ? 'bg-gain' : 'bg-loss'} shrink-0"></div>
                            <div>
                              <div class="font-mono font-bold text-text-primary">${sym}</div>
                              <div class="text-[10px] text-text-muted">${getStock(sym)?.name ?? ''}</div>
                            </div>
                          </div>
                        </td>
                        <td class="px-3 py-3.5 text-right tabular-nums text-text-secondary">${h.shares % 1 === 0 ? h.shares : h.shares.toFixed(4)}</td>
                        <td class="px-3 py-3.5 text-right tabular-nums text-text-muted hidden sm:table-cell">${pc(h.avgCost)}</td>
                        <td class="px-3 py-3.5 text-right tabular-nums text-text-secondary">${pc(p.price)}</td>
                        <td class="px-3 py-3.5 text-right tabular-nums font-medium text-text-primary">${pc(value)}</td>
                        <td class="px-3 py-3.5 text-right tabular-nums text-text-muted hidden md:table-cell">${weight.toFixed(1)}%</td>
                        <td class="px-5 py-3.5 text-right">
                          <div class="tabular-nums font-medium ${gainClass(pl)}">${pl >= 0 ? '+' : ''}${pc(pl)}</div>
                          <div class="text-[10px] opacity-70 ${gainClass(plPct)}">${pct(plPct)}</div>
                        </td>
                      </tr>`).join('')}
                  </tbody>
                </table>
               </div>`}
        </div>

        <!-- Sidebar -->
        <div class="space-y-4">

          <!-- Top movers -->
          <div class="bg-surface border border-border rounded-2xl overflow-hidden">
            <div class="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 class="font-semibold text-text-primary">Top Movers</h2>
              <a href="#stocks" class="text-xs text-accent-primary hover:underline">Trade →</a>
            </div>
            <div class="divide-y divide-border">
              ${topMovers.map(([sym, p]) => `
                <div class="flex items-center justify-between px-5 py-3 hover:bg-surface-elevated transition-colors cursor-pointer" data-trade="${sym}">
                  <span class="font-mono text-sm font-semibold text-text-primary">${sym}</span>
                  <div class="text-right">
                    <div class="text-xs tabular-nums text-text-secondary">${pc(p.price)}</div>
                    <div class="text-[10px] ${gainClass(p.changePct)} tabular-nums">${pct(p.changePct)}</div>
                  </div>
                </div>`).join('')}
            </div>
          </div>

          <!-- Diversification -->
          <div class="bg-surface border border-border rounded-2xl p-5">
            <div class="flex items-center justify-between mb-3">
              <h2 class="font-semibold text-text-primary">Diversification</h2>
              <span class="text-xs font-bold px-2.5 py-1 rounded-full ${divScore.badgeClass}">${divScore.label}</span>
            </div>
            <div class="w-full h-2 bg-surface-elevated rounded-full overflow-hidden mb-2">
              <div class="h-full rounded-full transition-all duration-500 ${divScore.barClass}" style="width:${divScore.pct}%"></div>
            </div>
            <p class="text-[11px] text-text-muted leading-relaxed">${divScore.tip}</p>
          </div>

          <!-- Composition doughnut -->
          <div class="bg-surface border border-border rounded-2xl p-5">
            <h2 class="font-semibold text-text-primary mb-4">Composition</h2>
            ${Object.keys(allocation).length > 0
              ? `<div class="relative h-44"><canvas id="doughnut-chart"></canvas></div>`
              : `<div class="text-sm text-text-muted">No holdings to chart.</div>`}
          </div>

          <!-- Stats -->
          <div class="bg-surface border border-border rounded-2xl p-5 space-y-2.5">
            <h2 class="font-semibold text-text-primary mb-1">Stats</h2>
            ${stat('Total trades',   state.transactions.length)}
            ${stat('Buys',           state.transactions.filter(t => t.type === 'buy').length)}
            ${stat('Sells',          state.transactions.filter(t => t.type === 'sell').length)}
            ${stat('Fees paid',      pc(totalFees))}
            ${stat('XP earned',      state.user.xp.toLocaleString())}
            ${stat('Level',          state.user.level)}
          </div>

        </div>
      </div>

      <!-- Charts row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <!-- Net worth -->
        <div class="bg-surface border border-border rounded-2xl p-5">
          <h2 class="font-semibold text-text-primary mb-4">Net Worth Over Time</h2>
          ${state.netWorthHistory.length > 1
            ? `<div class="relative h-40"><canvas id="networth-chart"></canvas></div>`
            : `<div class="text-sm text-text-muted py-6 text-center">Keep trading — chart appears after a few minutes.</div>`}
        </div>

        <!-- P&L bars -->
        <div class="bg-surface border border-border rounded-2xl p-5">
          <h2 class="font-semibold text-text-primary mb-4">P&L by Holding</h2>
          ${holdings.length > 0
            ? `<div class="space-y-2">${plBarChart(holdings)}</div>`
            : `<div class="text-sm text-text-muted py-6 text-center">No holdings yet.</div>`}
        </div>

      </div>

      <!-- Open Orders -->
      ${openOrders.length > 0 ? `
      <div class="bg-surface border border-border rounded-2xl overflow-hidden">
        <div class="px-5 py-4 border-b border-border">
          <h2 class="font-semibold text-text-primary">Open Orders <span class="text-xs text-text-muted ml-1">(${openOrders.length})</span></h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-[10px] text-text-muted uppercase tracking-wide border-b border-border">
                <th class="text-left px-5 py-2.5">Type</th>
                <th class="text-left px-3 py-2.5">Symbol</th>
                <th class="text-right px-3 py-2.5">Shares</th>
                <th class="text-right px-3 py-2.5">Target</th>
                <th class="text-right px-5 py-2.5">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              ${openOrders.map(o => `
                <tr class="hover:bg-surface-elevated/50 transition-colors">
                  <td class="px-5 py-3">
                    <span class="text-xs font-bold px-2 py-0.5 rounded-full
                      ${o.type === 'limit' ? 'bg-accent-primary/10 text-accent-primary' : 'bg-warning/10 text-warning'}">
                      ${o.type === 'limit' ? 'LIMIT' : 'STOP'}
                    </span>
                    <span class="text-xs text-text-muted ml-1">${o.side.toUpperCase()}</span>
                  </td>
                  <td class="px-3 py-3 font-mono font-semibold text-text-primary">${o.symbol}</td>
                  <td class="px-3 py-3 text-right tabular-nums text-text-secondary">${o.qty % 1 === 0 ? o.qty : o.qty.toFixed(4)}</td>
                  <td class="px-3 py-3 text-right tabular-nums text-text-secondary">${pc(o.targetPrice)}</td>
                  <td class="px-5 py-3 text-right">
                    <button data-cancel-order="${o.id}" class="text-xs text-loss hover:text-loss/80 transition-colors">Cancel</button>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>` : ''}

      <!-- Transaction history -->
      <div class="bg-surface border border-border rounded-2xl overflow-hidden">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 border-b border-border gap-3">
          <div>
            <h2 class="font-semibold text-text-primary">Transaction History</h2>
            <div class="text-xs text-text-muted mt-0.5">${state.transactions.length} trades · ${pc(totalFees)} fees paid</div>
          </div>
          <div class="flex gap-1">
            ${[['all','All'],['buy','Buys'],['sell','Sells']].map(([k, l]) => `
              <button data-tx-filter="${k}" class="tx-filter-btn px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors
                ${txFilter === k ? 'bg-accent-primary text-bg border-accent-primary' : 'bg-surface border-border text-text-muted hover:text-text-primary'}">
                ${l}
              </button>`).join('')}
          </div>
        </div>
        ${txs.length === 0
          ? `<div class="px-5 py-10 text-center text-sm text-text-muted">No transactions yet.</div>`
          : `<div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-[10px] text-text-muted uppercase tracking-wide border-b border-border">
                    <th class="text-left px-5 py-2.5">Type</th>
                    <th class="text-left px-3 py-2.5">Symbol</th>
                    <th class="text-right px-3 py-2.5">Shares</th>
                    <th class="text-right px-3 py-2.5">Price</th>
                    <th class="text-right px-3 py-2.5">Fee</th>
                    <th class="text-right px-5 py-2.5">Total</th>
                    <th class="text-right px-5 py-2.5 hidden sm:table-cell">Time</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border">
                  ${txs.map(tx => `
                    <tr class="hover:bg-surface-elevated/50 transition-colors">
                      <td class="px-5 py-3">
                        <span class="text-xs font-bold px-2 py-0.5 rounded-full
                          ${tx.type === 'buy' ? 'bg-gain/10 text-gain' : 'bg-loss/10 text-loss'}">
                          ${tx.type.toUpperCase()}
                        </span>
                      </td>
                      <td class="px-3 py-3 font-mono font-semibold text-text-primary">${tx.symbol}</td>
                      <td class="px-3 py-3 text-right tabular-nums text-text-secondary">${tx.qty % 1 === 0 ? tx.qty : tx.qty.toFixed(4)}</td>
                      <td class="px-3 py-3 text-right tabular-nums text-text-secondary">${pc(tx.price)}</td>
                      <td class="px-3 py-3 text-right tabular-nums text-warning">${pc(tx.fee)}</td>
                      <td class="px-5 py-3 text-right">
                        <div class="tabular-nums font-medium ${tx.type === 'buy' ? 'text-loss' : 'text-gain'}">
                          ${tx.type === 'buy' ? '-' : '+'}${pc(tx.total)}
                        </div>
                        ${tx.type === 'sell' && tx.realizedGain != null ? `
                          <div class="text-[10px] ${gainClass(tx.realizedGain)}">${tx.realizedGain >= 0 ? '+' : ''}${pc(tx.realizedGain)} realized</div>
                        ` : ''}
                      </td>
                      <td class="px-5 py-3 text-right text-[10px] text-text-muted hidden sm:table-cell">${relativeTime(tx.ts)}</td>
                    </tr>`).join('')}
                </tbody>
              </table>
             </div>`}
      </div>

      <!-- Quick Trade -->
      <div class="bg-surface border border-border rounded-2xl p-5">
        <h2 class="font-semibold text-text-primary mb-4">Quick Trade</h2>
        <div class="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-10 gap-2">
          ${STOCKS.slice(0, 10).map(s => {
            const p = prices.get(s.symbol) ?? { price: 0, changePct: 0 }
            return `
              <button data-symbol="${s.symbol}" class="quick-trade-btn flex flex-col items-center p-3 bg-surface-elevated border border-border rounded-xl hover:border-accent-primary transition-colors group">
                <div class="font-mono text-xs font-bold text-text-primary group-hover:text-accent-primary">${s.symbol}</div>
                <div class="text-[10px] text-text-muted mt-0.5">${pc(p.price)}</div>
                <div class="text-[10px] ${gainClass(p.changePct)} mt-0.5">${pct(p.changePct)}</div>
              </button>`
          }).join('')}
        </div>
      </div>

      <!-- Danger zone -->
      <div class="flex justify-end">
        <button id="reset-portfolio-btn" class="px-4 py-2 rounded-lg border border-loss/40 text-loss text-xs font-medium hover:bg-loss/10 transition-colors">
          Reset Portfolio
        </button>
      </div>

    </div>
  `

  setTimeout(() => {
    buildDoughnut(allocation, totalVal)
    buildNetWorth(state.netWorthHistory)
  }, 50)

  bindEvents()
}

// ── Session widget ────────────────────────────────────────────────────────────

function sessionWidget() {
  if (!supabase) return ''
  if (activeSession) {
    const dot = activeSession.status === 'active' ? 'bg-gain animate-pulse' : 'bg-warning'
    const statusColor = activeSession.status === 'active' ? 'text-gain' : 'text-warning'
    return `
      <div class="bg-surface border border-accent-primary/30 rounded-2xl p-4 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-accent-primary/10 border border-accent-primary/30 flex items-center justify-center text-xs font-bold text-accent-primary">EDU</div>
          <div>
            <div class="text-sm font-semibold text-text-primary">${activeSession.name}</div>
            <div class="flex items-center gap-1.5 mt-0.5">
              <span class="w-1.5 h-1.5 rounded-full ${dot}"></span>
              <span class="text-xs ${statusColor} capitalize">${activeSession.status}</span>
              <span class="text-xs text-text-muted">· Code: <span class="font-mono font-bold text-text-secondary">${activeSession.join_code}</span></span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <a href="#leaderboard" class="px-3 py-1.5 rounded-lg bg-accent-primary/10 border border-accent-primary/30 text-accent-primary text-xs font-semibold hover:bg-accent-primary hover:text-bg transition-colors">Leaderboard</a>
          <button id="leave-session-btn" class="px-3 py-1.5 rounded-lg bg-surface-elevated border border-border text-text-muted text-xs hover:text-loss hover:border-loss/50 transition-colors">Leave</button>
        </div>
      </div>`
  }
  return `
    <div class="bg-surface border border-border rounded-2xl p-4">
      <div class="flex flex-col sm:flex-row sm:items-center gap-3">
        <div class="flex items-center gap-3 flex-1">
          <div class="w-9 h-9 rounded-xl bg-surface-elevated border border-border flex items-center justify-center text-xs font-bold text-text-muted">EDU</div>
          <div>
            <div class="text-sm font-semibold text-text-primary">Join a Class</div>
            <div class="text-xs text-text-muted">Enter your teacher's 6-digit join code</div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <input id="join-code-input" type="text" maxlength="6" placeholder="ABC123"
            class="w-28 bg-bg border border-border rounded-lg px-3 py-2 text-sm font-mono font-bold text-text-primary placeholder-text-muted text-center uppercase focus:outline-none focus:border-accent-primary transition-colors tracking-widest" />
          <button id="join-session-btn" class="px-4 py-2 rounded-lg bg-accent-primary text-bg text-sm font-semibold hover:bg-accent-primary/90 transition-colors">Join</button>
        </div>
      </div>
      <div id="join-error" class="hidden mt-2 text-xs text-loss"></div>
    </div>`
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function statCard(label, value, gain, sub) {
  const dir = gain === null ? '' : gainClass(gain)
  return `
    <div class="bg-surface border border-border rounded-2xl p-4">
      <div class="text-xs text-text-muted uppercase tracking-wide mb-1">${label}</div>
      <div class="text-xl font-bold font-mono ${dir || 'text-text-primary'}">${value}</div>
      ${sub ? `<div class="text-[10px] text-text-muted mt-0.5">${sub}</div>` : ''}
    </div>`
}

function stat(label, value) {
  return `
    <div class="flex justify-between text-sm">
      <span class="text-text-muted">${label}</span>
      <span class="text-text-secondary font-medium">${value}</span>
    </div>`
}

function plBarChart(holdings) {
  const sorted = [...holdings].sort((a, b) => b.plPct - a.plPct)
  const maxAbs = Math.max(...sorted.map(h => Math.abs(h.plPct)), 0.01)
  return sorted.map(({ sym, pl, plPct }) => {
    const barW  = Math.min((Math.abs(plPct) / maxAbs) * 100, 100)
    const isGain = pl >= 0
    return `
      <div class="flex items-center gap-2">
        <div class="w-12 text-[10px] font-mono font-bold text-text-secondary shrink-0 text-right">${sym}</div>
        <div class="flex-1 h-5 bg-surface-elevated rounded overflow-hidden relative">
          <div class="absolute inset-y-0 left-0 ${isGain ? 'bg-gain' : 'bg-loss'} rounded transition-all duration-500" style="width:${barW}%"></div>
        </div>
        <div class="w-14 text-[10px] tabular-nums ${isGain ? 'text-gain' : 'text-loss'} shrink-0">${plPct >= 0 ? '+' : ''}${plPct.toFixed(2)}%</div>
      </div>`
  }).join('')
}

function divScoreCalc(n, maxW) {
  if (n === 0)                        return { label: 'No Holdings',          badgeClass: 'bg-surface-elevated text-text-muted', barClass: 'bg-text-muted', pct: 0,   tip: 'Start trading to build a portfolio.' }
  if (n >= 5 && maxW <= 30)           return { label: 'Well Diversified',     badgeClass: 'bg-gain/15 text-gain',               barClass: 'bg-gain',       pct: 100, tip: 'Great job — 5+ stocks with no single position above 30%.' }
  if (n >= 3  || maxW <= 50)          return { label: 'Moderate',             badgeClass: 'bg-warning/15 text-warning',         barClass: 'bg-warning',    pct: 55,  tip: 'Hold more stocks and keep each position below 30% to improve diversification.' }
  return                                       { label: 'Concentrated',        badgeClass: 'bg-loss/15 text-loss',               barClass: 'bg-loss',       pct: 20,  tip: 'Heavily concentrated. One bad stock day could hurt you significantly.' }
}

// ── Charts ────────────────────────────────────────────────────────────────────

const STOCK_COLORS = ['#00D4AA','#6366F1','#10B981','#F59E0B','#EF4444','#3B82F6','#8B5CF6','#EC4899','#14B8A6','#F97316']

function buildDoughnut(allocation, totalVal) {
  const canvas = document.getElementById('doughnut-chart')
  if (!canvas || Object.keys(allocation).length === 0) return
  const labels = Object.keys(allocation)
  const data   = Object.values(allocation)
  const total  = data.reduce((s, v) => s + v, 0)
  doughnutChart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data, backgroundColor: labels.map((_, i) => i === labels.indexOf('Cash') ? '#374151' : STOCK_COLORS[i % STOCK_COLORS.length]), borderColor: 'transparent', borderWidth: 2 }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: '#9CA3AF', font: { size: 10 }, boxWidth: 10, padding: 8 } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${pc(ctx.raw)} (${((ctx.raw / total) * 100).toFixed(1)}%)` }, backgroundColor: '#111827', borderColor: '#1F2937', borderWidth: 1, titleColor: '#9CA3AF', bodyColor: '#F9FAFB' },
      },
      cutout: '62%',
    },
    plugins: [{ id: 'centerText', afterDraw(chart) {
      const { ctx, chartArea: { width, height, left, top } } = chart
      ctx.save(); ctx.font = 'bold 13px monospace'; ctx.fillStyle = '#F9FAFB'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(pc(totalVal), left + width / 2, top + height / 2); ctx.restore()
    }}],
  })
}

function buildNetWorth(history) {
  const canvas = document.getElementById('networth-chart')
  if (!canvas || history.length < 2) return
  const labels = history.map(h => new Date(h.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
  const data   = history.map(h => h.value)
  const isUp   = (data.at(-1) ?? 0) >= STARTING_BALANCE
  const color  = isUp ? '#10B981' : '#EF4444'
  netWorthChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Net Worth', data, borderColor: color, borderWidth: 2, pointRadius: 0, fill: true, backgroundColor: color + '22', tension: 0.3 },
        { label: 'Start', data: Array(data.length).fill(STARTING_BALANCE), borderColor: '#374151', borderWidth: 1, borderDash: [4, 4], pointRadius: 0, fill: false },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${pc(ctx.raw)}` }, backgroundColor: '#111827', borderColor: '#1F2937', borderWidth: 1, titleColor: '#9CA3AF', bodyColor: '#F9FAFB' },
      },
      scales: {
        x: { ticks: { color: '#6B7280', maxTicksLimit: 5, maxRotation: 0 }, grid: { color: '#1F2937' } },
        y: { ticks: { color: '#6B7280', callback: v => pc(v) }, grid: { color: '#1F2937' }, position: 'right' },
      },
    },
  })
}

// ── Events ────────────────────────────────────────────────────────────────────

function bindEvents() {
  container.querySelectorAll('[data-trade]').forEach(el => {
    el.addEventListener('click', () => openTradeModal(el.dataset.trade))
  })
  container.querySelectorAll('.quick-trade-btn').forEach(btn => {
    btn.addEventListener('click', () => openTradeModal(btn.dataset.symbol))
  })
  container.querySelectorAll('.sort-h-btn').forEach(btn => {
    btn.addEventListener('click', () => { sortHolding = btn.dataset.sortH; render() })
  })
  container.querySelectorAll('.tx-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => { txFilter = btn.dataset.txFilter; render() })
  })
  container.querySelectorAll('[data-cancel-order]').forEach(btn => {
    btn.addEventListener('click', () => { cancelOrder(btn.dataset.cancelOrder); render() })
  })
  container.querySelector('#reset-portfolio-btn')?.addEventListener('click', () => {
    if (confirm(`Reset your portfolio to ${pc(STARTING_BALANCE)}? This cannot be undone.`)) resetPortfolio()
  })

  const joinBtn   = container.querySelector('#join-session-btn')
  const joinErr   = container.querySelector('#join-error')
  const codeInput = container.querySelector('#join-code-input')
  codeInput?.addEventListener('input', () => { codeInput.value = codeInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })
  joinBtn?.addEventListener('click', async () => {
    const code = codeInput?.value.trim()
    if (!code || code.length < 6) { joinErr.textContent = 'Enter a 6-character code'; joinErr.classList.remove('hidden'); return }
    joinBtn.disabled = true; joinBtn.textContent = 'Joining…'; joinErr.classList.add('hidden')
    try {
      const { session } = await joinSession(code)
      activeSession = session
      window.dispatchEvent(new Event('session-joined'))
      render()
    } catch (err) {
      joinErr.textContent = err.message; joinErr.classList.remove('hidden')
      joinBtn.disabled = false; joinBtn.textContent = 'Join'
    }
  })
  container.querySelector('#leave-session-btn')?.addEventListener('click', () => {
    if (!confirm('Leave this class session?')) return
    leaveSession(); activeSession = null; render()
  })
}
