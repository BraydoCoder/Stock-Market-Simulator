import { PROFILES } from '../data/stockProfiles.js'
import { pc, pct } from '../utils/format.js'

// Seeded pseudo-random for deterministic fake fundamentals
function sr(symbol, offset) {
  let h = offset | 0
  for (let i = 0; i < symbol.length; i++) h = (Math.imul(31, h) + symbol.charCodeAt(i)) | 0
  return (Math.abs(h) % 10000) / 10000
}

function fmt(n, suffix = '') {
  if (Math.abs(n) >= 1e12) return (n / 1e12).toFixed(2) + 'T' + suffix
  if (Math.abs(n) >= 1e9)  return (n / 1e9).toFixed(2)  + 'B' + suffix
  if (Math.abs(n) >= 1e6)  return (n / 1e6).toFixed(2)  + 'M' + suffix
  return n.toFixed(2) + suffix
}

function fundamentals(stock, price) {
  const s = stock.symbol
  // Valuation
  const pe     = (8  + sr(s, 1)  * 52).toFixed(2)
  const ps     = (1  + sr(s, 2)  * 24).toFixed(2)
  const pb     = (1  + sr(s, 3)  * 29).toFixed(2)
  const pcf    = (5  + sr(s, 4)  * 40).toFixed(2)
  const pfcf   = (8  + sr(s, 5)  * 45).toFixed(2)
  const evEbitda = (8 + sr(s, 6) * 35).toFixed(2)
  const sharesB = 0.5 + sr(s, 22) * 29.5
  const mktCap  = price * sharesB * 1e9
  const ev      = mktCap * (0.95 + sr(s, 23) * 0.2)
  // Income
  const revenue     = mktCap / (parseFloat(ps) || 10)
  const grossProfit = revenue * (0.3 + sr(s, 7) * 0.55)
  const opIncome    = revenue * (0.1 + sr(s, 8) * 0.45)
  const netIncome   = opIncome * (0.6 + sr(s, 9) * 0.3)
  const revPerShare = (revenue / (sharesB * 1e9)).toFixed(2)
  const epsDil      = (netIncome / (sharesB * 1e9)).toFixed(2)
  const epsFQ       = (parseFloat(epsDil) / 4).toFixed(2)
  const sharesFloat = sharesB * (0.93 + sr(s, 24) * 0.06)
  // Balance sheet
  const totalAssets = mktCap * (0.4 + sr(s, 10) * 0.9)
  const totalLiab   = totalAssets * (0.2 + sr(s, 11) * 0.5)
  const totalEquity = totalAssets - totalLiab
  const totalDebt   = totalLiab   * (0.4 + sr(s, 12) * 0.4)
  // Cash flow
  const opCF    = netIncome * (1.1 + sr(s, 13) * 0.8)
  const capex   = -opCF * (0.1 + sr(s, 14) * 0.25)
  const freeCF  = opCF + capex
  const invCF   = capex * (2 + sr(s, 15) * 1.5)
  const finCF   = -opCF * (0.3 + sr(s, 16) * 0.5)
  // Profitability
  const grossMgn = (grossProfit / revenue * 100).toFixed(2) + '%'
  const opMgn    = (opIncome    / revenue * 100).toFixed(2) + '%'
  const netMgn   = (netIncome   / revenue * 100).toFixed(2) + '%'
  const preTaxMgn = ((netIncome / 0.78) / revenue * 100).toFixed(2) + '%'
  // Efficiency
  const roa  = (netIncome / totalAssets * 100).toFixed(2) + '%'
  const roe  = (netIncome / Math.abs(totalEquity) * 100).toFixed(2) + '%'
  const roic = ((netIncome + totalDebt * 0.04) / (totalEquity + totalDebt) * 100).toFixed(2) + '%'
  const emp  = PROFILES[s]?.employees ?? '50 K'
  const empNum = parseFloat(emp) * 1000
  const revPerEmp = fmt(revenue / empNum, '')
  const niPerEmp  = fmt(netIncome / empNum, '')
  // Price history (seeded)
  const w52High = (price * (1.08 + sr(s, 5)  * 0.35)).toFixed(2)
  const w52Low  = (price * (0.62 + sr(s, 6)  * 0.28)).toFixed(2)
  const avgVol  = fmt(50e6 + sr(s, 17) * 200e6)
  const beta    = (0.5 + sr(s, 18) * 1.8).toFixed(2)
  const priceTarget = (price * (1.05 + sr(s, 19) * 0.5)).toFixed(2)
  // Dividends
  const highDiv   = stock.risk === 'High'
  const divYield  = highDiv ? (sr(s, 3) * 0.5).toFixed(2) : (sr(s, 3) * 4.5).toFixed(2)
  const divPerShr = (price * parseFloat(divYield) / 100).toFixed(2)

  return {
    mktCap, ev,
    pe, ps, pb, pcf, pfcf, evEbitda,
    revenue, grossProfit, opIncome, netIncome, revPerShare, epsDil, epsFQ,
    sharesB, sharesFloat,
    totalAssets, totalLiab, totalEquity, totalDebt,
    opCF, invCF, finCF, freeCF, capex,
    grossMgn, opMgn, netMgn, preTaxMgn,
    roa, roe, roic, revPerEmp, niPerEmp,
    w52High, w52Low, avgVol, beta, priceTarget,
    divYield, divPerShr,
  }
}

