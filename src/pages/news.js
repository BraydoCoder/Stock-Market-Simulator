// news.js — simulated financial news feed
import { getAllPrices } from '../api/prices.js'
import { STOCKS } from '../data/stocks.js'
import { pct, gainClass } from '../utils/format.js'

let container  = null
let activeTag  = 'all'
let refreshInterval = null

export function mountNews(el) {
  container = el
  render()
  refreshInterval = setInterval(render, 30000)
  window.addEventListener('prices-updated', handlePrices)
}

export function unmountNews() {
  clearInterval(refreshInterval)
  refreshInterval = null
  window.removeEventListener('prices-updated', handlePrices)
  container = null
}

function handlePrices() { render() }

// ── Seeded random ─────────────────────────────────────────────────────────────

function hash32(s) {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h
}

function sr(seed, n) {
  return (hash32(`${seed}:${n}`) / 0xFFFFFFFF)
}

// ── News generation ───────────────────────────────────────────────────────────

const SOURCES = ['MarketWatch', 'Bloomberg', 'Reuters', 'CNBC', 'Financial Times', 'Barron\'s', 'The Street', 'Seeking Alpha', 'Investopedia', 'WSJ']

const MARKET_TEMPLATES = [
  'S&P 500 {dir} as investors weigh {macro}',
  'Wall Street {dir} amid {macro} concerns',
  'Dow Jones {dir} following {macro} data',
  'Markets {dir} as Fed signals {rate}',
  'Nasdaq {dir} on {macro} outlook',
  'Stocks {dir} after {macro} report beats expectations',
  'Risk {riskword} mood sweeps markets after {macro}',
  'Indices {dir} as Treasury yields {yielddir}',
]

const STOCK_TEMPLATES = [
  '{name} ({sym}) {dir} after strong quarterly results',
  'Analysts upgrade {name} to Buy; target raised to ${tp}',
  '{name} shares {dir} on {catalyst} announcement',
  '{sym}: Institutional investors increase stake by {pctval}%',
  '{name} reports revenue growth of {pctval}% YoY',
  'Wall Street eyes {sym} ahead of next earnings call',
  '{name} ({sym}) beats EPS estimate by ${epsdelta}',
  '{sym} volume surges {multval}x average on {catalyst}',
  'Short interest in {sym} drops to 12-month low',
  '{name} announces {pctval}% dividend increase',
  'CEO of {name} purchases {shares}K shares open market',
  '{sym} rated Outperform; price target lifted to ${tp}',
]

const SECTOR_TEMPLATES = [
  '{sector} sector leads gains as {catalyst} boosts sentiment',
  '{sector} stocks {dir} amid {macro} headwinds',
  'ETF tracking {sector} sector sees record inflows this week',
  '{sector} earnings season kicks off with mixed results',
  'Rotation into {sector} continues as investors seek {buzzword}',
]

const ECONOMY_TEMPLATES = [
  'CPI data shows inflation {dir} to {inflval}% — markets react',
  'Federal Reserve holds rates steady; Powell hints at {rate}',
  'Jobs report: {jobs}K positions added, unemployment at {urate}%',
  'GDP growth revised to {gdpval}% for Q{qtr}',
  'Treasury yields {yielddir} ahead of FOMC meeting',
  'Consumer confidence index rises to {confval} — best in {months} months',
  'Oil prices {dir} as OPEC+ announces supply {opecd}',
  'Dollar index weakens vs basket of major currencies',
  'ISM Manufacturing PMI comes in at {pmival} vs {pmiexp} expected',
  'Retail sales data surprises to the upside by {beatbps}bps',
]

