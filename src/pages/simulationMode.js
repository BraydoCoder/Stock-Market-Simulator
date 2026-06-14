// simulationMode.js — Backtesting simulator with candlestick chart
import { STOCKS } from '../data/stocks.js'
import { pc } from '../utils/format.js'

let container   = null
let _symbol     = 'AAPL'
let _startDate  = ''
let _endDate    = ''
let _candles    = []
let _predOpen   = false
let _resizeObs  = null
let _started    = false
let _simStartPx = 0

const STARTING_CASH = 10_000

// Risk by sector
const RISK = {
  Technology: 'High', Healthcare: 'Medium', Finance: 'Medium',
  Consumer: 'Low', Energy: 'High', Utilities: 'Low',
}

export function mountSimulationMode(el) {
  container   = el
  const today = new Date()
  const yearAgo = new Date(today)
  yearAgo.setFullYear(today.getFullYear() - 1)
  _startDate  = _isoDate(yearAgo)
  _endDate    = _isoDate(today)
  _symbol     = 'AAPL'
  _candles    = []
  _predOpen   = false
  _started    = false
  _simStartPx = 0
  _render()
}

export function unmountSimulationMode() {
  _resizeObs?.disconnect()
  _resizeObs = null
  container  = null
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function _isoDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function _countBizDays(start, end) {
  let count = 0
  const d = new Date(start)
  d.setHours(12, 0, 0, 0)
  const e = new Date(end)
  e.setHours(12, 0, 0, 0)
  while (d <= e) {
    if (d.getDay() !== 0 && d.getDay() !== 6) count++
    d.setDate(d.getDate() + 1)
  }
  return count
}

// ── OHLC generation ────────────────────────────────────────────────────────────

function _sr(seed) {
  return ((seed * 9301 + 49297) % 233280) / 233280
}

function _genOHLC(symbol, startDate, endDate) {
  const stock     = STOCKS.find(s => s.symbol === symbol) ?? STOCKS[0]
  const seedBase  = symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  let price       = stock.basePrice * (0.85 + _sr(seedBase * 3) * 0.30)

  const candles = []
  const d = new Date(startDate)
  d.setHours(12, 0, 0, 0)
  const end = new Date(endDate)
  end.setHours(12, 0, 0, 0)

  let idx = 0
  while (d <= end) {
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      const s1 = seedBase + idx * 7919
      const s2 = s1 + 3, s3 = s1 + 7, s4 = s1 + 11

      // Add mild upward drift (~5% annual)
      const drift   = 0.05 / 252
      const change  = price * ((_sr(s1) * 0.05 - 0.025) + drift)
      const open    = _r2(price)
      const close   = _r2(Math.max(price + change, 0.01))
      const high    = _r2(Math.max(open, close) * (1 + _sr(s2) * 0.015))
      const low     = _r2(Math.min(open, close) * (1 - _sr(s3) * 0.015))
      const volume  = Math.round(_sr(s4) * 3_000_000 + 300_000)

      candles.push({ date: new Date(d), open, high, low, close, volume })
      price = close
      idx++
    }
    d.setDate(d.getDate() + 1)
  }
  return candles
}

function _r2(n) { return Math.round(n * 100) / 100 }

// ── Prediction ─────────────────────────────────────────────────────────────────