// ── Modal open / close ────────────────────────────────────────────────────────

let _el     = null
let _active = null

export function openStockInfoModal(stock, price) {
  if (_el) _el.remove()
  _active = stock

  const profile = PROFILES[stock.symbol] ?? {}
  const f       = fundamentals(stock, price)
  const logoUrl = stock.domain
    ? `https://www.google.com/s2/favicons?domain=${stock.domain}&sz=64`
    : null

  _el = document.createElement('div')
  _el.id = 'stock-info-modal'
  _el.className = 'fixed inset-0 z-[500] flex items-stretch justify-end'

  _el.innerHTML = `
    <!-- Backdrop -->
    <div id="sim-backdrop" class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

    <!-- Drawer -->
    <div class="relative z-10 w-full max-w-3xl bg-bg border-l border-border flex flex-col overflow-hidden
      translate-x-full transition-transform duration-300 ease-out" id="info-drawer">

      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div class="flex items-center gap-3">
          ${logoUrl ? `
            <div class="w-10 h-10 rounded-xl border border-border bg-surface-elevated flex items-center justify-center overflow-hidden">
              <img src="${logoUrl}" alt="${stock.symbol}" class="w-7 h-7 object-contain"
                onerror="this.replaceWith(Object.assign(document.createElement('span'),
                  {className:'text-sm font-bold text-text-muted', textContent:'${stock.symbol[0]}'}))"/>
            </div>` : ''}
          <div>
            <div class="text-lg font-bold text-text-primary leading-none">${stock.symbol}</div>
            <div class="text-xs text-text-muted">${stock.name}</div>
          </div>
        </div>
        <button id="close-info-modal" class="w-8 h-8 rounded-full bg-surface-elevated border border-border
          flex items-center justify-center text-text-muted hover:text-text-primary transition-colors text-lg leading-none">
          ×
        </button>
      </div>

      <!-- Tabs -->
      <div class="flex border-b border-border shrink-0 px-6">
        <button data-tab="profile" class="info-tab py-3 px-1 mr-6 text-sm font-semibold border-b-2 border-accent-primary text-text-primary transition-colors">
          Company Profile
        </button>
        <button data-tab="fundamentals" class="info-tab py-3 px-1 mr-6 text-sm font-semibold border-b-2 border-transparent text-text-muted hover:text-text-primary transition-colors">
          Fundamental Data
        </button>
      </div>

      <!-- Body (scrollable) -->
      <div id="info-body" class="flex-1 overflow-y-auto">

        <!-- PROFILE TAB -->
        <div id="tab-profile" class="p-6 space-y-5">
          <div>
            <h2 class="text-base font-bold text-text-primary uppercase tracking-wide mb-4">Company Profile</h2>
            <div class="h-px bg-border mb-5"></div>
          </div>
          <div class="space-y-2 text-sm">
            <div class="flex gap-2"><span class="text-text-muted w-32 shrink-0">Sector:</span><span class="font-semibold text-text-primary">${stock.sector}</span></div>
            <div class="flex gap-2"><span class="text-text-muted w-32 shrink-0">Industry:</span><span class="font-semibold text-text-primary">${profile.industry ?? '—'}</span></div>
            <div class="flex gap-2"><span class="text-text-muted w-32 shrink-0">Employees (FY):</span><span class="font-semibold text-text-primary">${profile.employees ?? '—'}</span></div>
            <div class="flex gap-2"><span class="text-text-muted w-32 shrink-0">Founded:</span><span class="font-semibold text-text-primary">${profile.founded ?? '—'}</span></div>
            <div class="flex gap-2"><span class="text-text-muted w-32 shrink-0">Headquarters:</span><span class="font-semibold text-text-primary">${profile.hq ?? '—'}</span></div>
          </div>
          <p class="text-sm text-text-secondary leading-relaxed pt-2">${profile.description ?? 'No company description available.'}</p>
        </div>

        <!-- FUNDAMENTALS TAB (hidden by default) -->
        <div id="tab-fundamentals" class="hidden p-6 space-y-6 text-sm">
          <div>
            <h2 class="text-base font-bold text-text-primary uppercase tracking-wide mb-4">Fundamental Data</h2>
            <div class="h-px bg-border mb-5"></div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">

            <!-- LEFT COLUMN -->
            <div class="space-y-6">

              ${fundSection('Valuation', [
                ['Market capitalization',         fmt(f.mktCap)],
                ['Enterprise value',              fmt(f.ev)],
                ['Enterprise value/EBITDA (TTM)', f.evEbitda],
                ['P/E ratio',                     f.pe],
                ['P/S ratio',                     f.ps],
                ['P/B ratio',                     f.pb],
                ['P/CF ratio',                    f.pcf],
                ['P/FCF ratio',                   f.pfcf],
              ])}

              ${fundSection('Income Statement', [
                ['Total revenue (TTM)',         fmt(f.revenue)],
                ['Revenue per share (TTM)',     f.revPerShare],
                ['Gross profit (TTM)',          fmt(f.grossProfit)],
                ['Operating income (TTM)',      fmt(f.opIncome)],
                ['Net income (TTM)',            fmt(f.netIncome)],
                ['EPS diluted (TTM)',           f.epsDil],
                ['EPS diluted (FQ)',            f.epsFQ],
                ['Total shares outstanding',   fmt(f.sharesB * 1e9)],
                ['Shares float',               fmt(f.sharesFloat * 1e9)],
              ])}

              ${fundSection('Balance Sheet', [
                ['Total assets (FQ)',     fmt(f.totalAssets)],
                ['Total liabilities (FQ)',fmt(f.totalLiab)],
                ['Total equity (FQ)',     fmt(f.totalEquity)],
                ['Total debt (FQ)',       fmt(f.totalDebt)],
              ])}

            </div>

            <!-- RIGHT COLUMN -->
            <div class="space-y-6">

              ${fundSection('Cash Flow', [
                ['Operating cash flow (TTM)', fmt(f.opCF)],
                ['Investing cash flow (TTM)', fmt(f.invCF)],
                ['Financing cash flow (TTM)', fmt(f.finCF)],
                ['Free cash flow (TTM)',       fmt(f.freeCF)],
                ['CapEx (TTM)',                fmt(f.capex)],
              ])}

              ${fundSection('Profitability', [
                ['Gross margin (TTM)',   f.grossMgn],
                ['Operating margin (TTM)', f.opMgn],
                ['Pretax margin (TTM)', f.preTaxMgn],
                ['Net margin (TTM)',     f.netMgn],
              ])}

              ${fundSection('Efficiency', [
                ['Return on assets (TTM)',           f.roa],
                ['Return on equity (TTM)',            f.roe],
                ['Return on invested capital (TTM)', f.roic],
                ['Revenue per employee (FY)',         f.revPerEmp + 'M'],
                ['Net income per employee (FY)',      f.niPerEmp  + 'M'],
              ])}

              ${fundSection('Price History', [
                ['Average volume (10 day)', f.avgVol],
                ['1-Year beta',             f.beta],
                ['52 Week high',            f.w52High],
                ['52 Week low',             f.w52Low],
                ['1 year price target',     f.priceTarget],
              ])}

              ${fundSection('Dividends', [
                ['Dividend yield indicated',  f.divYield + '%'],
                ['Dividends per share (FY)',  f.divPerShr],
              ])}

            </div>
          </div>
        </div>

      </div>
    </div>
  `

  document.body.appendChild(_el)

  // Animate in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.getElementById('info-drawer')?.classList.remove('translate-x-full')
    })
  })

  // Tab switching
  _el.querySelectorAll('.info-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      _el.querySelectorAll('.info-tab').forEach(b => {
        const on = b.dataset.tab === btn.dataset.tab
        b.classList.toggle('border-accent-primary', on)
        b.classList.toggle('text-text-primary', on)
        b.classList.toggle('border-transparent', !on)
        b.classList.toggle('text-text-muted', !on)
      })
      document.getElementById('tab-profile')?.classList.toggle('hidden', btn.dataset.tab !== 'profile')
      document.getElementById('tab-fundamentals')?.classList.toggle('hidden', btn.dataset.tab !== 'fundamentals')
    })
  })

  // Close
  document.getElementById('close-info-modal')?.addEventListener('click', closeStockInfoModal)
  document.getElementById('sim-backdrop')?.addEventListener('click', closeStockInfoModal)
}

export function closeStockInfoModal() {
  const drawer = document.getElementById('info-drawer')
  if (drawer) {
    drawer.classList.add('translate-x-full')
    setTimeout(() => { _el?.remove(); _el = null }, 300)
  } else {
    _el?.remove()
    _el = null
  }
  _active = null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fundSection(title, rows) {
  return `
    <div>
      <div class="font-semibold text-text-primary mb-2">${title}</div>
      <div class="space-y-1.5">
        ${rows.map(([label, val]) => `
          <div class="flex justify-between gap-4">
            <span class="text-text-muted">${label}</span>
            <span class="font-semibold text-text-primary tabular-nums">${val}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `
}