const CATALYSTS   = ['acquisition', 'partnership', 'product launch', 'restructuring', 'buyback', 'spin-off', 'contract win', 'regulatory approval']
const MACROS      = ['inflation', 'interest rate', 'GDP growth', 'labor market', 'consumer spending', 'trade deficit', 'credit conditions', 'PMI']
const BUZZWORDS   = ['stability', 'yield', 'growth', 'value', 'momentum', 'defensive positioning']
const SECTORS     = ['Technology', 'Healthcare', 'Energy', 'Financials', 'Consumer', 'Industrials', 'Utilities', 'Real Estate', 'Crypto']
const RATE_WORDS  = ['{rate}', 'pause', 'potential cut', 'data-dependent stance', 'higher-for-longer']

const TAGS = ['all', 'Markets', 'Economy', 'Stocks', 'Sector']

function fill(template, seed, prices) {
  const p = prices
  const up   = sr(seed, 'dir') > 0.5
  const sym  = STOCKS[Math.floor(sr(seed, 'sym') * STOCKS.length)]?.symbol ?? 'AAPL'
  const stock = STOCKS.find(s => s.symbol === sym)
  const sp   = p.get(sym)

  return template
    .replace('{dir}',     up ? 'rises' : 'falls')
    .replace('{dir}',     up ? 'rallies' : 'slips')
    .replace('{macro}',   MACROS[Math.floor(sr(seed, 'macro') * MACROS.length)])
    .replace('{rate}',    RATE_WORDS[Math.floor(sr(seed, 'rate') * RATE_WORDS.length)])
    .replace('{riskword}',up ? 'on' : 'off')
    .replace('{yielddir}',up ? 'climb' : 'ease')
    .replace('{catalyst}',CATALYSTS[Math.floor(sr(seed, 'cat') * CATALYSTS.length)])
    .replace('{name}',    stock?.name ?? 'StockCo')
    .replace('{sym}',     sym)
    .replace('{sector}',  SECTORS[Math.floor(sr(seed, 'sec') * SECTORS.length)])
    .replace('{buzzword}',BUZZWORDS[Math.floor(sr(seed, 'buzz') * BUZZWORDS.length)])
    .replace('{tp}',      (Math.floor(sr(seed, 'tp') * 300 + 50)).toString())
    .replace('{epsdelta}',(sr(seed, 'eps') * 0.3 + 0.05).toFixed(2))
    .replace('{pctval}',  (Math.floor(sr(seed, 'pct') * 30 + 5)).toString())
    .replace('{multval}', (Math.floor(sr(seed, 'mul') * 4 + 2)).toString())
    .replace('{shares}',  (Math.floor(sr(seed, 'sh') * 40 + 5)).toString())
    .replace('{inflval}', (sr(seed, 'inf') * 2 + 2.8).toFixed(1))
    .replace('{jobs}',    (Math.floor(sr(seed, 'job') * 200 + 150)).toString())
    .replace('{urate}',   (sr(seed, 'ur') * 1.5 + 3.5).toFixed(1))
    .replace('{gdpval}',  (sr(seed, 'gdp') * 2 + 1.5).toFixed(1))
    .replace('{qtr}',     (Math.floor(sr(seed, 'qtr') * 4 + 1)).toString())
    .replace('{confval}', (Math.floor(sr(seed, 'conf') * 30 + 95)).toString())
    .replace('{months}',  (Math.floor(sr(seed, 'mon') * 18 + 6)).toString())
    .replace('{opecd}',   up ? 'cuts' : 'hike')
    .replace('{pmival}',  (sr(seed, 'pmi') * 10 + 48).toFixed(1))
    .replace('{pmiexp}',  (sr(seed, 'pmie') * 5 + 50).toFixed(1))
    .replace('{beatbps}', (Math.floor(sr(seed, 'bps') * 80 + 20)).toString())
}