function _computePrediction(candles) {
  if (candles.length < 10) return null
  const recent = candles.slice(-20)
  const n      = recent.length
  const prices = recent.map(c => c.close)

  const xMean = (n - 1) / 2
  const yMean = prices.reduce((a, b) => a + b, 0) / n
  let num = 0, den = 0
  prices.forEach((y, i) => { num += (i - xMean) * (y - yMean); den += (i - xMean) ** 2 })
  const slope = den !== 0 ? num / den : 0

  const lastClose = prices[n - 1]
  const pred30d   = _r2(Math.max(lastClose + slope * 30, 0.01))
  const predPct   = ((pred30d - lastClose) / lastClose) * 100

  const returns  = prices.slice(1).map((p, i) => (p - prices[i]) / prices[i])
  const avgRet   = returns.reduce((a, b) => a + b, 0) / returns.length
  const variance = returns.reduce((a, b) => a + (b - avgRet) ** 2, 0) / returns.length
  const stdDev   = Math.sqrt(variance)
  const annualVol = (stdDev * Math.sqrt(252) * 100).toFixed(1)
  const confidence = Math.min(95, Math.max(40, Math.round(Math.abs(slope) / Math.max(stdDev * lastClose, 0.001) * 100 + 40)))

  return { bullish: slope > 0, pred30d, predPct, annualVol, confidence }
}

// ── Chart drawing ──────────────────────────────────────────────────────────────

function _drawChart() {
  if (!container || !_candles.length) return
  const canvas = container.querySelector('#sim-chart-canvas')
  if (!canvas) return

  const wrap = canvas.parentElement
  const W    = wrap.clientWidth
  const H    = wrap.clientHeight
  if (W <= 0 || H <= 0) return

  const dpr = window.devicePixelRatio || 1
  canvas.width  = W * dpr
  canvas.height = H * dpr
  canvas.style.width  = W + 'px'
  canvas.style.height = H + 'px'

  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, W, H)

  const PAD_TOP    = 20
  const PAD_RIGHT  = 74
  const PAD_BOTTOM = 28
  const VOL_H      = Math.round(H * 0.18)
  const CHART_H    = H - PAD_TOP - PAD_BOTTOM - VOL_H - 6

  const candles = _candles
  const prices  = candles.flatMap(c => [c.high, c.low])
  const minP    = Math.min(...prices)
  const maxP    = Math.max(...prices)
  const pRange  = maxP - minP || 1
  const pad     = pRange * 0.05
  const lo      = minP - pad
  const hi      = maxP + pad
  const range   = hi - lo

  const toY = (p) => PAD_TOP + CHART_H - ((p - lo) / range) * CHART_H

  const volMax  = Math.max(...candles.map(c => c.volume))
  const volBase = H - PAD_BOTTOM
  const volY    = (v) => volBase - Math.round((v / volMax) * VOL_H)

  const n        = candles.length
  const chartW   = W - PAD_RIGHT
  const candleW  = chartW / n
  const bodyMinW = Math.max(1, candleW * 0.55)

  // Horizontal grid lines
  const gridCount = 5
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'
  ctx.lineWidth   = 1
  for (let i = 0; i <= gridCount; i++) {
    const y = PAD_TOP + (CHART_H / gridCount) * i
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(chartW, y); ctx.stroke()
  }

  // Y-axis price labels
  ctx.fillStyle = 'rgba(156,163,175,0.85)'
  ctx.font      = '10px "JetBrains Mono", monospace'
  ctx.textAlign = 'left'
  for (let i = 0; i <= gridCount; i++) {
    const p = hi - (range / gridCount) * i
    const y = PAD_TOP + (CHART_H / gridCount) * i
    ctx.fillText(p.toFixed(2), chartW + 6, y + 4)
  }

  // Draw candles + volume
  for (let i = 0; i < n; i++) {
    const c     = candles[i]
    const cx    = i * candleW + candleW / 2
    const bull  = c.close >= c.open
    const color = bull ? '#26a69a' : '#ef5350'
    const volCol = bull ? 'rgba(38,166,154,0.45)' : 'rgba(239,83,80,0.45)'

    // Wick
    ctx.strokeStyle = color
    ctx.lineWidth   = Math.max(1, candleW * 0.1)
    ctx.beginPath()
    ctx.moveTo(cx, toY(c.high))
    ctx.lineTo(cx, toY(c.low))
    ctx.stroke()

    // Body
    const yO   = toY(c.open)
    const yC   = toY(c.close)
    const yTop = Math.min(yO, yC)
    const bH   = Math.max(1, Math.abs(yO - yC))
    ctx.fillStyle = color
    ctx.fillRect(cx - bodyMinW / 2, yTop, bodyMinW, bH)

    // Volume bar
    ctx.fillStyle = volCol
    const vT = volY(c.volume)
    ctx.fillRect(cx - bodyMinW / 2, vT, bodyMinW, volBase - vT)
  }

  // X-axis date labels
  ctx.fillStyle = 'rgba(156,163,175,0.75)'
  ctx.font      = '10px system-ui, sans-serif'
  ctx.textAlign = 'center'
  const step = Math.max(1, Math.ceil(n / 8))
  for (let i = 0; i < n; i += step) {
    const c  = candles[i]
    const cx = i * candleW + candleW / 2
    const lbl = c.date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    ctx.fillText(lbl, cx, H - PAD_BOTTOM + 14)
  }

  // Volume divider
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'
  ctx.lineWidth   = 1
  ctx.beginPath()
  ctx.moveTo(0, H - PAD_BOTTOM - VOL_H)
  ctx.lineTo(chartW, H - PAD_BOTTOM - VOL_H)
  ctx.stroke()

  // Current price dashed line + label
  const last   = candles[n - 1]
  const prev   = candles[n - 2]
  const lastY  = toY(last.close)
  const pxUp   = prev ? last.close >= prev.close : true
  const lblBg  = pxUp ? '#26a69a' : '#ef5350'

  ctx.strokeStyle = lblBg
  ctx.lineWidth   = 1
  ctx.setLineDash([4, 3])
  ctx.beginPath()
  ctx.moveTo(0, lastY)
  ctx.lineTo(chartW + 2, lastY)
  ctx.stroke()
  ctx.setLineDash([])

  // Price label box (right side)
  const lW = 68, lH = 18
  ctx.fillStyle = lblBg
  ctx.beginPath()
  if (ctx.roundRect) {
    ctx.roundRect(chartW + 3, lastY - 9, lW, lH, 3)
  } else {
    ctx.rect(chartW + 3, lastY - 9, lW, lH)
  }
  ctx.fill()

  ctx.fillStyle = '#fff'
  ctx.font      = 'bold 10px "JetBrains Mono", monospace'
  ctx.textAlign = 'center'
  ctx.fillText(last.close.toFixed(2), chartW + 3 + lW / 2, lastY + 4)
}