function generateArticles(prices) {
  const now  = Date.now()
  const hour = Math.floor(now / (1000 * 60 * 60))
  const articles = []

  // Market articles
  for (let i = 0; i < 6; i++) {
    const seed = `market:${hour}:${i}`
    const tpl  = MARKET_TEMPLATES[Math.floor(sr(seed, 't') * MARKET_TEMPLATES.length)]
    const minsAgo = Math.floor(sr(seed, 'time') * 55 + 1)
    articles.push({
      id: seed, tag: 'Markets', headline: fill(tpl, seed, prices),
      source: SOURCES[Math.floor(sr(seed, 'src') * SOURCES.length)],
      minsAgo, sym: null,
    })
  }

  // Economy articles
  for (let i = 0; i < 5; i++) {
    const seed = `econ:${hour}:${i}`
    const tpl  = ECONOMY_TEMPLATES[Math.floor(sr(seed, 't') * ECONOMY_TEMPLATES.length)]
    const minsAgo = Math.floor(sr(seed, 'time') * 90 + 5)
    articles.push({
      id: seed, tag: 'Economy', headline: fill(tpl, seed, prices),
      source: SOURCES[Math.floor(sr(seed, 'src') * SOURCES.length)],
      minsAgo, sym: null,
    })
  }

  // Stock-specific articles
  const featuredStocks = STOCKS.filter((_, i) => sr(`feat:${hour}`, i) > 0.6).slice(0, 10)
  featuredStocks.forEach((stock, i) => {
    const seed = `stk:${hour}:${stock.symbol}:${i}`
    const tpl  = STOCK_TEMPLATES[Math.floor(sr(seed, 't') * STOCK_TEMPLATES.length)]
    const minsAgo = Math.floor(sr(seed, 'time') * 120 + 2)
    let headline = fill(tpl, seed, prices)
    headline = headline.replace(/{sym}/g, stock.symbol).replace(/{name}/g, stock.name)
    const sp = prices.get(stock.symbol)
    articles.push({
      id: seed, tag: 'Stocks', headline,
      source: SOURCES[Math.floor(sr(seed, 'src') * SOURCES.length)],
      minsAgo, sym: stock.symbol,
      changePct: sp?.changePct ?? 0,
    })
  })

  // Sector articles
  for (let i = 0; i < 4; i++) {
    const seed = `sector:${hour}:${i}`
    const tpl  = SECTOR_TEMPLATES[Math.floor(sr(seed, 't') * SECTOR_TEMPLATES.length)]
    const minsAgo = Math.floor(sr(seed, 'time') * 60 + 10)
    articles.push({
      id: seed, tag: 'Sector', headline: fill(tpl, seed, prices),
      source: SOURCES[Math.floor(sr(seed, 'src') * SOURCES.length)],
      minsAgo, sym: null,
    })
  }

  // Sort by recency
  return articles.sort((a, b) => a.minsAgo - b.minsAgo)
}

// ── Render ────────────────────────────────────────────────────────────────────

function timeLabel(mins) {
  if (mins < 60)  return `${mins}m ago`
  const h = Math.floor(mins / 60)
  return `${h}h ago`
}

const TAG_COLORS = {
  Markets:  'bg-accent-primary/10 text-accent-primary',
  Economy:  'bg-warning/10 text-warning',
  Stocks:   'bg-gain/10 text-gain',
  Sector:   'bg-accent-secondary/10 text-accent-secondary',
}

function render() {
  if (!container) return
  const prices   = getAllPrices()
  const articles = generateArticles(prices)
  const visible  = activeTag === 'all' ? articles : articles.filter(a => a.tag === activeTag)

  // Market pulse bar — top movers
  const topMovers = [...prices.entries()]
    .sort((a, b) => Math.abs(b[1].changePct) - Math.abs(a[1].changePct))
    .slice(0, 8)

  container.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 py-6 space-y-6">

      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-display font-bold text-text-primary">Market News</h1>
        <span class="text-xs text-text-muted">Simulated · Updates every 30s</span>
      </div>

      <!-- Market pulse -->
      <div class="bg-surface border border-border rounded-2xl p-4">
        <div class="text-[10px] text-text-muted uppercase tracking-wide mb-3">Market Pulse — Top Movers</div>
        <div class="flex flex-wrap gap-2">
          ${topMovers.map(([sym, p]) => `
            <a href="#stock-${sym}" class="flex items-center gap-1.5 px-2.5 py-1 bg-surface-elevated border border-border rounded-lg hover:border-accent-primary transition-colors">
              <span class="font-mono text-xs font-bold text-text-primary">${sym}</span>
              <span class="text-[10px] ${gainClass(p.changePct)} tabular-nums">${pct(p.changePct)}</span>
            </a>`).join('')}
        </div>
      </div>

      <!-- Tag filter -->
      <div class="flex gap-1.5 flex-wrap">
        ${TAGS.map(tag => `
          <button data-tag="${tag}" class="tag-btn px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors
            ${activeTag === tag ? 'bg-accent-primary text-bg border-accent-primary' : 'bg-surface border-border text-text-muted hover:text-text-primary'}">
            ${tag === 'all' ? 'All' : tag}
          </button>`).join('')}
      </div>

      <!-- Articles -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">

        <!-- Featured article (first) -->
        ${visible.length > 0 ? (() => {
          const a = visible[0]
          return `
            <div class="lg:col-span-3 bg-surface border border-border rounded-2xl p-6 hover:border-accent-primary/40 transition-colors ${a.sym ? 'cursor-pointer' : ''}"
              ${a.sym ? `data-nav-stock="${a.sym}"` : ''}>
              <div class="flex items-center gap-2 mb-3">
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${TAG_COLORS[a.tag] ?? 'bg-surface-elevated text-text-muted'}">${a.tag}</span>
                ${a.sym ? `<a href="#stock-${a.sym}" class="text-[10px] font-mono font-bold text-accent-primary hover:underline">${a.sym}</a>` : ''}
                ${a.sym && a.changePct != null ? `<span class="text-[10px] ${gainClass(a.changePct)} tabular-nums">${pct(a.changePct)}</span>` : ''}
              </div>
              <h2 class="text-lg font-bold text-text-primary leading-snug mb-3">${a.headline}</h2>
              <div class="flex items-center gap-2 text-xs text-text-muted">
                <span class="font-medium text-text-secondary">${a.source}</span>
                <span>·</span>
                <span>${timeLabel(a.minsAgo)}</span>
              </div>
            </div>`
        })() : ''}

        <!-- Rest of articles -->
        ${visible.slice(1).map(a => `
          <div class="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-2 hover:border-accent-primary/30 transition-colors ${a.sym ? 'cursor-pointer' : ''}"
            ${a.sym ? `data-nav-stock="${a.sym}"` : ''}>
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${TAG_COLORS[a.tag] ?? 'bg-surface-elevated text-text-muted'}">${a.tag}</span>
              ${a.sym ? `<a href="#stock-${a.sym}" class="text-[10px] font-mono font-bold text-accent-primary hover:underline" onclick="event.stopPropagation()">${a.sym}</a>` : ''}
              ${a.sym && a.changePct != null ? `<span class="text-[10px] ${gainClass(a.changePct)} tabular-nums">${pct(a.changePct)}</span>` : ''}
            </div>
            <p class="text-sm font-semibold text-text-primary leading-snug flex-1">${a.headline}</p>
            <div class="flex items-center gap-2 text-[10px] text-text-muted">
              <span class="font-medium text-text-secondary">${a.source}</span>
              <span>·</span>
              <span>${timeLabel(a.minsAgo)}</span>
            </div>
          </div>`).join('')}

      </div>
    </div>
  `

  container.querySelectorAll('.tag-btn').forEach(btn => {
    btn.addEventListener('click', () => { activeTag = btn.dataset.tag; render() })
  })

  container.querySelectorAll('[data-nav-stock]').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') return
      window.location.hash = `#stock-${el.dataset.navStock}`
    })
  })
}