// ── Render ─────────────────────────────────────────────────────────────────────

function _render() {
  if (!container) return

  const stock      = STOCKS.find(s => s.symbol === _symbol) ?? STOCKS[0]
  const risk       = RISK[stock.sector] ?? 'Medium'
  const last       = _candles[_candles.length - 1]
  const prev       = _candles[_candles.length - 2]
  const currentPx  = last?.close ?? stock.basePrice
  const prevPx     = prev?.close ?? currentPx
  const pxChange   = currentPx - prevPx
  const pxChangePct = prevPx ? (pxChange / prevPx) * 100 : 0
  const pxUp       = pxChange >= 0

  const shares   = _simStartPx > 0 ? Math.floor(STARTING_CASH / _simStartPx) : 0
  const spent    = shares * _simStartPx
  const simValue = _started ? (shares * currentPx + (STARTING_CASH - spent)) : STARTING_CASH
  const simRet   = ((simValue - STARTING_CASH) / STARTING_CASH) * 100
  const retUp    = simRet >= 0

  const pred = _computePrediction(_candles)

  const bizDays = (_startDate && _endDate)
    ? _countBizDays(new Date(_startDate), new Date(_endDate))
    : 0

  const riskCls = risk === 'Low'
    ? 'bg-gain/10 border-gain/30 text-gain'
    : risk === 'High'
    ? 'bg-loss/10 border-loss/30 text-loss'
    : 'bg-warning/10 border-warning/30 text-warning'

  container.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 py-6 space-y-5">

      <!-- Header -->
      <div>
        <h1 class="text-2xl font-display font-bold text-text-primary">Simulation Mode</h1>
        <p class="text-sm text-text-muted mt-1">Travel back in time and trade using simulated historical prices. Test your strategy.</p>
      </div>

      <!-- Controls -->
      <div class="bg-surface border border-border rounded-2xl p-4 space-y-3">
        <div class="flex flex-col sm:flex-row gap-3 items-end">
          <div class="flex-1 min-w-0">
            <label class="text-[10px] text-text-muted uppercase tracking-wider mb-1.5 block">Stock</label>
            <select id="sim-symbol"
              class="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-primary transition-colors">
              ${STOCKS.map(s => `<option value="${s.symbol}" ${s.symbol === _symbol ? 'selected' : ''}>${s.symbol} — ${s.name}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="text-[10px] text-text-muted uppercase tracking-wider mb-1.5 block">Start Date</label>
            <input id="sim-start" type="date" value="${_startDate}"
              class="bg-surface-elevated border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-primary transition-colors cursor-pointer" />
          </div>
          <div>
            <label class="text-[10px] text-text-muted uppercase tracking-wider mb-1.5 block">End Date</label>
            <input id="sim-end" type="date" value="${_endDate}"
              class="bg-surface-elevated border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-primary transition-colors cursor-pointer" />
          </div>
          <button id="sim-run"
            class="flex-shrink-0 flex items-center gap-2 px-7 py-2.5 rounded-xl bg-gain text-bg font-bold text-sm
                   hover:bg-gain/90 active:scale-95 transition-all whitespace-nowrap">
            &#9654; Start
          </button>
        </div>
        ${bizDays > 0 ? `
          <p class="text-xs text-text-muted">
            <span class="text-text-secondary font-semibold">~${bizDays} trading days</span>
            &nbsp;&nbsp;${_startDate} &rarr; ${_endDate}
          </p>
        ` : ''}
      </div>

      <!-- Main grid -->
      <div class="grid grid-cols-1 lg:grid-cols-[1fr_288px] gap-4">

        <!-- Chart card -->
        <div class="bg-surface border border-border rounded-2xl overflow-hidden">
          ${_started && _candles.length ? `

            <!-- Chart header row -->
            <div class="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-border">
              <span class="font-bold font-mono text-text-primary text-base">${_symbol}</span>
              <span class="text-text-muted text-xs">${stock.name}</span>
              <span class="text-[10px] font-medium px-2 py-0.5 rounded-full border ${riskCls}">
                ${risk} Risk
              </span>
              <div class="ml-auto flex items-center gap-3">
                <span class="font-mono font-bold text-xl text-text-primary">${pc(currentPx)}</span>
                <span class="text-sm font-medium flex items-center gap-1 ${pxUp ? 'text-gain' : 'text-loss'}">
                  ${pxUp ? '&#9650;' : '&#9660;'} ${Math.abs(pxChangePct).toFixed(2)}%
                </span>
              </div>
            </div>

            <!-- Canvas wrapper -->
            <div id="sim-chart-wrap" style="position:relative;height:420px;">
              <canvas id="sim-chart-canvas" style="display:block;"></canvas>
            </div>

          ` : `
            <div class="flex flex-col items-center justify-center" style="height:420px;">
              <div class="text-5xl mb-4">📈</div>
              <div class="text-sm text-text-muted text-center max-w-xs leading-relaxed">
                Select a stock and date range above,<br>then click <strong class="text-text-primary">Start</strong> to run the simulation.
              </div>
            </div>
          `}
        </div>

        <!-- Sidebar -->
        <div class="space-y-3">

          <!-- Simulation Portfolio -->
          <div class="bg-surface border border-border rounded-2xl p-4">
            <h3 class="font-semibold text-text-primary mb-3 text-sm">Simulation Portfolio</h3>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <div class="text-[10px] text-text-muted uppercase tracking-wider mb-1">Cash</div>
                <div class="font-mono font-bold text-text-primary">${pc(STARTING_CASH)}</div>
              </div>
              <div>
                <div class="text-[10px] text-text-muted uppercase tracking-wider mb-1">Return</div>
                <div class="font-mono font-bold ${_started && _simStartPx > 0 ? (retUp ? 'text-gain' : 'text-loss') : 'text-text-muted'}">
                  ${_started && _simStartPx > 0
                    ? `${retUp ? '+' : ''}${simRet.toFixed(2)}%`
                    : '+0.00%'}
                </div>
              </div>
            </div>

            ${_started && _simStartPx > 0 ? `
              <div class="mt-3 pt-3 border-t border-border space-y-2">
                <div class="flex justify-between text-xs">
                  <span class="text-text-muted">Shares bought</span>
                  <span class="text-text-secondary font-mono">${shares}</span>
                </div>
                <div class="flex justify-between text-xs">
                  <span class="text-text-muted">Buy price</span>
                  <span class="text-text-secondary font-mono">${pc(_simStartPx)}</span>
                </div>
                <div class="flex justify-between text-xs">
                  <span class="text-text-muted">Current price</span>
                  <span class="text-text-secondary font-mono">${pc(currentPx)}</span>
                </div>
                <div class="flex justify-between text-xs border-t border-border pt-2">
                  <span class="text-text-muted">Portfolio value</span>
                  <span class="font-mono font-bold ${retUp ? 'text-gain' : 'text-loss'}">${pc(simValue)}</span>
                </div>
                <div class="flex justify-between text-xs">
                  <span class="text-text-muted">P&amp;L</span>
                  <span class="font-mono font-bold ${retUp ? 'text-gain' : 'text-loss'}">
                    ${retUp ? '+' : ''}${pc(simValue - STARTING_CASH)}
                  </span>
                </div>
              </div>
            ` : `
              <p class="mt-3 text-[11px] text-text-muted leading-relaxed">
                Run a simulation to see how ${pc(STARTING_CASH)} invested at the start date would perform.
              </p>
            `}
          </div>

          <!-- AI Prediction -->
          <div class="bg-surface border border-border rounded-2xl overflow-hidden">
            <button id="sim-pred-toggle"
              class="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-elevated transition-colors cursor-pointer text-left">
              <div class="flex items-center gap-2">
                <span class="text-lg">&#129504;</span>
                <span class="font-semibold text-text-primary text-sm">AI Prediction</span>
              </div>
              <span class="text-text-muted text-xs transition-transform ${_predOpen ? 'rotate-180' : ''}"
                style="display:inline-block;transform:${_predOpen ? 'rotate(180deg)' : 'none'}">&#9660;</span>
            </button>

            ${_predOpen ? `
              <div class="border-t border-border p-4">
                ${_started && pred ? `
                  <div class="space-y-3">
                    <div class="flex items-center justify-between">
                      <span class="text-xs text-text-muted">30-Day Trend</span>
                      <span class="text-xs font-bold px-2.5 py-0.5 rounded-full border
                        ${pred.bullish ? 'bg-gain/10 border-gain/30 text-gain' : 'bg-loss/10 border-loss/30 text-loss'}">
                        ${pred.bullish ? '&#9650; Bullish' : '&#9660; Bearish'}
                      </span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-xs text-text-muted">Predicted Price</span>
                      <span class="text-xs font-mono font-bold text-text-primary">${pc(pred.pred30d)}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-xs text-text-muted">Expected Move</span>
                      <span class="text-xs font-mono font-semibold ${pred.predPct >= 0 ? 'text-gain' : 'text-loss'}">
                        ${pred.predPct >= 0 ? '+' : ''}${pred.predPct.toFixed(2)}%
                      </span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-xs text-text-muted">Annual Volatility</span>
                      <span class="text-xs font-mono text-text-secondary">${pred.annualVol}%</span>
                    </div>
                    <div>
                      <div class="text-[10px] text-text-muted uppercase tracking-wider mb-1.5">Confidence</div>
                      <div class="flex items-center gap-2">
                        <div class="flex-1 h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                          <div class="h-full rounded-full transition-all duration-700 ${pred.bullish ? 'bg-gain' : 'bg-loss'}"
                            style="width:${pred.confidence}%"></div>
                        </div>
                        <span class="text-[10px] text-text-muted tabular-nums">${pred.confidence}%</span>
                      </div>
                    </div>
                    <p class="text-[10px] text-text-muted leading-relaxed border-t border-border pt-2">
                      Based on linear trend analysis of the last 20 sessions. Not financial advice.
                    </p>
                  </div>
                ` : `
                  <div class="space-y-3">
                    <button id="sim-pred-run"
                      class="w-full py-2.5 px-3 rounded-xl bg-accent-secondary/10 border border-accent-secondary/30
                             text-accent-secondary text-xs font-semibold hover:bg-accent-secondary/20 transition-colors flex items-center justify-center gap-2">
                      &#9889; AI Prediction &mdash; ${_symbol}
                    </button>
                    <p class="text-[10px] text-text-muted leading-relaxed">
                      ${_started ? 'Need at least 10 candles to generate a prediction.' : 'Start a simulation first to generate a prediction.'}
                    </p>
                  </div>
                `}
              </div>
            ` : ''}
          </div>

          <!-- How it works -->
          <div class="bg-surface border border-border rounded-2xl p-4">
            <h4 class="text-xs font-semibold text-text-primary mb-2">How It Works</h4>
            <ol class="space-y-1.5 text-[11px] text-text-muted leading-relaxed list-none">
              <li class="flex gap-2"><span class="text-accent-primary font-bold shrink-0">1.</span> Pick a stock and date range</li>
              <li class="flex gap-2"><span class="text-accent-primary font-bold shrink-0">2.</span> Click Start to generate simulated historical prices</li>
              <li class="flex gap-2"><span class="text-accent-primary font-bold shrink-0">3.</span> See how ${pc(STARTING_CASH)} invested at the start would have performed</li>
              <li class="flex gap-2"><span class="text-accent-primary font-bold shrink-0">4.</span> Use AI Prediction to see the 30-day trend forecast</li>
            </ol>
          </div>

        </div>
      </div>
    </div>
  `

  // ── Event bindings ────────────────────────────────────────────────────────────

  container.querySelector('#sim-symbol')?.addEventListener('change', e => {
    _symbol   = e.target.value
    _candles  = []
    _started  = false
    _simStartPx = 0
    _render()
  })

  container.querySelector('#sim-start')?.addEventListener('change', e => { _startDate = e.target.value })
  container.querySelector('#sim-end')?.addEventListener('change',   e => { _endDate   = e.target.value })

  container.querySelector('#sim-run')?.addEventListener('click', () => {
    if (!_startDate || !_endDate) return
    const s = new Date(_startDate), e = new Date(_endDate)
    if (s >= e) return

    _candles    = _genOHLC(_symbol, s, e)
    _simStartPx = _candles[0]?.open ?? 0
    _started    = true
    _render()
    setTimeout(_initChart, 0)
  })

  container.querySelector('#sim-pred-toggle')?.addEventListener('click', () => {
    _predOpen = !_predOpen
    _render()
    if (_started) setTimeout(_drawChart, 0)
  })

  container.querySelector('#sim-pred-run')?.addEventListener('click', () => {
    // Just re-renders — shows "need more candles" message if not enough data
    _render()
    if (_started) setTimeout(_drawChart, 0)
  })

  if (_started && _candles.length) {
    setTimeout(_initChart, 0)
  }
}

function _initChart() {
  _drawChart()
  _resizeObs?.disconnect()
  const wrap = container?.querySelector('#sim-chart-wrap')
  if (wrap) {
    _resizeObs = new ResizeObserver(() => _drawChart())
    _resizeObs.observe(wrap)
  }
}
